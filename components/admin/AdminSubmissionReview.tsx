"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The organiser's decision. The AI number is only a starting point shown next
 * to the field; whatever is entered here becomes the score on the certificate.
 */
export function AdminSubmissionReview({
  id,
  baseline,
}: {
  id: number;
  baseline: number | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(baseline === null ? "" : String(baseline));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setError("");
    const value = Number(score);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      setError("0–100 only");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action: "approve-submission", score: value }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Approval failed.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <label htmlFor={`score-${id}`} className="sr-only">
        Final score for this project
      </label>
      <input
        id={`score-${id}`}
        type="number"
        min={0}
        max={100}
        step={1}
        inputMode="numeric"
        value={score}
        onChange={(event) => setScore(event.target.value)}
        className="mono h-7 w-14 rounded border border-line bg-paper px-1.5 text-right text-[11px]"
        placeholder="0-100"
      />
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        className="rounded bg-ink px-2 py-1 text-[10px] font-semibold text-paper disabled:opacity-50"
      >
        {pending ? "…" : "Approve"}
      </button>
      {error && <span className="text-[9px] text-[#96310f]">{error}</span>}
    </div>
  );
}
