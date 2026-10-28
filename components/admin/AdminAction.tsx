"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAction({
  id,
  action,
  label,
  confirmText,
  className = "text-[10px] font-semibold text-accent hover:underline disabled:opacity-50",
}: {
  id: number;
  action: "verify" | "checkin" | "captain" | "reset-submission" | "delete-registrant";
  label: string;
  confirmText?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Action failed.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={run} disabled={pending} className={className}>
        {pending ? "…" : label}
      </button>
      {error && <span className="ml-1 text-[9px] text-[#96310f]">{error}</span>}
    </span>
  );
}
