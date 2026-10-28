import type { Metadata } from "next";
import Link from "next/link";
import { KitStudio } from "@/components/KitStudio";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ArrowUpRight } from "@/components/icons";
import { workshop } from "@/lib/config";

export const metadata: Metadata = {
  title: "Captain kit — ShipWeek",
  description: "A ready-to-send launch kit for campus captains.",
};

export default function KitPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="relative overflow-hidden border-b border-ink bg-lime">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <div className="shell relative grid gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-16">
            <div>
              <p className="eyebrow text-ink/60">Campus captains</p>
              <h1 className="display mt-3 text-[clamp(52px,7.5vw,92px)]">
                Run your campus.
              </h1>
              <p className="mt-4 max-w-[560px] text-[14.5px] leading-relaxed text-ink/70">
                One link, one target, one kit. Generate the poster caption, the WhatsApp
                pitch, and the answers to the four doubts you will actually hear — then send
                them before the group chat moves on.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="display text-[32px] leading-none">20</p>
                <p className="eyebrow mt-1 text-ink/50">signup target</p>
              </div>
              <div className="border-l border-ink/20 pl-4">
                <p className="display text-[32px] leading-none">₹200</p>
                <p className="eyebrow mt-1 text-ink/50">top-5 reward</p>
              </div>
              <div className="border-l border-ink/20 pl-4">
                <p className="display text-[32px] leading-none">60</p>
                <p className="eyebrow mt-1 text-ink/50">minutes</p>
              </div>
            </div>
          </div>
        </section>

        <section className="shell grid gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
          <KitStudio />

          <aside className="space-y-5">
            <div className="rounded-xl border border-ink bg-[#fffdf7] p-5">
              <p className="eyebrow text-accent">The playbook</p>
              <h2 className="display mt-2 text-[34px] leading-none">
                Three messages, one hour.
              </h2>
              <ol className="mt-5 space-y-4">
                {[
                  {
                    title: "Claim your own seat",
                    body: "You need a link and a rank before you can ask anyone else to join.",
                    href: "/#idea-generator",
                    cta: "Get my seat",
                  },
                  {
                    title: "Post at 9am, pitch at 8pm",
                    body: "The caption goes to your story and class group. The pitch goes to the groups where people reply.",
                  },
                  {
                    title: "Reply with the kit, not a reminder",
                    body: "When someone says \"later\", send the answer to their actual doubt. A reminder without a reply reads like spam.",
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink text-[10px] font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold">{step.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                        {step.body}
                      </p>
                      {step.href && (
                        <Link
                          href={step.href}
                          className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline"
                        >
                          {step.cta} <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-line bg-[#fffdf7] p-5">
              <p className="eyebrow text-ink-faint">Ground rules</p>
              <ul className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-ink-soft">
                <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />Only email-confirmed signups count toward targets, ranks and rewards.</li>
                <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />No fake scarcity: the room is 500 seats and the site says so.</li>
                <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />No scraped numbers, no buying lists, no posting in groups you don't belong to.</li>
                <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />Rewards are {workshop.rewardWinners} × ₹{workshop.rewardPerWinner}, paid after verification review.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-paper-2 p-5">
              <p className="eyebrow text-ink-faint">Why a captain, not an ad</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                A ₹500 boost buys impressions from strangers. A class rep with a real link
                buys trust in a group where people already know each other. That is the whole
                distribution thesis: peer channels first, paid last.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
