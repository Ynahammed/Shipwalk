import Link from "next/link";
import { ArrowUpRight } from "./icons";
import { SimulationBanner } from "./SimulationBanner";

export async function SiteNav() {
  return (
    <>
    <SimulationBanner />
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="display text-[29px] leading-none tracking-tight">ShipWeek</span>
          <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint sm:inline">
            Growth OS
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-soft md:flex">
          <Link href="/#sprint" className="transition-colors hover:text-ink">
            The hour
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-ink">
            Leaderboard
          </Link>
          <Link href="/kit" className="transition-colors hover:text-ink">
            Captain kit
          </Link>
          <Link href="/status" className="transition-colors hover:text-ink">
            My seat
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden text-[12px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Dashboard
          </Link>
          <Link href="/#idea-generator" className="btn btn-primary !px-4 !py-2.5 text-[13px]">
            Claim a seat <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
    </>
  );
}
