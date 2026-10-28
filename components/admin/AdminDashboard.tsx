import Link from "next/link";
import { Fragment } from "react";
import { DemoTag } from "@/components/DemoTag";
import { ArrowUpRight, Check, SparkIcon } from "@/components/icons";
import type { AdminOverview, Evaluation } from "@/lib/types";
import { submissionFlags } from "@/lib/submission-signals";
import { maskEmail, percent, timeAgo } from "@/lib/utils";
import { AdminAction } from "./AdminAction";
import { AdminSubmissionReview } from "./AdminSubmissionReview";
import { AdminPurgeDemo } from "./AdminPurgeDemo";
import { AdminSecurity } from "./AdminSecurity";
import { AdminSimulation } from "./AdminSimulation";
import { CopilotCard } from "./CopilotCard";
import { FunnelBars } from "./FunnelBars";
import { LogoutButton } from "./LogoutButton";
import { PaceChart } from "./PaceChart";

const NAV = [
  { href: "#overview", label: "Overview" },
  { href: "#pace", label: "Pace & funnel" },
  { href: "#growth", label: "Sources & colleges" },
  { href: "#workshop", label: "Session" },
  { href: "#ai", label: "AI logs" },
];

function parseEvaluation(json: string | null): Evaluation | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Evaluation;
  } catch {
    return null;
  }
}

