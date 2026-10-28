import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoTag } from "@/components/DemoTag";
import { EvaluationCard } from "@/components/EvaluationCard";
import { SubmitForm } from "@/components/SubmitForm";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowUpRight, Check } from "@/components/icons";
import { getRegistrant, getSubmission } from "@/lib/data";
import type { Evaluation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit your project — ShipWeek",
};

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const registrant = await getRegistrant(code);
  if (!registrant) notFound();
  const submission = await getSubmission(code);

  let evaluation: Evaluation | null = null;
  if (submission?.feedback_json) {
    try {
      evaluation = JSON.parse(submission.feedback_json) as Evaluation;
    } catch {
      evaluation = null;
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="shell flex h-[64px] items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-[28px] leading-none">ShipWeek</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint sm:inline">
              Workshop day
            </span>
          </Link>
          <Link
            href={`/thank-you/${registrant.ref_code}`}
            className="text-[12px] text-ink-soft hover:text-ink"
          >
            ← Back to your seat
          </Link>
        </div>
      </header>

      <main className="shell py-10 lg:py-14">
        {submission ? (
          <div className="mx-auto max-w-[820px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag tag-ink">Submitted</span>
              <span className="tag">{formatDate(submission.created_at)}</span>
              {submission.is_demo === 1 && <DemoTag />}
            </div>
            <h1 className="display mt-4 text-[clamp(46px,7vw,76px)]">
              You shipped it, {registrant.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-ink-soft">
              This is the review the evaluator returned for{" "}
              <strong className="text-ink">{submission.project_title}</strong>. The printable
              certificate is ready.
            </p>

            <div className="mt-7">
              {evaluation ? (
                <EvaluationCard
                  evaluation={evaluation}
                  projectTitle={submission.project_title}
                  certificateHref={`/certificate/${registrant.ref_code}`}
                />
              ) : (
                <div className="card-flat p-6">
                  <p className="eyebrow text-ink-faint">Project score</p>
                  <p className="display mt-2 text-[56px] leading-none">
                    {submission.score ?? "—"}
                    <span className="text-[20px] text-ink-faint"> / 100</span>
                  </p>
                  <Link
                    href={`/certificate/${registrant.ref_code}`}
                    className="btn btn-primary mt-4"
                  >
                    Open certificate <ArrowUpRight />
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href={submission.project_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent hover:underline"
              >
                Open the submitted project <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/leaderboard"
                className="text-[11.5px] text-ink-soft hover:text-ink"
              >
                See the leaderboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow text-accent">Workshop day</p>
              <h1 className="display mt-3 text-[clamp(48px,7vw,80px)]">
                Submit the thing you shipped.
              </h1>
              <p className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-ink-soft">
                A deployed link, one paragraph about the problem and the loop, and you're
                done. The evaluator reads it, scores it, and writes the certificate text
                around your project's name.
              </p>

              <div className="mt-7 rounded-lg border border-line bg-[#fffdf7] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow text-ink-faint">Submitting as</p>
                    <p className="mt-1 text-[13px] font-semibold">{registrant.name}</p>
                    <p className="text-[11px] text-ink-soft">
                      {registrant.college} · {registrant.branch}
                    </p>
                  </div>
                  {registrant.is_demo === 1 && <DemoTag />}
                </div>
              </div>

              <div className="mt-7">
                <p className="eyebrow text-ink-faint">What makes a strong submission</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "A link that opens without a login and works on a phone.",
                    "One core loop, described in plain language.",
                    "Any real evidence: testers, waitlist, a pilot, a number.",
                    "The stack, only if it helps explain what you built.",
                  ].map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2c8a57]" />
                      <span className="text-[12px] leading-relaxed text-ink-soft">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-7 max-w-[460px] text-[10.5px] leading-relaxed text-ink-faint">
                Scores are generated feedback, not a placement guarantee. One submission per
                seat; the certificate ID is permanent. Demo data is labelled everywhere.
              </p>
            </div>

            <SubmitForm code={registrant.ref_code} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
