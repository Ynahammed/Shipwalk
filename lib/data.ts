import { adminPasscode, passcodeIsWeak } from "./auth";
import { workshop } from "./config";
import { getDb } from "./db";
import { activeSql, getDataMode, ownSetSql } from "./mode";
import { simulationSummary } from "./simulation";
import type {
  AdminOverview,
  CollegeRow,
  LeaderboardRow,
  PacePoint,
  Registrant,
  SubmissionRow,
} from "./types";

const DAY_MS = 86_400_000;

type TotalsRow = {
  total: number;
  verified: number;
  email_confirmed: number;
  self_confirmed: number;
  admin_confirmed: number;
  legacy_confirmed: number;
  demo: number;
  checked_in: number;
  demo_submissions: number;
  live_submissions: number;
  pending: number;
};

export async function getPublicStats() {
  const db = await getDb();
  const mode = await getDataMode();
  const act = activeSql(mode);
  const [totals, colleges] = await Promise.all([
    db
      .prepare(
        `SELECT COALESCE(SUM(CASE WHEN ${act} THEN 1 ELSE 0 END), 0) AS total,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'self' THEN 1 ELSE 0 END), 0) AS self_confirmed,
                COALESCE(SUM(CASE WHEN is_demo = 1 AND demo_kind = 'demo' THEN 1 ELSE 0 END), 0) AS demo
         FROM registrants`,
      )
      .first<{ total: number; verified: number; self_confirmed: number; demo: number }>(),
    db
      .prepare(`SELECT COUNT(DISTINCT college_id) AS n FROM registrants WHERE ${act}`)
      .first<{ n: number }>(),
  ]);
  return {
    total: totals?.total ?? 0,
    verified: totals?.verified ?? 0,
    selfConfirmed: totals?.self_confirmed ?? 0,
    demo: totals?.demo ?? 0,
    seats: workshop.seats,
    colleges: colleges?.n ?? 0,
    mode,
  };
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const db = await getDb();
  const mode = await getDataMode();
  const { results } = await db
    .prepare(
      `SELECT * FROM (
         SELECT r.id, r.name, r.ref_code, r.branch, r.is_demo, r.created_at,
                r.confirmation_method, c.name AS college,
                (SELECT COUNT(*) FROM registrants x
                  WHERE x.referred_by = r.ref_code AND x.verified = 1
                    AND x.confirmation_method = 'email' AND ${activeSql(mode, "x")}) AS referrals
         FROM registrants r JOIN colleges c ON c.id = r.college_id
         WHERE ${activeSql(mode, "r")} AND r.verified = 1 AND r.confirmation_method = 'email'
       ) WHERE referrals > 0
       ORDER BY referrals DESC, created_at ASC LIMIT ?`,
    )
    .bind(limit)
    .all<LeaderboardRow>();
  return results ?? [];
}

export async function getCollegeRank(limit = 12): Promise<CollegeRow[]> {
  const db = await getDb();
  const mode = await getDataMode();
  const act = activeSql(mode, "r");
  const { results } = await db
    .prepare(
      `SELECT c.id, c.name, c.city,
              COUNT(CASE WHEN ${act} THEN 1 END) AS total,
              COALESCE(SUM(CASE WHEN ${act} AND r.verified = 1 AND r.confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified,
              COALESCE(SUM(CASE WHEN ${act} AND r.verified = 1 AND r.confirmation_method = 'self' THEN 1 ELSE 0 END), 0) AS self_confirmed,
              COALESCE(SUM(CASE WHEN r.is_demo = 1 AND r.demo_kind = 'demo' THEN 1 ELSE 0 END), 0) AS demo
       FROM colleges c LEFT JOIN registrants r ON r.college_id = c.id
       GROUP BY c.id, c.name, c.city
       HAVING COUNT(CASE WHEN ${act} THEN 1 END) > 0
       ORDER BY verified DESC, total DESC, c.name ASC LIMIT ?`,
    )
    .bind(limit)
    .all<CollegeRow>();
  return results ?? [];
}

