import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoTag } from "@/components/DemoTag";
import { PrintButton } from "@/components/PrintButton";
import { ScoreDial } from "@/components/ScoreDial";
import { getRegistrant, getSubmission } from "@/lib/data";
import type { Evaluation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate — ShipWeek",
  description: "A printable ShipWeek completion certificate.",
};

export default async function CertificatePage({
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

  if (!submission) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-line bg-paper">
          <div className="shell flex h-[64px] items-center justify-between">
            <Link href="/" className="display text-[28px] leading-none">ShipWeek</Link>
            <Link href={`/thank-you/${registrant.ref_code}`} className="text-[12px] text-ink-soft hover:text-ink">
              ← Back to your seat
            </Link>
          </div>
        </header>
        <main className="shell py-24">
          <p className="eyebrow text-accent">Certificate</p>
          <h1 className="display mt-3 max-w-[680px] text-[clamp(44px,7vw,72px)]">
            No project submitted yet.
          </h1>
          <p className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-ink-soft">
            The certificate is generated from your submission. Ship the project, paste the
            live link, and the AI review writes the certificate text around it.
          </p>
          <Link href={`/submit/${registrant.ref_code}`} className="btn btn-primary mt-6">
            Open submission →
          </Link>
        </main>
      </div>
    );
  }

  const certificateId = submission.certificate_id ?? `SW-26-${String(registrant.id).padStart(4, "0")}`;
  const certificateText =
    evaluation?.certificate_text ??
    `Built ${submission.project_title} and shipped it during ShipWeek.`;
  const score = submission.score ?? evaluation?.score ?? null;

  return (
    <div className="certificate-page min-h-screen bg-[#e9e4d6]">
      <div className="no-print border-b border-ink bg-paper">
        <div className="shell flex h-[64px] items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-[28px] leading-none">ShipWeek</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint sm:inline">
              Certificate
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/thank-you/${registrant.ref_code}`}
              className="hidden text-[12px] text-ink-soft hover:text-ink sm:inline"
            >
              ← Back to your seat
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <main className="shell py-8 sm:py-12">
        <div className="certificate-sheet mx-auto max-w-[980px] bg-[#fffdf7] p-2.5 shadow-[8px_8px_0_rgba(22,23,16,0.12)] sm:p-3">
          <div className="relative border border-ink px-5 py-10 sm:px-12 sm:py-12">
            <div className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-accent" />
            <div className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-accent" />
            <div className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-accent" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">ShipWeek '26</p>
              <p className="eyebrow text-ink-faint">Certificate of completion</p>
            </div>

            <div className="mt-10 text-center sm:mt-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-faint">
                This certifies that
              </p>
              <h1 className="display mt-4 text-[clamp(44px,7vw,76px)]">{registrant.name}</h1>
              <p className="mt-3 text-[12px] text-ink-soft">
                {registrant.college} · {registrant.branch} · {registrant.year}
              </p>

              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-faint">
                has shipped a project called
              </p>
              <h2 className="display mx-auto mt-3 max-w-[760px] text-[clamp(28px,4.6vw,44px)] italic text-accent">
                {submission.project_title}
              </h2>
              <p className="mx-auto mt-4 max-w-[620px] text-[12px] leading-relaxed text-ink-soft">
                {certificateText}
              </p>
            </div>

            <div className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-[1fr_1fr_1.2fr] sm:items-end">
              <div className="flex items-center gap-3">
                {score !== null ? (
                  <ScoreDial score={score} size={66} stroke={3} />
                ) : (
                  <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full border border-line text-[11px] text-ink-faint">
                    —
                  </div>
                )}
                <div>
                  <p className="eyebrow text-ink-faint">Project score</p>
                  <p className="mt-1 text-[11px] text-ink-soft">AI-assisted review</p>
                </div>
              </div>

              <div>
                <p className="eyebrow text-ink-faint">Issued</p>
                <p className="mt-1 text-[12px] font-medium">
                  {formatDate(submission.created_at)}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-faint">Workshop: 6–8 Nov 2026</p>
              </div>

              <div className="sm:text-right">
                <p className="display text-[30px] leading-none">ShipWeek</p>
                <div className="mt-1 h-px w-full bg-ink/30" />
                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                  Program team
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-between gap-3 border-t border-line pt-3 text-[9px] text-ink-faint sm:flex-row sm:items-center">
              <p className="mono">
                Certificate ID <span className="text-ink">{certificateId}</span>
              </p>
              <a
                href={submission.project_url}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:text-accent"
              >
                {submission.project_url}
              </a>
              <p>Generated from a submitted project · not transferable</p>
            </div>
          </div>
        </div>

        <div className="no-print mx-auto mt-5 flex max-w-[980px] flex-wrap items-center justify-between gap-3">
          <p className="text-[10.5px] leading-relaxed text-ink-soft">
            This certificate is generated from the submitted project record and the AI review.
            {submission.is_demo === 1 && (
              <span className="ml-2 inline-flex items-center gap-1">
                <DemoTag /> Seeded demo submission.
              </span>
            )}
          </p>
          <p className="mono text-[10px] text-ink-faint">{code}</p>
        </div>
      </main>
    </div>
  );
}
