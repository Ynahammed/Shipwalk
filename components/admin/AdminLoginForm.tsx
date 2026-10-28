"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "@/components/icons";

export function AdminLoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Login failed.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-[400px]">
      <div className="rounded-xl border border-ink bg-[#fffdf7] p-6 shadow-[5px_5px_0_rgba(22,23,16,0.12)]">
        <p className="eyebrow text-accent">Admin access</p>
        <h1 className="display mt-2 text-[38px] leading-none">Growth OS</h1>
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
          The dashboard holds student contact details. Use the organiser passcode; do not
          share this URL publicly.
        </p>

        <label htmlFor="passcode" className="label mt-5">Passcode</label>
        <input
          id="passcode"
          className="field"
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoFocus
        />

        {error && (
          <p className="mt-3 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[11.5px] text-[#96310f]">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-4 w-full">
          {pending ? "Checking…" : "Open dashboard"} {!pending && <ArrowRight />}
        </button>

        <p className="mt-3 text-center text-[10px] leading-relaxed text-ink-faint">
          Preview build. Use the organiser passcode; set an ADMIN_PASSCODE secret before
          sharing this dashboard.
        </p>
      </div>
    </form>
  );
}
