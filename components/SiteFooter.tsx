import Link from "next/link";
import { workshop } from "@/lib/config";
import { getPublicStats } from "@/lib/data";

export async function SiteFooter() {
  let demo = 0;
  try {
    demo = (await getPublicStats()).demo;
  } catch {
    demo = 0;
  }

  return (
    <footer className="border-t border-ink bg-ink text-paper">
      <div className="shell py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-[340px]">
            <p className="display text-[38px] leading-none">ShipWeek&nbsp;'26</p>
            <p className="mt-3 text-[13px] leading-relaxed text-paper/65">
              A free 3-day build sprint for final-year students. {workshop.dates}. One
              deployed project, an AI review, and a certificate with its name on it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-[13px] sm:grid-cols-3">
            <div>
              <p className="eyebrow mb-3 text-paper/40">The sprint</p>
              <ul className="space-y-2 text-paper/80">
                <li><Link href="/#sprint" className="hover:text-lime">How it works</Link></li>
                <li><Link href="/#ideas" className="hover:text-lime">Project scope</Link></li>
                <li><Link href="/#faq" className="hover:text-lime">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-3 text-paper/40">Growth</p>
              <ul className="space-y-2 text-paper/80">
                <li><Link href="/leaderboard" className="hover:text-lime">Leaderboard</Link></li>
                <li><Link href="/kit" className="hover:text-lime">Captain kit</Link></li>
                <li><Link href="/admin" className="hover:text-lime">Admin dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-3 text-paper/40">Workshop day</p>
              <ul className="space-y-2 text-paper/80">
                <li><Link href="/#faq" className="hover:text-lime">Submission</Link></li>
                <li><Link href="/#faq" className="hover:text-lime">Certificate</Link></li>
                <li><Link href="/#faq" className="hover:text-lime">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-paper/15 pt-6">
          <p className="text-[11px] leading-relaxed text-paper/45">
            <strong className="text-paper/70">Data disclosure.</strong>{" "}
            {demo > 0 ? (
              <>
                This environment includes {demo} seeded demo registrations and sample project
                submissions. Every seeded row is tagged DEMO, and none of them count toward
                live totals, rankings or rewards. Only email-confirmed live signups do.
              </>
            ) : (
              <>
                Demo data is disabled in this environment; every count here comes from real
                signups. Only email-confirmed signups count toward rankings or rewards.
              </>
            )}{" "}
            Award and pace numbers are planning assumptions, not results. The admin dashboard
            is passcode-gated; set an ADMIN_PASSCODE secret before sharing it.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-paper/40">
            <p>Built with Next.js and Cloudflare D1 · AI calls stay server-side.</p>
            <p className="mono">© {new Date().getFullYear()} ShipWeek</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