function SourceTag({ source }: { source: string }) {
  const cls =
    source === "llm"
      ? "tag !border-[#a9d5b7] !bg-[#eaf5ea] !text-[#215c37]"
      : source === "llm-invalid"
        ? "tag tag-accent"
        : "tag tag-demo";
  return <span className={cls}>{source}</span>;
}

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const { totals, funnel, pace, sources, colleges, topReferrers } = overview;
  const planDay = Math.max(1, Math.min(pace.length, overview.campaignDay));
  const today = pace[planDay - 1];
  const yesterday = pace[planDay - 2];
  const dailyTarget = Math.max(1, (today?.target ?? 500) - (yesterday?.target ?? 0));
  const pacePct = percent(today?.count ?? 0, dailyTarget);
  const seatPct = percent(totals.total, overview.seatsTarget);
  const ideaToSeat = percent(totals.total, funnel.ideas);
  const shareRate = percent(funnel.shares, totals.total);
  const verifiedRate = percent(totals.verified, totals.total);
  const bestSource = sources.find((source) => source.verified > 0)?.source ?? "—";
  const bestCollege = colleges.find((college) => college.verified > 0)?.name ?? "—";
  const maxSource = Math.max(1, ...sources.map((source) => source.total));
  const maxCollege = Math.max(1, ...colleges.map((college) => college.verified));

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper">
        <div className="shell flex min-h-[64px] flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="display text-[30px] leading-none">Growth OS</span>
            <span className="tag !border-paper/20 !bg-paper/10 !text-paper/60">
              ShipWeek '26
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-paper/35 sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10.5px]">
            <Link href="/leaderboard" className="text-paper/55 transition-colors hover:text-lime">
              Public board
            </Link>
            <Link href="/" className="text-paper/55 transition-colors hover:text-lime">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <AdminSimulation
        mode={overview.mode}
        students={overview.simulation.students}
        submissions={overview.simulation.submissions}
        certificates={overview.simulation.certificates}
      />

      {overview.mode === "live" && totals.demo > 0 && (
        <div className="border-b border-[#e7b2a3] bg-[#fdece6]">
          <div className="shell flex flex-wrap items-center justify-between gap-2 py-2.5">
            <p className="text-[10.5px] leading-relaxed text-[#96310f]">
              <strong>Preview dataset.</strong> {totals.demo} seeded demo registrations and{" "}
              {totals.demoSubmissions} sample submissions are excluded from live totals. The funnel below
              uses live events only; {funnel.demoVisits.toLocaleString("en-IN")} seeded visits are examples, not results.
            </p>
            <AdminPurgeDemo demoCount={totals.demo} />
          </div>
        </div>
      )}

      <AdminSecurity
        weakPasscode={overview.security.weakPasscode}
        recentFailures={overview.security.recentFailures}
      />

      <nav className="no-scrollbar overflow-x-auto border-b border-line bg-paper-2">
        <div className="shell flex gap-6 py-2.5">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="shell space-y-6 py-8">
        <section id="overview" className="scroll-mt-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-accent">Daily dashboard</p>
              <h1 className="display mt-2 text-[clamp(38px,5vw,56px)]">
                Where the next 500 come from.
              </h1>
              <p className="mt-2 text-[11.5px] text-ink-soft">
                {
                  new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  })
                }{" "}
                · {totals.live} {overview.mode === "simulation" ? "simulated" : "live"} signups +{" "}
                {totals.demo} demo · campaign plan 500 by day 7
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="tag">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2c8a57] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2c8a57]" />
                </span>
                {overview.mode === "simulation" ? "Simulation data" : "Live data"}
              </span>
              <Link href="/kit" className="tag transition-colors hover:border-ink">
                Captain kit <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card-flat p-4">
              <p className="eyebrow text-ink-faint">Seats claimed</p>
              <p className="display mt-1.5 text-[40px] leading-none">
                {totals.total}
                <span className="text-[18px] text-ink-faint"> / {overview.seatsTarget}</span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9e4d6]">
                <div className="h-full rounded-full bg-accent" style={{ width: `${seatPct}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-ink-soft">
                {totals.verified} email verified · {totals.unverified} pending
                {(totals.selfConfirmed + totals.adminConfirmed + totals.legacyConfirmed) > 0
                  ? ` · ${totals.selfConfirmed + totals.adminConfirmed + totals.legacyConfirmed} other confirmations excluded`
                  : ""}
              </p>
            </div>

            <div className="card-flat p-4">
              <p className="eyebrow text-ink-faint">Today's pace</p>
              <p className="display mt-1.5 text-[40px] leading-none">
                {today?.count ?? 0}
                <span className="text-[18px] text-ink-faint"> / {dailyTarget}</span>
              </p>
              <p className="mt-3 text-[10px] text-ink-soft">
                {pacePct}% of today's target · plan day {planDay}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9e4d6]">
                <div
                  className={`h-full rounded-full ${pacePct >= 100 ? "bg-[#2c8a57]" : "bg-ink"}`}
                  style={{ width: `${Math.min(100, pacePct)}%` }}
                />
              </div>
            </div>

            <div className="card-flat p-4">
              <p className="eyebrow text-ink-faint">Idea → seat</p>
              <p className="display mt-1.5 text-[40px] leading-none">{ideaToSeat}%</p>
              <p className="mt-3 text-[10px] text-ink-soft">
                {funnel.ideas.toLocaleString("en-IN")} ideas ·{" "}
                {funnel.signupStarts.toLocaleString("en-IN")} form starts
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9e4d6]">
                <div className="h-full rounded-full bg-ink" style={{ width: `${ideaToSeat}%` }} />
              </div>
            </div>

            <div className="card-flat p-4">
              <p className="eyebrow text-ink-faint">Share clicks</p>
              <p className="display mt-1.5 text-[40px] leading-none">
                {funnel.shares.toLocaleString("en-IN")}
              </p>
              <p className="mt-3 text-[10px] text-ink-soft">
                {shareRate}% of signups shared · {funnel.visits.toLocaleString("en-IN")} visits
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9e4d6]">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, shareRate * 2)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 divide-x divide-line rounded-lg border border-line bg-paper-2 sm:grid-cols-4">
            {[
              { label: "Colleges", value: totals.colleges, note: bestCollege },
              { label: "Captains", value: totals.captains, note: "target 20 each" },
              { label: "Live submissions", value: totals.liveSubmissions, note: `${totals.demoSubmissions} demo examples excluded` },
              { label: "Email verification rate", value: `${verifiedRate}%`, note: `${totals.unverified} pending` },
            ].map((fact) => (
              <div key={fact.label} className="min-w-0 p-3">
                <p className="eyebrow text-ink-faint">{fact.label}</p>
                <p className="display mt-1 text-[24px] leading-none">{fact.value}</p>
                <p className="mt-1 truncate text-[9px] text-ink-faint">{fact.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <CopilotCard initial={overview.copilot} />
          </div>
        </section>

        <section id="pace" className="grid scroll-mt-24 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="card-flat p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="eyebrow text-ink-faint">Pace</p>
                <h2 className="display mt-1 text-[28px] leading-none">Against the 500 line</h2>
              </div>
              <span className="tag">{seatPct}% of goal</span>
            </div>
            <div className="mt-4">
              <PaceChart pace={pace} todayIndex={planDay - 1} />
            </div>
          </div>

          <div className="card-flat p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="eyebrow text-ink-faint">Funnel</p>
                <h2 className="display mt-1 text-[28px] leading-none">Live campaign funnel</h2>
              </div>
              <span className="tag">Live only · demo excluded</span>
            </div>
            <div className="mt-4">
              <FunnelBars funnel={funnel} simulated={overview.mode === "simulation"} />
            </div>
          </div>
        </section>

        <section id="growth" className="grid scroll-mt-24 gap-4 lg:grid-cols-2">
          <div className="card-flat overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-5">
              <div>
                <p className="eyebrow text-ink-faint">Acquisition</p>
                <h2 className="display mt-1 text-[28px] leading-none">Seats by source</h2>
              </div>
              <p className="text-[10px] text-ink-soft">
                Best email-confirmed: <strong className="capitalize text-ink">{bestSource}</strong>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th className="text-right">Seats</th>
                    <th className="text-right">Email verified</th>
                    <th className="text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.source}>
                      <td>
                        <span className="font-medium capitalize">{source.source}</span>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-[#e9e4d6]">
                          <div
                            className="h-full rounded-full bg-ink/60"
                            style={{ width: `${Math.max(4, (source.total / maxSource) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="mono text-right">{source.total}</td>
                      <td className="mono text-right">{source.verified}</td>
                      <td className="mono text-right text-ink-soft">
                        {percent(source.verified, source.total)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[9px] text-ink-faint">
              First-touch source, captured at signup. Ref links override the source as
              "referral".
            </p>
          </div>

          <div className="card-flat overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-5">
              <div>
                <p className="eyebrow text-ink-faint">College vs college</p>
                <h2 className="display mt-1 text-[28px] leading-none">The campus board</h2>
              </div>
              <p className="max-w-[180px] truncate text-right text-[10px] text-ink-soft">
                Leading: <strong className="text-ink">{bestCollege}</strong>
              </p>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th className="text-right">Email verified</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((college) => (
                    <tr key={college.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium">{college.name}</span>
                          {college.demo > 0 && <DemoTag />}
                        </div>
                        <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-[#e9e4d6]">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{
                              width: `${Math.max(4, (college.verified / maxCollege) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="mono text-right">{college.verified}</td>
                      <td className="mono text-right text-ink-soft">{college.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[9px] text-ink-faint">
              Colleges with demo rows are tagged, but demo rows never change these live
              counts. Captain targets are 20 email-confirmed signups per campus.
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-5">
              <div>
                <p className="eyebrow text-ink-faint">Referral loop</p>
                <h2 className="display mt-1 text-[26px] leading-none">Top referrers</h2>
              </div>
              <Link href="/leaderboard" className="text-[10px] font-semibold text-accent hover:underline">
                Public board
              </Link>
            </div>
            <div className="divide-y divide-line">
              {topReferrers.slice(0, 5).map((person, index) => (
                <div key={person.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="display w-4 text-[16px] text-ink-faint">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold">
                      {person.name} {person.is_demo === 1 && <DemoTag />}
                    </p>
                    <p className="truncate text-[9px] text-ink-faint">{person.college}</p>
                  </div>
                  <span className="mono text-[11px]">{person.referrals}</span>
                </div>
              ))}
              {topReferrers.length === 0 && (
                <p className="px-5 py-6 text-[11px] text-ink-soft">No verified referrals yet.</p>
              )}
            </div>
          </div>

          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-5">
              <div>
                <p className="eyebrow text-ink-faint">Quality control</p>
                <h2 className="display mt-1 text-[26px] leading-none">Confirmation queue</h2>
              </div>
              <span className="tag tag-accent">{totals.unverified}</span>
            </div>
            <div className="max-h-[260px] divide-y divide-line overflow-y-auto">
              {overview.unverifiedList.map((person) => (
                <div key={person.id} className="flex items-center gap-2 px-5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold">
                      {person.name} {person.is_demo === 1 && <DemoTag />}
                    </p>
                    <p className="truncate text-[9px] text-ink-faint">
                      {maskEmail(person.email)} · {timeAgo(person.created_at)}
                    </p>
                  </div>
                  <AdminAction id={person.id} action="verify" label="Confirm signup" />
                  <AdminAction
                    id={person.id}
                    action="delete-registrant"
                    label="Delete"
                    confirmText={`Permanently delete ${person.name} and their submission, events and referral credit? This cannot be undone.`}
                    className="text-[10px] font-semibold text-[#96310f] hover:underline disabled:opacity-50"
                  />
                </div>
              ))}
              {overview.unverifiedList.length === 0 && (
                <div className="flex items-center gap-2 px-5 py-6 text-[11px] text-[#215c37]">                      <Check className="h-3.5 w-3.5" /> Every live signup has a recorded confirmation.
                </div>
              )}
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[9px] text-ink-faint">
              Only email-link confirmations count for referral credit and rankings. Self/organizer confirmations do not verify email ownership.
            </p>
          </div>

          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-5">
              <div>
                <p className="eyebrow text-ink-faint">Fraud review</p>
                <h2 className="display mt-1 text-[26px] leading-none">Flagged patterns</h2>
              </div>
              <span className="tag">{overview.flags.length}</span>
            </div>
            <div className="max-h-[260px] divide-y divide-line overflow-y-auto">
              {overview.flags.map((flag) => {
                const minutes = Math.max(
                  1,
                  Math.round(
                    (new Date(flag.lastAt).getTime() - new Date(flag.firstAt).getTime()) / 60000,
                  ),
                );
                return (
                  <div key={`${flag.kind}-${flag.value}`} className="px-5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                        {flag.kind} cluster
                      </p>
                      <span className="mono text-[9px] text-ink-faint">
                        {flag.count} in {minutes}m
                      </span>
                    </div>
                    <p className="mono mt-0.5 truncate text-[9.5px] text-ink-soft">
                      {flag.value.slice(0, 16)}…
                    </p>
                  </div>
                );
              })}
              {overview.flags.length === 0 && (
                <div className="px-5 py-6">
                  <p className="flex items-center gap-1.5 text-[11px] text-[#215c37]">
                    <Check className="h-3.5 w-3.5" /> No IP or device clusters in the last 24h.
                  </p>
                  <p className="mt-1 text-[9.5px] leading-relaxed text-ink-faint">
                    Signups are rate-limited per IP and device. This queue is review-only; it
                    never auto-bans.
                  </p>
                </div>
              )}
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[9px] text-ink-faint">
              Flag = 3+ live signups from one IP or device within 15 minutes.
            </p>
          </div>
        </section>

        <section id="workshop" className="card-flat scroll-mt-24 overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-5">
            <div>
              <p className="eyebrow text-ink-faint">Session</p>
              <h2 className="display mt-1 text-[30px] leading-none">Submissions and check-in</h2>
            </div>
            <div className="flex gap-4 text-[10px] text-ink-soft">
              <span><strong className="text-ink">{totals.liveSubmissions}</strong> submitted</span>
              <span>
                <strong className="text-ink">
                  {overview.submissions.filter((row) => row.review_status !== "approved").length}
                </strong>{" "}
                awaiting review
              </span>
              <span><strong className="text-ink">{totals.checkedIn}</strong> checked in</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Student</th>
                  <th className="text-right">Score</th>
                  <th>Attendance</th>
                  <th className="text-right">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {overview.submissions.map((submission) => {
                  const evaluation = parseEvaluation(submission.feedback_json);
                  // In simulation mode the listed rows are the demo rows, and the
                  // review flow has to stay usable so the whole loop can be shown.
                  const actionable = overview.mode === "simulation" || submission.is_demo === 0;
                  const flags =
                    actionable
                      ? submissionFlags({
                          title: submission.project_title,
                          description: submission.description ?? "",
                          url: submission.project_url,
                        })
                      : [];
                  return (
                  <Fragment key={submission.id}>
                  <tr>
                    <td>
                      <a
                        href={submission.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold hover:text-accent"
                      >
                        {submission.project_title}
                      </a>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-ink-faint">
                        {submission.is_demo === 1 && <DemoTag />}
                        {submission.certificate_id}
                      </p>
                      <p className="mt-1 max-w-[280px] text-[10px] leading-relaxed text-ink-soft">
                        {submission.description
                          ? submission.description.length > 110
                            ? `${submission.description.slice(0, 110)}…`
                            : submission.description
                          : "No description written."}
                      </p>
                      {flags.length > 0 && (
                        <p
                          className="mt-1.5"
                          title={flags.join("\n")}
                        >
                          <span className="tag !border-[#e2b06a] !bg-[#fdf1dc] !text-[#8a5109]">
                            Check: {flags.length} signal{flags.length === 1 ? "" : "s"}
                          </span>
                        </p>
                      )}
                      {submission.url_status && (
                        <p
                          className={`mt-1 text-[9px] ${
                            submission.url_status.startsWith("ok")
                              ? "text-[#215c37]"
                              : "text-[#96310f]"
                          }`}
                        >
                          Link check: {submission.url_status}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="text-[11px]">{submission.name}</p>
                      <p className="mono text-[9px] text-ink-faint">@{submission.ref_code}</p>
                    </td>
                    <td className="text-right">
                      <span className="display text-[22px]">
                        {submission.review_status === "approved"
                          ? (submission.final_score ?? submission.score ?? "—")
                          : (submission.score ?? "—")}
                      </span>
                      <span className="text-[9px] text-ink-faint"> /100</span>
                      <p className="text-[9px] text-ink-faint">
                        {submission.review_status === "approved"
                          ? "organiser"
                          : `AI baseline${submission.score !== null ? " · unverified" : ""}`}
                      </p>
                    </td>
                    <td>
                      {submission.checked_in ? (
                        <span className="tag !border-[#a9d5b7] !bg-[#eaf5ea] !text-[#215c37]">
                          Checked in
                        </span>
                      ) : (
                        <span className="tag tag-demo">Not checked in</span>
                      )}
                      <div className="mt-1">
                        <AdminAction
                          id={submission.registrant_id}
                          action="checkin"
                          label={submission.checked_in ? "Undo" : "Check in"}
                        />
                      </div>
                    </td>
                    <td className="text-right">
                      {actionable && submission.review_status !== "approved" ? (
                        <AdminSubmissionReview
                          id={submission.registrant_id}
                          baseline={submission.score ?? null}
                        />
                      ) : (
                        submission.ref_code && (
                          <Link
                            href={`/certificate/${submission.ref_code}`}
                            className="text-[10px] font-semibold text-accent hover:underline"
                          >
                            Open
                          </Link>
                        )
                      )}
                      {actionable && (
                        <div className="mt-1">
                          <AdminAction
                            id={submission.registrant_id}
                            action="reset-submission"
                            label="Reset"
                            confirmText={`Delete the review and certificate for "${submission.project_title}"? The student keeps their seat and can submit again.`}
                            className="text-[10px] font-semibold text-[#96310f] hover:underline disabled:opacity-50"
                          />
                          <AdminAction
                            id={submission.registrant_id}
                            action="delete-registrant"
                            label="Delete student"
                            confirmText={`Permanently delete ${submission.name} (${submission.ref_code}) and all their data? This cannot be undone.`}
                            className="ml-2 text-[10px] font-semibold text-[#96310f] hover:underline disabled:opacity-50"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr className="!border-t-0">
                    <td colSpan={5} className="!pt-0">
                      <details className="rounded border border-line bg-paper-2 px-3 py-2">
                        <summary className="cursor-pointer text-[10px] font-semibold text-accent">
                          Read the full submission and AI baseline
                        </summary>
                        <div className="mt-3 grid gap-4 sm:grid-cols-[1.3fr_1fr]">
                          <div>
                            {flags.length > 0 && (
                              <div className="mb-3 rounded border border-[#e2b06a] bg-[#fdf1dc] px-3 py-2">
                                <p className="eyebrow text-[#8a5109]">
                                  Not obviously a 60-minute build
                                </p>
                                <ul className="mt-1 space-y-1">
                                  {flags.map((flag) => (
                                    <li key={flag} className="text-[10.5px] leading-relaxed text-[#7a4a08]">
                                      • {flag}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="eyebrow text-ink-faint">What they wrote</p>
                            <p className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-ink-soft">
                              {submission.description || "No description was provided."}
                            </p>
                            <a
                              href={submission.project_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline"
                            >
                              Open the project <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                          <div>
                            <p className="eyebrow text-ink-faint">
                              AI baseline {submission.score ?? "—"}/100
                            </p>
                            {evaluation ? (
                              <>
                                <ul className="mt-1.5 space-y-1.5">
                                  {evaluation.strengths.map((strength) => (
                                    <li
                                      key={strength}
                                      className="flex gap-1.5 text-[11px] leading-relaxed text-ink-soft"
                                    >
                                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#2c8a57]" />
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">
                                  Suggested next step: {evaluation.next_step}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-[10.5px] text-ink-faint">
                                No baseline review stored for this row.
                              </p>
                            )}
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                  </Fragment>
                  );
                })}
                {overview.submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="!py-8 text-center text-[11px] text-ink-soft">
                      No projects submitted yet. The form is live on every thank-you page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[9px] text-ink-faint">
            Only live submissions are listed here. Seeded sample submissions are excluded from live results and totals; their individual pages are tagged DEMO.
          </p>
        </section>

        <section id="ops" className="card-flat scroll-mt-24 overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-5">
            <div>
              <p className="eyebrow text-ink-faint">Operations</p>
              <h2 className="display mt-1 text-[28px] leading-none">Recent server errors</h2>
            </div>
            <p className="text-[10px] text-ink-soft">
              Captured by the instrumentation hook. Export the data before the event.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Route</th>
                  <th className="text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {overview.errors.map((entry) => (
                  <tr key={entry.id}>
                    <td className="max-w-[420px] truncate text-[11px]" title={entry.message}>
                      {entry.message}
                    </td>
                    <td className="mono text-[10px] text-ink-soft">{entry.path ?? "—"}</td>
                    <td className="text-right text-[10px] text-ink-faint">
                      {timeAgo(entry.created_at)}
                    </td>
                  </tr>
                ))}
                {overview.errors.length === 0 && (
                  <tr>
                    <td colSpan={3} className="!py-6 text-center text-[11px] text-ink-soft">
                      No server errors logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="ai" className="card-flat scroll-mt-24 overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-5">
            <div>
              <p className="eyebrow text-ink-faint">AI + learning notes</p>
              <h2 className="display mt-1 text-[28px] leading-none">Prompt logs</h2>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] text-ink-soft">
              <SparkIcon className="h-3.5 w-3.5 text-accent" />
              Every prompt and output is stored in <code className="mono">prompt_logs</code>.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Source</th>
                  <th>Model</th>
                  <th className="text-right">Latency</th>
                  <th className="text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {overview.promptLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[11.5px] font-medium">{log.component}</td>
                    <td><SourceTag source={log.source} /></td>
                    <td className="mono text-[10px] text-ink-soft">{log.model ?? "—"}</td>
                    <td className="mono text-right text-[10px] text-ink-soft">
                      {log.duration_ms !== null ? `${log.duration_ms}ms` : "—"}
                    </td>
                    <td className="text-right text-[10px] text-ink-faint">
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                ))}
                {overview.promptLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="!py-8 text-center text-[11px] text-ink-soft">
                      No prompts logged yet. Generate an idea or a copilot move first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[9px] leading-relaxed text-ink-faint">
            Fallback rows are logged too, which is how the build knows the AI path was not
            used. Add GROQ_API_KEY as a server secret to switch the five components from
            curated fallbacks to live model calls.
          </p>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-line py-5 text-[9.5px] text-ink-faint sm:flex-row sm:items-center">
          <p>
            {totals.demo} seeded demo registrants and {totals.demoSubmissions} sample submissions are excluded from the {totals.live} live registrants and {totals.liveSubmissions} live submissions.
          </p>
          <p className="mono">Growth OS · ShipWeek '26</p>
        </footer>
      </main>
    </div>
  );
}
