import Link from "next/link";
import type { Evaluation } from "@/lib/types";
import { ArrowUpRight, Check } from "./icons";
import { ScoreDial } from "./ScoreDial";

export function EvaluationCard({
  evaluation,
  projectTitle,
  certificateHref,
  source,
  status = "approved",
}: {
  evaluation: Evaluation;
  projectTitle: string;
  certificateHref?: string;
  source?: string;
  status?: "pending" | "approved";
}) {
  const pending = status !== "approved";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-5 py-3 text-paper">
        <span className="eyebrow">{pending ? "AI baseline review" : "Project review"}</span>
        <span className="tag !border-paper/20 !bg-paper/10 !text-paper/70">
          {pending ? "Baseline · not final" : source === "llm" ? "AI generated" : "Curated demo review"}
        </span>
      </div>

      <div className="grid gap-5 border-b border-line p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <ScoreDial score={evaluation.score} size={104} stroke={4} />
          <div>
            <p className="eyebrow text-ink-faint">{pending ? "AI baseline" : "Final score"}</p>
            <p className="text-[11px] text-ink-soft">out of 100</p>
          </div>
        </div>
        <div>
          <p className="eyebrow text-ink-faint">Reviewed project</p>
          <h2 className="display mt-1 text-[30px] leading-[1.02]">{projectTitle}</h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
            {pending
              ? "A starting point from the AI, not your result. The organiser reads the project and sets the final score before the certificate is issued."
              : "Judged on shipped scope, evidence of use and how clearly it can be demoed."}
          </p>
        </div>
      </div>

      <div className="border-b border-line p-5 sm:p-6">
        <p className="eyebrow text-ink-faint">Strengths</p>
        <ul className="mt-3 space-y-2.5">
          {evaluation.strengths.map((strength) => (
            <li key={strength} className="flex gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2c8a57]" />
              <p className="text-[12px] leading-relaxed text-ink-soft">{strength}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-b border-line bg-[#fff0e9] p-5 sm:p-6">
        <p className="eyebrow text-accent">One next step</p>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-ink">
          {evaluation.next_step}
        </p>
      </div>

      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="eyebrow text-ink-faint">{pending ? "Status" : "Certificate text"}</p>
          <p className="mt-1 max-w-[440px] text-[11.5px] leading-relaxed text-ink-soft">
            {pending
              ? "Submitted. The organiser reviews the project and issues the certificate with the final score."
              : `“${evaluation.certificate_text}”`}
          </p>
        </div>
        {pending
          ? certificateHref && (
              <Link href={certificateHref} className="btn btn-ghost shrink-0">
                Check review status <ArrowUpRight />
              </Link>
            )
          : certificateHref && (
              <Link href={certificateHref} className="btn btn-primary shrink-0">
                Open certificate <ArrowUpRight />
              </Link>
            )}
      </div>
    </div>
  );
}
