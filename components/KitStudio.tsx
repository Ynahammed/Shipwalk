"use client";

import { useState } from "react";
import type { CaptainKit } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { ArrowUpRight, ChatIcon, SparkIcon } from "./icons";

export function KitStudio() {
  const [college, setCollege] = useState("");
  const [branchMix, setBranchMix] = useState("CSE, IT, ECE");
  const [kit, setKit] = useState<CaptainKit | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (college.trim().length < 2) {
      setError("Enter your college name.");
      return;
    }
    setLoading(true);
    setKit(null);
    try {
      const response = await fetch("/api/kit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ college, branchMix }),
      });
      const data = (await response.json()) as {
        kit?: CaptainKit;
        source?: string;
        error?: string;
      };
      if (!response.ok || !data.kit) throw new Error(data.error ?? "Could not build the kit.");
      setKit(data.kit);
      setSource(data.source ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build the kit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={generate} className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-accent">Build a kit</p>
          <span className="tag">Free · edit before sending</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label htmlFor="kit-college" className="label">Your college</label>
            <input
              id="kit-college"
              className="field"
              value={college}
              maxLength={80}
              placeholder="e.g. VNR VJIET"
              onChange={(event) => setCollege(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="kit-mix" className="label">Branch mix</label>
            <input
              id="kit-mix"
              className="field"
              value={branchMix}
              maxLength={120}
              placeholder="CSE, IT, ECE"
              onChange={(event) => setBranchMix(event.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary mt-4 w-full">
          {loading ? "Writing your kit…" : "Generate the captain kit"}
          {!loading && <ArrowUpRight />}
        </button>
        {error && (
          <p className="mt-3 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
            {error}
          </p>
        )}
        <p className="mt-2.5 text-[10px] leading-relaxed text-ink-faint">
          No fake scarcity, no invented prizes. The kit only says what the workshop actually
          offers: 3 days, free, 500 seats, a certificate with the project name.
        </p>
      </form>

      {loading && (
        <div className="card-flat mt-4 space-y-3 p-5">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-20 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      )}

      {kit && !loading && (
        <div className="rise mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow text-ink-faint">Your kit for {college}</p>
            <span className="tag">
              {source === "llm" ? "AI generated" : "Curated demo"}
            </span>
          </div>

          <div className="rounded-xl border border-ink bg-lime p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-ink/55">1 · Poster caption</p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-ink">
                  {kit.poster_caption}
                </p>
              </div>
              <CopyButton
                value={kit.poster_caption}
                label="Copy"
                className="shrink-0 text-[10px] font-semibold text-ink/70 hover:text-ink"
              />
            </div>
          </div>

          <div className="card-flat p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-ink-faint">2 · WhatsApp pitch</p>
                <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-soft">
                  {kit.whatsapp_pitch}
                </p>
              </div>
              <CopyButton
                value={kit.whatsapp_pitch}
                label="Copy"
                className="shrink-0 text-[10px] font-semibold text-accent hover:underline"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-[10px] text-ink-faint">
              <ChatIcon className="h-3.5 w-3.5" />
              Send this as one message, not five. One ask, one link.
            </div>
          </div>

          <div className="card-flat p-5">
            <p className="eyebrow text-ink-faint">3 · Replies to the four doubts</p>
            <div className="mt-3 divide-y divide-line">
              {kit.replies.map((item) => (
                <div key={item.doubt} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-[11.5px] font-semibold">“{item.doubt}”</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{item.reply}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-line bg-[#fffdf7] px-3 py-2.5">
            <SparkIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="text-[10.5px] leading-relaxed text-ink-soft">
              {source === "llm"
                ? "Generated by the workshop model. Read it once before posting."
                : "Curated demo kit. Add the AI key to generate a campus-specific version."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
