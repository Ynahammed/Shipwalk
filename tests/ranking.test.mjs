import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { SCHEMA_STATEMENTS, VIEW_STATEMENTS } from "../lib/schema.ts";

/**
 * Ranking contract tests.
 *
 * These apply the real `SCHEMA_STATEMENTS` / `VIEW_STATEMENTS` from lib/schema.ts
 * to an isolated local SQLite database (via Wrangler) and assert the invariants
 * the app relies on:
 *
 *   - only email-link confirmations qualify for leaderboard rank and rewards
 *   - self-confirmed and organizer-confirmed signups are recorded but excluded
 *   - seeded demo rows never appear in public standings
 *
 * If a view definition regresses, these fail instead of silently inflating a board.
 */

const stateDir = mkdtempSync(join(tmpdir(), "shipweek-test-"));
const schemaFile = join(stateDir, "schema.sql");
const dbName = "freebuff-next-db-local";

const WRANGLER_BIN = join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");

function wrangler(args) {
  // Run Wrangler through Node directly: shelling out to `npx` crashes the
  // process pool on Windows.
  return execFileSync(process.execPath, [WRANGLER_BIN, "d1", "execute", dbName, "--local", "--persist-to", stateDir, "--config", "freebuff.wrangler.jsonc", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runSql(sql) {
  try {
    const output = wrangler(["--json", "--command", sql]);
    const start = output.indexOf("[");
    return JSON.parse(output.slice(start));
  } catch (error) {
    const detail = error?.stderr?.toString?.() ?? error?.message ?? String(error);
    throw new Error(`wrangler failed: ${detail}`);
  }
}

function applySchema() {
  writeFileSync(schemaFile, [...SCHEMA_STATEMENTS, ...VIEW_STATEMENTS].join(";\n") + ";\n");
  try {
    wrangler(["--file", schemaFile]);
  } catch (error) {
    const detail = error?.stderr?.toString?.() ?? error?.message ?? String(error);
    throw new Error(`schema apply failed: ${detail}`);
  }
}

const NOW = "2026-10-29T06:00:00.000Z";

const FIXTURES = `
INSERT INTO colleges (id, name, city, created_at) VALUES
  (1, 'Live College A', 'Hyderabad', '${NOW}'),
  (2, 'Live College B', 'Chennai', '${NOW}'),
  (3, 'Demo Only College', 'Vellore', '${NOW}');

INSERT INTO registrants
  (id, name, email, phone, college_id, year, branch, ref_code, referred_by, source,
   verified, confirmation_method, is_demo, created_at)
VALUES
  (1, 'Mail Referrer', 'mail.referrer@example.org', '9000000001', 1, 'Final year', 'CSE',
   'mail-1', NULL, 'direct', 1, 'email', 0, '${NOW}'),
  (2, 'Mail Referee', 'mail.referee@example.org', '9000000002', 2, 'Final year', 'IT',
   'mail-2', 'mail-1', 'referral', 1, 'email', 0, '${NOW}'),
  (3, 'Self Confirmed', 'self.confirmed@example.org', '9000000003', 1, 'Final year', 'ECE',
   'self-3', 'mail-1', 'referral', 1, 'self', 0, '${NOW}'),
  (4, 'Organizer Confirmed', 'admin.confirmed@example.org', '9000000004', 1, 'Final year', 'CSE',
   'admin-4', 'mail-1', 'referral', 1, 'admin', 0, '${NOW}'),
  (5, 'Still Pending', 'still.pending@example.org', '9000000005', 2, 'Final year', 'CSE',
   'pending-5', 'mail-1', 'referral', 0, 'pending', 0, '${NOW}'),
  (6, 'Seeded Demo', 'seeded.demo@example.org', '9000000006', 3, 'Final year', 'CSE',
   'demo-6', 'mail-1', 'referral', 1, 'demo', 1, '${NOW}');

INSERT INTO captains (registrant_id, target, rewards_eligible, created_at)
VALUES (6, 20, 1, '${NOW}');

INSERT INTO submissions
  (registrant_id, project_title, project_url, description, score, feedback_json,
   certificate_id, is_demo, created_at)
VALUES
  (6, 'Seeded Project', 'https://example.org/demo', NULL, 80, NULL, 'SW-26-0006', 1, '${NOW}');
`;

applySchema();
runSql(FIXTURES);

const RESULTS = runSql(`
  SELECT name FROM sqlite_master WHERE type = 'view' ORDER BY name;

  SELECT name, total, verified, self_confirmed, demo
  FROM college_rank ORDER BY name;

  SELECT ref_code, referrals, confirmation_method, is_demo
  FROM leaderboard ORDER BY ref_code;

  SELECT
    (SELECT COUNT(*) FROM registrants) - (SELECT COALESCE(SUM(is_demo), 0) FROM registrants) AS live_total,
    (SELECT COALESCE(SUM(CASE WHEN verified = 1 AND is_demo = 0 AND confirmation_method = 'email' THEN 1 ELSE 0 END), 0) FROM registrants) AS email_verified,
    (SELECT COALESCE(SUM(CASE WHEN verified = 1 AND is_demo = 0 AND confirmation_method = 'self' THEN 1 ELSE 0 END), 0) FROM registrants) AS self_confirmed,
    (SELECT COALESCE(SUM(CASE WHEN verified = 0 AND is_demo = 0 THEN 1 ELSE 0 END), 0) FROM registrants) AS pending,
    (SELECT COALESCE(SUM(is_demo), 0) FROM registrants) AS demo_rows;

  SELECT
    (SELECT referrals FROM leaderboard WHERE ref_code = 'self-3') AS self_mine,
    (SELECT COUNT(*) + 1 FROM leaderboard
      WHERE referrals > COALESCE((SELECT referrals FROM leaderboard WHERE ref_code = 'self-3'), 0)) AS self_rank;
`);

after(() => {
  rmSync(stateDir, { recursive: true, force: true });
});

describe("ranking views", () => {
  it("creates the three views the app queries", () => {
    const views = RESULTS[0].results.map((row) => row.name);
    assert.deepEqual(views, ["college_rank", "leaderboard", "pace"]);
  });

  it("counts only email-confirmed signups as verified in college standings", () => {
    const colleges = RESULTS[1].results;
    const liveA = colleges.find((row) => row.name === "Live College A");
    assert.ok(liveA, "live college should be ranked");

    // mail-1 is email confirmed; self-3 and admin-4 share the college but must not count.
    assert.equal(liveA.verified, 1, "self and organizer confirmations must not count as verified");
    assert.equal(liveA.total, 3, "total is live signups in the college");
    assert.equal(liveA.self_confirmed, 1);
    assert.equal(liveA.demo, 0, "demo rows must not be attributed to a live college");
  });

  it("omits colleges that only contain seeded demo rows", () => {
    const names = RESULTS[1].results.map((row) => row.name);
    assert.ok(!names.includes("Demo Only College"));
    assert.equal(names.length, 2);
  });

  it("puts only email-confirmed people on the leaderboard", () => {
    const rows = RESULTS[2].results;
    assert.deepEqual(
      rows.map((row) => row.ref_code),
      ["mail-1", "mail-2"],
    );
    assert.ok(rows.every((row) => row.confirmation_method === "email"));
    assert.ok(rows.every((row) => row.is_demo === 0));
  });

  it("credits referrals only when the referee confirmed by email", () => {
    const referrer = RESULTS[2].results.find((row) => row.ref_code === "mail-1");
    // mail-2, self-3, admin-4, pending-5 and demo-6 all used mail-1's link,
    // but only mail-2 has an email confirmation.
    assert.equal(referrer.referrals, 1);
  });

  it("keeps self-confirmed signups off the board and gives them no rank", () => {
    const stats = RESULTS[3].results[0];
    const rank = RESULTS[4].results[0];
    assert.equal(rank.self_mine, null);
    assert.equal(stats.self_confirmed, 1);
    assert.equal(stats.email_verified, 2);
    assert.equal(stats.pending, 1);
    assert.equal(stats.demo_rows, 1);
    assert.equal(stats.live_total, 5, "live total must exclude the seeded demo row");
  });
});

