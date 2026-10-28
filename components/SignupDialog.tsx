"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { branches, years } from "@/lib/config";
import { openSignup, SIGNUP_EVENT } from "@/lib/signup-bus";
import { getDeviceId, track } from "@/lib/track";
import type { Idea } from "@/lib/types";
import { ArrowRight, ArrowUpRight, Check, SparkIcon } from "./icons";

type Fields = {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
};

const initialFields: Fields = {
  name: "",
  email: "",
  phone: "",
  college: "",
  year: "Final year",
  branch: "CSE",
};

export function SignupDialog({
  referrer,
  collegeOptions,
}: {
  referrer: string;
  collegeOptions: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ idea?: Idea | null }>).detail;
      setIdea(detail?.idea ?? null);
      setStep(1);
      setError("");
      setOpen(true);
      track("signup_start", { ref: referrer || undefined, path: "/signup" });
    };
    window.addEventListener(SIGNUP_EVENT, onOpen);
    return () => window.removeEventListener(SIGNUP_EVENT, onOpen);
  }, [referrer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => nameRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open, saving]);

  if (!open) return null;

  const update = (key: keyof Fields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  function continueToStepTwo(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (fields.name.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim()))
      return setError("That email doesn't look right.");
    if (fields.phone.replace(/\D/g, "").length < 10)
      return setError("Enter a 10-digit mobile number.");
    setStep(2);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (fields.college.trim().length < 2) return setError("Enter your college.");
    if (!fields.year || !fields.branch) return setError("Pick your year and branch.");

    setSaving(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ref: referrer,
          deviceId: getDeviceId(),
          idea,
          source: new URLSearchParams(window.location.search).get("utm_source") ?? "direct",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        code?: string;
        emailSent?: boolean;
        error?: string;
      };
      if (!response.ok || !data.code) {
        throw new Error(data.error ?? "Signup failed. Try again.");
      }
      setOpen(false);
      router.push(`/thank-you/${data.code}?new=1&emailSent=${data.emailSent ? 1 : 0}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Signup failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-ink bg-paper-2 shadow-2xl sm:max-w-[600px] sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow text-accent">ShipWeek '26 · Free seat</p>
            <h2 id="signup-title" className="display mt-1 text-[32px] leading-none">
              {step === 1 ? "First, the basics." : "Where do we send it?"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[11px] text-ink-faint">{step} / 2</span>
            <button
              type="button"
              aria-label="Close signup"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
              onClick={() => !saving && setOpen(false)}
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 px-5 pt-4 sm:px-6">
          <span className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-accent" : "bg-line"}`} />
          <span className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-accent" : "bg-line"}`} />
        </div>

        {idea && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-[#e7b2a3] bg-[#fff0e9] px-3 py-2 sm:mx-6">
            <SparkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              Saving <strong className="text-ink">{idea.title}</strong> with your seat. You can
              change your mind later.
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={continueToStepTwo} className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="label">Full name</label>
                <input
                  id="signup-name"
                  ref={nameRef}
                  className="field"
                  autoComplete="name"
                  value={fields.name}
                  maxLength={80}
                  placeholder="Aarav Sharma"
                  onChange={(event) => update("name", event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-email" className="label">Email</label>
                  <input
                    id="signup-email"
                    className="field"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    maxLength={160}
                    placeholder="you@college.edu"
                    onChange={(event) => update("email", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="signup-phone" className="label">Mobile</label>
                  <input
                    id="signup-phone"
                    className="field"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={fields.phone}
                    maxLength={14}
                    placeholder="10-digit number"
                    onChange={(event) => update("phone", event.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary mt-5 w-full">
              Continue <ArrowRight />
            </button>

            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-ink-faint">
              We'll email a confirmation link when email delivery is available. If it isn't,
              you'll be asked to self-confirm; that does not prove you own the address. Phone
              is used for duplicate checks only. No spam, scraped lists or reselling.
            </p>
          </form>
        ) : (
          <form onSubmit={submit} className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signup-college" className="label">College</label>
                <input
                  id="signup-college"
                  className="field"
                  list="college-options"
                  autoComplete="organization"
                  value={fields.college}
                  maxLength={100}
                  placeholder="Start typing or add your college"
                  onChange={(event) => update("college", event.target.value)}
                />
                <datalist id="college-options">
                  {collegeOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <p className="label">Year</p>
                <div className="grid grid-cols-3 gap-2">
                  {years.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => update("year", option)}
                      className={`rounded-md border px-2 py-2.5 text-[12px] font-semibold transition-colors ${
                        fields.year === option
                          ? "border-ink bg-ink text-paper"
                          : "border-line bg-[#fffdf7] text-ink-soft hover:border-ink"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="signup-branch" className="label">Branch</label>
                <select
                  id="signup-branch"
                  className="field appearance-none"
                  value={fields.branch}
                  onChange={(event) => update("branch", event.target.value)}
                >
                  {branches.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {referrer && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-line bg-paper px-3 py-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2c8a57]" />
                <p className="text-[11px] leading-relaxed text-ink-soft">
                  Referred by <strong className="mono text-ink">@{referrer}</strong>. They get
                  credit after you confirm your signup. Self-confirmation can count on the
                  participation board, but does not verify email ownership or qualify for rewards.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-md border border-[#e7b2a3] bg-[#fdece6] px-3 py-2 text-[12px] text-[#96310f]">
                {error}
              </p>
            )}

            <button type="submit" disabled={saving} className="btn btn-accent mt-5 w-full">
              {saving ? "Saving your seat…" : "Claim my free seat"}
              {!saving && <ArrowUpRight />}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="mt-2 w-full px-2 py-2 text-[11px] font-medium text-ink-soft hover:text-ink"
            >
              ← Back to details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ClaimSeatButton({
  children,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => openSignup()}>
      {children}
    </button>
  );
}
