import type { Metadata } from "next";
import Link from "next/link";
import { SeatLookup } from "@/components/SeatLookup";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { workshop } from "@/lib/config";

export const metadata: Metadata = {
  title: "Find your seat — ShipWeek",
  description: "Open your ShipWeek seat, referral link, submission and review status.",
};

const states = [
  {
    title: "Seat and confirmation",
    body: "Whether the seat is held, and whether the emailed link was used to confirm it. Referral ranks count only email-confirmed signups.",
  },
  {
    title: "Referrals and rank",
    body: "Your personal link, how many signups it has brought in, and where you stand on the people and college boards.",
  },
  {
    title: "Submission and review",
    body: "Nothing submitted yet, with the organiser, or reviewed. The page reads the database on every load, so a refresh shows the organiser's decision and the certificate the moment it exists.",
  },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="relative overflow-hidden border-b border-ink bg-[#eee9db]">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
          <div className="shell relative grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:items-start lg:py-16">
            <div>
              <p className="eyebrow text-accent">Your seat</p>
              <h1 className="display mt-3 text-[clamp(48px,7vw,84px)]">
                Find your seat.
              </h1>
              <p className="mt-4 max-w-[540px] text-[14px] leading-relaxed text-ink-soft">
                Everything about your registration lives on one page: your confirmation, your
                referral link, and whether your project has been reviewed. It stays live until
                after the session — open it tomorrow and it shows tomorrow's state, not a
                snapshot from signup day.
              </p>
              <p className="mt-3 max-w-[540px] text-[12px] leading-relaxed text-ink-faint">
                Enter the email and mobile number you signed up with. That is the only way back
                in if you closed the tab or lost the link.
              </p>
            </div>

            <SeatLookup />
          </div>
        </section>

        <section className="shell py-14 lg:py-20">
          <p className="eyebrow text-ink-faint">What the page shows</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {states.map((state, index) => (
              <div key={state.title} className="card-flat p-5">
                <span className="mono text-[10px] text-ink-faint">0{index + 1}</span>
                <h2 className="mt-2 text-[15px] font-semibold">{state.title}</h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{state.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 rounded-xl border border-ink bg-[#fffdf7] p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="eyebrow text-accent">Nothing matches?</p>
              <h2 className="display mt-2 text-[30px] leading-none">
                Sign up first, or ask the organiser.
              </h2>
              <p className="mt-2 max-w-[520px] text-[12px] leading-relaxed text-ink-soft">
                Seats are free and take under a minute. If you registered with a different
                number than you remember, the organiser can look it up before the session on{" "}
                {workshop.dates}.
              </p>
            </div>
            <Link href="/#idea-generator" className="btn btn-primary">
              Claim a seat
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
