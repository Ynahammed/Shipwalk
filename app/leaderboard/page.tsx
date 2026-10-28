import type { Metadata } from "next";
import Link from "next/link";
import { LeaderboardLive } from "@/components/LeaderboardLive";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ArrowUpRight } from "@/components/icons";
import { workshop } from "@/lib/config";
import { getCollegeRank, getLeaderboard, getPublicStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — ShipWeek",
  description: "Verified referrals by builder and verified registrations by college.",
};

export default async function LeaderboardPage() {
  const [people, colleges, stats] = await Promise.all([
    getLeaderboard(10),
    getCollegeRank(12),
    getPublicStats(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="relative overflow-hidden border-b border-ink bg-[#eee9db]">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
          <div className="shell relative py-12 lg:py-16">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="eyebrow text-accent">Leaderboard</p>
                <h1 className="display mt-3 text-[clamp(52px,8vw,96px)]">The board.</h1>
                <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-ink-soft">
                  Only signups confirmed through the emailed link count in rankings or
                  rewards. Browser self-confirmation and organizer confirmation do not prove
                  email ownership.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <p className="display text-[32px] leading-none">{stats.verified}</p>
                  <p className="eyebrow mt-1 text-ink-faint">verified seats</p>
                </div>
                <div className="border-l border-line pl-4 sm:pl-8">
                  <p className="display text-[32px] leading-none">{stats.colleges}</p>
                  <p className="eyebrow mt-1 text-ink-faint">colleges</p>
                </div>
                <div className="border-l border-line pl-4 sm:pl-8">
                  <p className="display text-[32px] leading-none">₹{workshop.rewardPerWinner * workshop.rewardWinners}</p>
                  <p className="eyebrow mt-1 text-ink-faint">prize pool</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="shell">
          <LeaderboardLive
            initial={{ people, colleges, stats, updatedAt: new Date().toISOString() }}
          />

          <div className="mb-16 grid gap-4 rounded-xl border border-ink bg-[#fffdf7] p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="eyebrow text-accent">Want a row on this board?</p>
              <h2 className="display mt-2 text-[34px] leading-none">
                Generate an idea, claim a seat, get your link.
              </h2>
              <p className="mt-2 max-w-[520px] text-[12px] leading-relaxed text-ink-soft">
                The generator is free and does not need your email. Referral rankings count
                only after the confirmation link sent by email is used.
              </p>
            </div>
            <Link href="/#idea-generator" className="btn btn-primary">
              Claim a seat <ArrowUpRight />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
