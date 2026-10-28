"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSecurity({
  weakPasscode,
  recentFailures,
}: {
  weakPasscode: boolean;
  recentFailures: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function revoke() {
    if (
      !window.confirm(
        "Sign out every admin session, including this one? You will need the passphrase again.",
      )
    ) {
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "revoke-sessions" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not revoke sessions.");
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not revoke sessions.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#fffdf7] px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-ink-soft">
        {weakPasscode ? (
          <span className="font-semibold text-[#8a5109]">
            Passphrase is under 12 characters. Rotate ADMIN_PASSCODE before sharing this URL.
          </span>
        ) : (
          <span className="text-[#215c37]">Passphrase meets the 12-character minimum.</span>
        )}
        <span>
          {recentFailures > 0
            ? `${recentFailures} failed login${recentFailures === 1 ? "" : "s"} in the last 15 min`
            : "No failed logins in the last 15 min"}
        </span>
        {error && <span className="text-[#96310f]">{error}</span>}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/api/admin/export"
          className="text-[10px] font-semibold text-accent hover:underline"
        >
          Download data export
        </a>
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="rounded border border-ink px-2.5 py-1 text-[10px] font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "Signing out…" : "Sign out everywhere"}
        </button>
      </div>
    </div>
  );
}
