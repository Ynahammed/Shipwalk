"use client";

import { useCallback, useEffect, useState } from "react";
import { SparkIcon } from "@/components/icons";

type Move = { text: string; reason: string; source: string; createdAt: string };

export function CopilotCard({ initial }: { initial: Move | null }) {
  const [move, setMove] = useState<Move | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/copilot", { method: "POST" });
      const data = (await response.json()) as {
        move?: { text: string; reason: string };
        source?: string;
        createdAt?: string;
        error?: string;
      };
      if (!response.ok || !data.move) throw new Error(data.error ?? "Copilot failed.");
      setMove({
        text: data.move.text,
        reason: data.move.reason,
        source: data.source ?? "fallback",
        createdAt: data.createdAt ?? new Date().toISOString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Copilot failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initial) generate();
  }, [initial, generate]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink bg-ink px-5 py-3 text-paper">
        <div className="flex items-center gap-2">
          <SparkIcon className="h-4 w-4 text-lime" />
          <span className="eyebrow">Growth copilot</span>
        </div>
        <div className="flex items-center gap-2">
          {move && (
            <span className="tag !border-paper/20 !bg-paper/10 !text-paper/60">
              {move.source === "llm" ? "AI" : "Rule-based fallback"}
            </span>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-full border border-paper/25 px-3 py-1 text-[10px] font-semibold text-paper/80 transition-colors hover:border-lime hover:text-lime disabled:opacity-50"
          >
            {loading ? "Reading the funnel…" : move ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_0.9fr] sm:p-6">
        <div>
          <p className="eyebrow text-accent">Today's move</p>
          {loading && !move ? (
            <div className="mt-3 space-y-2">
              <div className="skeleton h-6 w-full rounded" />
              <div className="skeleton h-6 w-4/5 rounded" />
            </div>
          ) : (
            <p className="display mt-2 text-[27px] leading-[1.12]">
              {move?.text ?? "No recommendation yet."}
            </p>
          )}
          {error && <p className="mt-2 text-[11px] text-[#96310f]">{error}</p>}
        </div>

        <div className="border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="eyebrow text-ink-faint">Why</p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
            {move?.reason ??
              "The copilot reads the current funnel and returns one action with its reason."}
          </p>
          {move && (
            <p className="mt-2 text-[9px] text-ink-faint">
              Logged {new Date(move.createdAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              })}
              {move.source !== "llm" && " · add an AI key for model-written moves"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
