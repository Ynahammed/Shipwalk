"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPurgeDemo({ demoCount }: { demoCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function purge() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "purge-demo" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not remove demo data.");
      }
      const data = (await response.json()) as { removed?: number };
      setMessage(`Removed ${data.removed ?? 0} seeded rows.`);
      setConfirming(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove demo data.");
    } finally {
      setPending(false);
    }
  }

  if (demoCount === 0) {
    return (
      <p className="text-[9px] leading-relaxed text-[#96310f]/70">
        No seeded rows remain in this database.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={purge}
            disabled={pending}
            className="rounded border border-[#96310f] px-2 py-1 text-[9px] font-semibold text-[#96310f] disabled:opacity-50"
          >
            {pending ? "Removing…" : "Yes, delete demo rows"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="text-[9px] font-semibold text-[#96310f]/70 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded border border-[#96310f]/40 px-2 py-1 text-[9px] font-semibold text-[#96310f] hover:border-[#96310f]"
        >
          Remove {demoCount} seeded demo rows
        </button>
      )}
      {message && <span className="text-[9px] text-[#215c37]">{message}</span>}
      {error && <span className="text-[9px] text-[#96310f]">{error}</span>}
    </div>
  );
}
