"use client";

import { useState } from "react";
import { branches, interests } from "@/lib/config";
import { openSignup } from "@/lib/signup-bus";
import { track } from "@/lib/track";
import type { Idea } from "@/lib/types";
import { ArrowUpRight, SparkIcon } from "./icons";

type ApiResponse = {
  idea?: Idea;
  source?: string;
  error?: string;
};

export function IdeaGenerator() {
  const [branch, setBranch] = useState("CSE");
  const [interest, setInterest] = useState<string>("Campus life");
  const [customInterest, setCustomInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState("");

  const effectiveInterest = customInterest.trim() || interest;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setIdea(null);

    try {
      const response = await fetch("/api/idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ branch, interest: effectiveInterest }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.idea) {
        throw new Error(data.error ?? "Could not generate an idea.");
      }
      setIdea(data.idea);
      setSource(data.source ?? null);
      track("idea_generated", { path: "/#idea-generator" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate an idea.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="idea-generator" className="card scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink bg-ink px-5 py-3 text-paper">
        <div className="flex items-center gap-2">
          <SparkIcon className="h-4 w-4 text-lime" />
          <span className="eyebrow">Project scout</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-paper/45">
          60-second taste
        </span>
      </div>

      <form onSubmit={generate} className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label htmlFor="branch" className="label">
              Your branch
            </label>
            <select
              id="branch"
              className="field appearance-none bg-[#fffdf7]"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
            >
              {branches.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="interest-custom" className="label">
              What are you into?
            </label>
            <input
              id="interest-custom"
              className="field"
              placeholder="Or type your own: music, sports…"
              value={customInterest}
              maxLength={60}
              onChange={(event) => setCustomInterest(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="label">Pick one, or type above</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((option) => {
              const active = !customInterest.trim() && interest === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setInterest(option);
                    setCustomInterest("");
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-paper-2 text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-accent mt-5 w-full">
          {loading ? "Scoping your project…" : "Generate my project idea"}
          {!loading && <ArrowUpRight />}
        </button>

        <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-ink-faint">
          No email needed. Nothing is saved until you claim a seat.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
            {error}
          </p>
        )}
      </form>

      {loading && (
        <div className="border-t border-line px-5 py-6 sm:px-6" aria-live="polite">
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton mt-3 h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded" />
          <div className="mt-5 flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      )}

      {idea && !loading && (
        <div key={idea.title} className="rise border-t border-ink bg-[#fffdf7] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow text-accent">Your 3-day build</p>
            <span
              className="tag"
              title={
                source === "llm"
                  ? "Generated live by the workshop model"
                  : "Curated demo idea; live AI turns on when the owner adds an API key"
              }
            >
              {source === "llm" ? "AI generated" : "Curated demo"}
            </span>
          </div>

          <h3 className="display mt-3 text-[38px] leading-[0.95]">{idea.title}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{idea.pitch}</p>

          <div className="mt-4">
            <p className="eyebrow text-ink-faint">Why it works on a resume</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{idea.why}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {idea.stack.map((tool) => (
              <span key={tool} className="tag">
                {tool}
              </span>
            ))}
          </div>

          <div className="mt-5 space-y-2.5 border-t border-line pt-4">
            {idea.roadmap.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink text-[10px] font-semibold">
                  {index + 1}
                </span>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{step}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openSignup(idea)}
            className="btn btn-primary mt-5 w-full"
          >
            Save this idea &amp; claim a seat
            <ArrowUpRight />
          </button>
          {source !== "llm" && (
            <p className="mt-2 text-center text-[10px] text-ink-faint">
              Idea engine is running the curated demo library. An API key turns on live
              generation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
