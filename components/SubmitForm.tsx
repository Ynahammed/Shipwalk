"use client";

import Link from "next/link";
import { useState } from "react";
import type { Evaluation } from "@/lib/types";
import { EvaluationCard } from "./EvaluationCard";
import { ArrowUpRight, SparkIcon } from "./icons";

const SAMPLE = {
  title: "MessMenu AI — hostel mess planner",
  url: "https://messmenu-ai.example.workers.dev",
  description:
    "A one-screen app where a hostel secretary pastes the week's mess menu and gets back a shopping list grouped by vendor, plus a note on which items repeat. It calls a hosted LLM from a server route with a system prompt, validates the JSON response and renders three cards. Built in the 60-minute session with Next.js on Cloudflare Workers; the prompt and the API route are the core logic.",
};

export function SubmitForm({ code }: { code: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [source, setSource] = useState<string>("fallback");
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved">("pending");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 2) return setError("Give your project a name.");
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url.trim()))
      return setError("Paste the full link, starting with https://.");

    setLoading(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, title, url, description }),
      });
      const data = (await response.json()) as {
        evaluation?: Evaluation;
        source?: string;
        reviewStatus?: "pending" | "approved";
        error?: string;
      };
      if (!response.ok || !data.evaluation) {
        throw new Error(data.error ?? "Submission failed. Try again.");
      }
      setEvaluation(data.evaluation);
      setSource(data.source ?? "fallback");
      setReviewStatus(data.reviewStatus ?? "pending");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (evaluation) {
    return (
      <div className="rise">
        <EvaluationCard
          evaluation={evaluation}
          projectTitle={title}
          certificateHref={`/certificate/${code}`}
          source={source}
          status={reviewStatus}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-[#fffdf7] px-4 py-3">
          <p className="text-[11px] leading-relaxed text-ink-soft">
            {reviewStatus === "approved"
              ? "Your organiser has reviewed this submission and the certificate is ready."
              : "Submitted. The organiser reads the project and sets the final score; the certificate appears after that."}
          </p>
          <Link
            href={`/thank-you/${code}`}
            className="text-[11px] font-semibold text-accent hover:underline"
          >
            Back to your seat →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow text-accent">Submit a project</p>
        <button
          type="button"
          onClick={() => {
            setTitle(SAMPLE.title);
            setUrl(SAMPLE.url);
            setDescription(SAMPLE.description);
          }}
          className="text-[10px] font-semibold text-ink-soft underline decoration-line underline-offset-2 hover:text-accent"
        >
          Fill with sample input
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="project-title" className="label">Project name</label>
          <input
            id="project-title"
            className="field"
            value={title}
            maxLength={100}
            placeholder="What did you ship?"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="project-url" className="label">Live project URL</label>
          <input
            id="project-url"
            className="field"
            inputMode="url"
            value={url}
            maxLength={300}
            placeholder="https://your-project.example.com"
            onChange={(event) => setUrl(event.target.value)}
          />
          <p className="mt-1 text-[10px] text-ink-faint">
            Your own deployed link, not this site and not a repo. The reviewer reads the description; it cannot open the link for you.
          </p>
        </div>
        <div>
          <label htmlFor="project-description" className="label">
            What does it do?
          </label>
          <textarea
            id="project-description"
            className="field min-h-[150px] resize-y"
            value={description}
            maxLength={1400}
            placeholder="The problem, the one core loop, the stack, and any real users or testing."
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
            <span>Specific beats polished. At least 60 characters: who uses it and what works.</span>
            <span className="mono">{description.length} / 1400</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary mt-4 w-full">
        {loading ? "Reviewing your project…" : "Submit for review"}
        {!loading && <ArrowUpRight />}
      </button>
      <p className="mt-2.5 flex items-start justify-center gap-1.5 text-center text-[10px] leading-relaxed text-ink-faint">
        <SparkIcon className="mt-0.5 h-3 w-3 shrink-0" />
        One submission per seat. The review takes up to 30 seconds.
      </p>
    </form>
  );
}
