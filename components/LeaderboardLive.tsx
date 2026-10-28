"use client";

import { useEffect, useState } from "react";
import { DemoTag } from "./DemoTag";
import { ArrowUpRight } from "./icons";
import type { CollegeRow, LeaderboardRow } from "@/lib/types";

type Payload = {
  people: LeaderboardRow[];
  colleges: CollegeRow[];
  stats: {
    total: number;
    verified: number;
    demo: number;
    seats: number;
    colleges: number;
  };
  updatedAt: string;
};

export function LeaderboardLive({ initial }: { initial: Payload }) {
  const [data, setData] = useState(initial);
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<{ rank: number | null; state: "idle" | "loading" | "done" }>({
    rank: null,
    state: "idle",
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as Payload;
        if (alive) setData(next);
      } catch {
        // Keep the last good board.
      }
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 8_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  async function findRank(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      setLookup({ rank: null, state: "idle" });
      return;
    }
    setLookup({ rank: null, state: "loading" });
    try {
      const response = await fetch(`/api/leaderboard?code=${encodeURIComponent(code.trim())}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as { rank?: number | null };
      setLookup({ rank: result.rank ?? null, state: "done" });
    } catch {
      setLookup({ rank: null, state: "done" });
    }
  }

  const maxCollege = Math.max(1, ...data.colleges.map((college) => college.verified));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-ink bg-[#fffdf7] px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2c8a57] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2c8a57]" />
          </span>
          Live · refreshes every 8s
        </div>
        <p className="text-[10.5px] text-ink-faint">
          {data.stats.verified} email verified · {data.stats.total} live signups · {data.stats.demo} demo rows excluded
        </p>
      </div>

      <div className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-accent">People</p>
              <h2 className="display mt-2 text-[36px] leading-none">Top referrers</h2>
            </div>
            <form onSubmit={findRank} className="flex items-center gap-2">
              <input
                className="field !w-[170px] !px-2.5 !py-2 text-[11px]"
                placeholder="Find your code"
                value={code}
                maxLength={40}
                onChange={(event) => setCode(event.target.value)}
              />
              <button type="submit" className="btn btn-ghost !px-3 !py-2 text-[11px]">
                {lookup.state === "loading" ? "…" : "Find"}
              </button>
            </form>
          </div>

          {lookup.state === "done" && (
            <p className="mt-3 rounded-md border border-line bg-[#fffdf7] px-3 py-2 text-[11px] text-ink-soft">
              {lookup.rank
                ? `That code is currently rank #${lookup.rank}. Only verified referrals count.`
                : "No verified rank found for that code yet."}
            </p>
          )}

          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-paper-2">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-14">#</th>
                  <th>Builder</th>
                  <th className="hidden sm:table-cell">College</th>
                  <th className="text-right">Verified refs</th>
                </tr>
              </thead>
              <tbody>
                {data.people.length === 0 && (
                  <tr>
                    <td colSpan={4} className="!py-8 text-center text-[12px] text-ink-soft">
                      No verified referrals yet. The first link shared takes the board.
                    </td>
                  </tr>
                )}
                {data.people.map((person, index) => (
                  <tr key={person.id} className={index < 3 ? "bg-[#fffdf7]" : ""}>
                    <td>
                      <span
                        className={`display text-[28px] leading-none ${
                          index === 0 ? "text-accent" : index < 3 ? "text-ink" : "text-ink-faint"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-semibold">{person.name}</span>
                        {person.is_demo === 1 && <DemoTag />}
                      </div>
                      <p className="mt-0.5 text-[10px] text-ink-faint sm:hidden">
                        {person.college}
                      </p>
                      <p className="mt-0.5 hidden text-[10px] text-ink-faint sm:block">
                        {person.branch}
                      </p>
                    </td>
                    <td className="hidden text-[11.5px] text-ink-soft sm:table-cell">
                      {person.college}
                    </td>
                    <td className="text-right">
                      <span className="display text-[24px] leading-none">{person.referrals}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-[#fffdf7] p-4">
            <p className="max-w-[380px] text-[11px] leading-relaxed text-ink-soft">
              Top five verified referrers win ₹200 each. Duplicate emails, duplicate phones
              and clustered signups are flagged before any reward is paid.
            </p>
            <a href="/#idea-generator" className="btn btn-ghost !px-3 !py-2 text-[11px]">
              Get my link <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        <section>
          <p className="eyebrow text-accent">Colleges</p>
          <h2 className="display mt-2 text-[36px] leading-none">College vs college</h2>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
            Email-confirmed live registrations per college. The leading college gets the showcase slot.
          </p>

          <div className="mt-5 space-y-4">
            {data.colleges.length === 0 && (
              <p className="rounded-md border border-line bg-[#fffdf7] px-3 py-6 text-center text-[11.5px] text-ink-soft">
                No live standings yet. The board opens with the first email-confirmed signup.
              </p>
            )}
            {data.colleges.map((college, index) => (
              <div key={college.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="display w-6 shrink-0 text-[18px] text-ink-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold">
                        {college.name}{" "}
                        {college.demo > 0 && (
                          <span className="ml-1 align-middle text-[8px] font-bold text-ink-faint">
                            DEMO DATA
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-ink-faint">{college.city || "—"}</p>
                    </div>
                  </div>
                  <span className="mono shrink-0 text-[11.5px] text-ink-soft">
                    {college.verified}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e5e0d1]">
                  <div
                    className={`h-full rounded-full ${index === 0 ? "bg-accent" : "bg-ink"}`}
                    style={{
                      width: `${Math.max(4, (college.verified / maxCollege) * 100)}%`,
                      opacity: index === 0 ? 1 : 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[9.5px] leading-relaxed text-ink-faint">
            Only live email-confirmed signups count in these standings. Seeded demo records are excluded from all counts and rankings.
          </p>
        </section>
      </div>
    </div>
  );
}
