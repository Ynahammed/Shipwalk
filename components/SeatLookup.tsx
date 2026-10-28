"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "./icons";

export function SeatLookup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return setError("That email doesn't look right.");
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return setError("Enter the 10-digit mobile number you registered with.");
    }

    setBusy(true);
    try {
      const response = await fetch("/api/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = (await response.json()) as { code?: string; error?: string };
      if (!response.ok || !data.code) {
        throw new Error(data.error ?? "Seat lookup failed. Try again.");
      }
      router.push(`/thank-you/${data.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Seat lookup failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-flat p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lookup-email" className="label">
            Email you registered with
          </label>
          <input
            id="lookup-email"
            type="email"
            className="field"
            autoComplete="email"
            maxLength={160}
            value={email}
            placeholder="you@college.edu"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lookup-phone" className="label">
            Mobile number
          </label>
          <input
            id="lookup-phone"
            type="tel"
            inputMode="numeric"
            className="field"
            autoComplete="tel"
            maxLength={14}
            value={phone}
            placeholder="10-digit number"
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>
        {busy ? "Finding your seat…" : "Open my seat"}
        {!busy && <ArrowUpRight className="h-3.5 w-3.5" />}
      </button>

      <p className="mt-3 text-[10.5px] leading-relaxed text-ink-faint">
        Both fields must match your registration. Nothing else is shown or changed.
      </p>
    </form>
  );
}