export async function getRegistrant(code: string): Promise<Registrant | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT r.*, c.name AS college
       FROM registrants r JOIN colleges c ON c.id = r.college_id
       WHERE r.ref_code = ? LIMIT 1`,
    )
    .bind(code)
    .first<Registrant>();
  return row ?? null;
}

export async function getSeatNumber(code: string): Promise<number> {
  const db = await getDb();
  const owner = await db
    .prepare("SELECT is_demo, demo_kind FROM registrants WHERE ref_code = ? LIMIT 1")
    .bind(code)
    .first<{ is_demo: number; demo_kind: string | null }>();
  if (!owner) return 0;
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM registrants x
       WHERE ${ownSetSql(owner.is_demo, owner.demo_kind, "x")}
         AND x.created_at <= (SELECT created_at FROM registrants WHERE ref_code = ?)`,
    )
    .bind(code)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getSubmission(code: string): Promise<SubmissionRow | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT s.*, r.name, r.ref_code, r.college_id, r.is_demo, r.checked_in
       FROM submissions s JOIN registrants r ON r.id = s.registrant_id
       WHERE r.ref_code = ? LIMIT 1`,
    )
    .bind(code)
    .first<SubmissionRow>();
  return row ?? null;
}

export async function getPaceSeries(): Promise<PacePoint[]> {
  const db = await getDb();
  const mode = await getDataMode();
  const campaignStart = new Date(workshop.campaignStartsAt);
  const istStartDay = new Date(campaignStart.getTime() + 330 * 60_000);
  istStartDay.setUTCHours(0, 0, 0, 0);
  const [daily] = await Promise.all([
    db
      .prepare(
        `SELECT date(created_at, '+5 hours', '+30 minutes') AS day, COUNT(*) AS n
         FROM registrants
         WHERE ${activeSql(mode)} AND created_at >= ? AND created_at <= ?
         GROUP BY day ORDER BY day ASC`,
      )
      .bind(workshop.campaignStartsAt, workshop.campaignEndsAt)
      .all<{ day: string; n: number }>(),
  ]);

  const byDay = new Map((daily.results ?? []).map((r) => [r.day, r.n]));
  let cumulative = 0;
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(istStartDay.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    const count = byDay.get(key) ?? 0;
    cumulative += count;
    return {
      label: `D${i + 1}`,
      date: key,
      count,
      cumulative,
      target: workshop.targetPerDay[i] ?? workshop.seats,
    };
  });
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = await getDb();
  const mode = await getDataMode();
  const act = activeSql(mode);
  const actR = activeSql(mode, "r");
  const actS = activeSql(mode, "s");
  const cutoff24h = new Date(Date.now() - DAY_MS).toISOString();

  const [
    totals,
    collegeCount,
    captainCount,
    submissionCount,
    sources,
    colleges,
    referrers,
    unverifiedList,
    submissions,
    ipFlags,
    deviceFlags,
    demoFunnel,
    liveEvents,
    latestCopilot,
    promptLogs,
    recentErrors,
    recentAdminFailures,
    pace,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT COALESCE(SUM(CASE WHEN ${act} THEN 1 ELSE 0 END), 0) AS total,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS email_confirmed,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'self' THEN 1 ELSE 0 END), 0) AS self_confirmed,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'admin' THEN 1 ELSE 0 END), 0) AS admin_confirmed,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'legacy' THEN 1 ELSE 0 END), 0) AS legacy_confirmed,
                COALESCE(SUM(CASE WHEN is_demo = 1 AND demo_kind = 'demo' THEN 1 ELSE 0 END), 0) AS demo,
                COALESCE(SUM(CASE WHEN ${act} AND checked_in = 1 THEN 1 ELSE 0 END), 0) AS checked_in,
                COALESCE(SUM(CASE WHEN ${act} AND verified = 0 THEN 1 ELSE 0 END), 0) AS pending,
                (SELECT COUNT(*) FROM submissions WHERE is_demo = 1 AND demo_kind = 'demo') AS demo_submissions,
                (SELECT COUNT(*) FROM submissions WHERE ${activeSql(mode)}) AS live_submissions
         FROM registrants`,
      )
      .first<TotalsRow>(),
    db.prepare(`SELECT COUNT(DISTINCT college_id) AS n FROM registrants WHERE ${act}`).first<{ n: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM captains WHERE registrant_id IN (SELECT id FROM registrants WHERE ${act})`,
      )
      .first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM submissions WHERE ${act}`).first<{ n: number }>(),
    db
      .prepare(
        `SELECT source, COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN verified = 1 AND ${act} AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified
         FROM registrants WHERE ${act} GROUP BY source ORDER BY verified DESC, total DESC`,
      )
      .all<{ source: string; total: number; verified: number }>(),
    db
      .prepare(
        `SELECT c.id, c.name, c.city,
                COUNT(CASE WHEN ${actR} THEN 1 END) AS total,
                COALESCE(SUM(CASE WHEN ${actR} AND r.verified = 1 AND r.confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified,
                COALESCE(SUM(CASE WHEN ${actR} AND r.verified = 1 AND r.confirmation_method = 'self' THEN 1 ELSE 0 END), 0) AS self_confirmed,
                COALESCE(SUM(CASE WHEN r.is_demo = 1 AND r.demo_kind = 'demo' THEN 1 ELSE 0 END), 0) AS demo
         FROM colleges c LEFT JOIN registrants r ON r.college_id = c.id
         GROUP BY c.id, c.name, c.city
         HAVING COUNT(CASE WHEN ${actR} THEN 1 END) > 0
         ORDER BY verified DESC, total DESC`,
      )
      .all<CollegeRow>(),
    db
      .prepare(
        `SELECT * FROM (
           SELECT r.id, r.name, r.ref_code, r.branch, r.is_demo, r.created_at,
                  r.confirmation_method, c.name AS college,
                  (SELECT COUNT(*) FROM registrants x
                    WHERE x.referred_by = r.ref_code AND x.verified = 1
                      AND x.confirmation_method = 'email' AND ${activeSql(mode, "x")}) AS referrals
           FROM registrants r JOIN colleges c ON c.id = r.college_id
           WHERE ${actR} AND r.verified = 1 AND r.confirmation_method = 'email'
         ) WHERE referrals > 0 ORDER BY referrals DESC, created_at ASC LIMIT 10`,
      )
      .all<LeaderboardRow>(),
    db
      .prepare(
        `SELECT r.*, c.name AS college         FROM registrants r
         JOIN colleges c ON c.id = r.college_id
         WHERE r.verified = 0 AND ${actR} ORDER BY r.created_at DESC LIMIT 8`,
      )
      .all<Registrant>(),
    db
      .prepare(
        `SELECT s.*, r.name, r.ref_code, r.college_id, r.checked_in
         FROM submissions s JOIN registrants r ON r.id = s.registrant_id
         WHERE ${actS} AND ${actR}
         ORDER BY CASE WHEN s.review_status = 'approved' THEN 1 ELSE 0 END, s.created_at ASC LIMIT 10`,
      )
      .all<SubmissionRow>(),
    db
      .prepare(
        `SELECT ip_hash AS value, COUNT(*) AS count, MIN(created_at) AS first_at, MAX(created_at) AS last_at
         FROM registrants
         WHERE ${act} AND ip_hash IS NOT NULL AND created_at >= ?
         GROUP BY ip_hash HAVING COUNT(*) >= 3 ORDER BY count DESC LIMIT 8`,
      )
      .bind(cutoff24h)
      .all<{ value: string; count: number; first_at: string; last_at: string }>(),
    db
      .prepare(
        `SELECT device_id AS value, COUNT(*) AS count, MIN(created_at) AS first_at, MAX(created_at) AS last_at
         FROM registrants
         WHERE ${act} AND device_id IS NOT NULL AND created_at >= ?
         GROUP BY device_id HAVING COUNT(*) >= 3 ORDER BY count DESC LIMIT 8`,
      )
      .bind(cutoff24h)
      .all<{ value: string; count: number; first_at: string; last_at: string }>(),
    db
      .prepare(
        `SELECT COALESCE(SUM(visits),0) AS visits, COALESCE(SUM(ideas),0) AS ideas,
                COALESCE(SUM(signup_starts),0) AS starts, COALESCE(SUM(share_clicks),0) AS shares
         FROM demo_funnel`,
      )
      .first<{ visits: number; ideas: number; starts: number; shares: number }>(),
    db
      .prepare(
        `SELECT type, COALESCE(SUM(qty), 0) AS n FROM events WHERE ${activeSql(mode)} GROUP BY type`,
      )
      .all<{ type: string; n: number }>(),
    db
      .prepare(
        "SELECT text, reason, source, created_at FROM recommendations ORDER BY id DESC LIMIT 1",
      )
      .first<{ text: string; reason: string; source: string; created_at: string }>(),
    db
      .prepare(
        `SELECT id, component, source, model, duration_ms, created_at
         FROM prompt_logs ORDER BY id DESC LIMIT 8`,
      )
      .all<AdminOverview["promptLogs"][number]>(),
    db
      .prepare(
        "SELECT id, message, path, digest, created_at FROM error_log ORDER BY id DESC LIMIT 10",
      )
      .all<AdminOverview["errors"][number]>(),
    db
      .prepare("SELECT COUNT(*) AS n FROM admin_attempts WHERE created_at >= ?")
      .bind(new Date(Date.now() - 15 * 60_000).toISOString())
      .first<{ n: number }>(),
    getPaceSeries(),
  ]);

  const eventCounts = new Map((liveEvents.results ?? []).map((e) => [e.type, e.n]));
  const now = Date.now();
  const campaignStart = new Date(workshop.campaignStartsAt).getTime();
  const campaignEnd = new Date(workshop.campaignEndsAt).getTime();
  const campaignStatus = now < campaignStart ? "prelaunch" : now >= campaignEnd ? "closed" : "active";
  const campaignDay = Math.max(1, Math.min(7, Math.floor((now - campaignStart) / DAY_MS) + 1));
  const t = totals ?? {
    total: 0, verified: 0, email_confirmed: 0, self_confirmed: 0,
    admin_confirmed: 0, legacy_confirmed: 0, demo: 0, checked_in: 0, pending: 0,
    demo_submissions: 0, live_submissions: 0,
  };

  const flags = [
    ...(ipFlags.results ?? []).map((f) => ({
      kind: "ip" as const,
      value: f.value,
      count: f.count,
      firstAt: f.first_at,
      lastAt: f.last_at,
    })),
    ...(deviceFlags.results ?? []).map((f) => ({
      kind: "device" as const,
      value: f.value,
      count: f.count,
      firstAt: f.first_at,
      lastAt: f.last_at,
    })),
  ].filter((f) => {
    const span = new Date(f.lastAt).getTime() - new Date(f.firstAt).getTime();
    return span <= 15 * 60 * 1000;
  });

  const demoVisits = demoFunnel?.visits ?? 0;
  const liveVisits = eventCounts.get("visit") ?? 0;
  const simulation = await simulationSummary(db);

  return {
    mode,
    simulation,
    totals: {
      total: t.total,
      verified: t.verified,
      emailConfirmed: t.email_confirmed,
      selfConfirmed: t.self_confirmed,
      adminConfirmed: t.admin_confirmed,
      legacyConfirmed: t.legacy_confirmed,
      unverified: t.pending,
      demo: t.demo,
      live: t.total,
      checkedIn: t.checked_in,
      liveSubmissions: t.live_submissions,
      demoSubmissions: t.demo_submissions,
      colleges: collegeCount?.n ?? 0,
      captains: captainCount?.n ?? 0,
    },
    funnel: {
      visits: liveVisits,
      ideas: eventCounts.get("idea_generated") ?? 0,
      signupStarts: eventCounts.get("signup_start") ?? 0,
      signups: t.total,
      shares: eventCounts.get("share_click") ?? 0,
      demoVisits,
      liveVisits,
    },
    pace,
    campaignStatus,
    campaignDay,
    seatsTarget: workshop.seats,
    sources: sources.results ?? [],
    colleges: colleges.results ?? [],
    topReferrers: referrers.results ?? [],
    unverifiedList: unverifiedList.results ?? [],
    submissions: submissions.results ?? [],
    flags,
    copilot: latestCopilot
      ? {
          text: latestCopilot.text,
          reason: latestCopilot.reason,
          source: latestCopilot.source,
          createdAt: latestCopilot.created_at,
        }
      : null,
    promptLogs: promptLogs.results ?? [],
    demoFunnel: demoVisits,
    errors: recentErrors.results ?? [],
    security: {
      weakPasscode: passcodeIsWeak(await adminPasscode()),
      recentFailures: recentAdminFailures?.n ?? 0,
    },
  };
}

