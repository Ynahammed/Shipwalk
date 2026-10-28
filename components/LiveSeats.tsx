"use client";

import { useEffect, useState } from "react";

type Stats = {
  total: number;
  verified: number;
  demo: number;
  seats: number;
  colleges: number;
};

export function LiveSeats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as Stats;
        if (alive) setStats(next);
      } catch {
        // Keep the last known number.
      }
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const percent = Math.min(100, Math.round((stats.total / stats.seats) * 100));

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-soft">Seats claimed</p>
          <p className="display mt-1 text-[48px] leading-[0.9]">
            {stats.total}
            <span className="text-[20px] text-ink-faint"> / {stats.seats}</span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2c8a57] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2c8a57]" />
          </span>
          Live
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5e0d1]">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-ink-faint">
        <span>{percent}% of the room</span>
        <span>
          {stats.demo} seeded demo seats excluded
        </span>
      </div>
    </div>
  );
}