export async function getReferralStats(
  code: string,
): Promise<{ total: number; verified: number }> {
  const db = await getDb();
  const owner = await db
    .prepare("SELECT is_demo, demo_kind FROM registrants WHERE ref_code = ? LIMIT 1")
    .bind(code)
    .first<{ is_demo: number; demo_kind: string | null }>();
  if (!owner) return { total: 0, verified: 0 };
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN verified = 1 AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified
       FROM registrants x WHERE x.referred_by = ? AND ${ownSetSql(owner.is_demo, owner.demo_kind, "x")}`,
    )
    .bind(code)
    .first<{ total: number; verified: number }>();
  return { total: row?.total ?? 0, verified: row?.verified ?? 0 };
}

export async function getLeaderboardRank(code: string): Promise<number | null> {
  const db = await getDb();
  const owner = await db
    .prepare("SELECT is_demo, demo_kind FROM registrants WHERE ref_code = ? LIMIT 1")
    .bind(code)
    .first<{ is_demo: number; demo_kind: string | null }>();
  if (!owner) return null;

  const set = ownSetSql(owner.is_demo, owner.demo_kind, "r");
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM registrants y
           WHERE y.referred_by = ? AND y.verified = 1 AND y.confirmation_method = 'email') AS mine,
         (SELECT COUNT(*) + 1 FROM registrants r
           WHERE ${set} AND r.verified = 1 AND r.confirmation_method = 'email'
             AND (SELECT COUNT(*) FROM registrants x
                   WHERE x.referred_by = r.ref_code AND x.verified = 1
                     AND x.confirmation_method = 'email')
                 > (SELECT COUNT(*) FROM registrants y
                     WHERE y.referred_by = ? AND y.verified = 1 AND y.confirmation_method = 'email')) AS rank`,
    )
    .bind(code, code)
    .first<{ mine: number | null; rank: number }>();
  if (row?.mine == null || row.mine <= 0) return null;
  return row.rank;
}
