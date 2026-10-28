import Link from "next/link";
import { cookies } from "next/headers";
import { IdeaGenerator } from "@/components/IdeaGenerator";
import { DemoTag } from "@/components/DemoTag";
import { LiveSeats } from "@/components/LiveSeats";
import { RefCapture } from "@/components/RefCapture";
import { SignupDialog, ClaimSeatButton } from "@/components/SignupDialog";
import { ScoreDial } from "@/components/ScoreDial";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ArrowRight, ArrowUpRight, BoltIcon, ChatIcon, SparkIcon } from "@/components/icons";
import { workshop } from "@/lib/config";
import { getCollegeRank, getLeaderboard, getPublicStats } from "@/lib/data";

export const dynamic = "force-dynamic";

const faqs = [
  {
    q: "Is it actually free?",
    a: "Yes. The 3-day sprint, the AI baseline review, the organiser's score and the certificate are free. The only money in the system is a fixed ₹1,000 referral pool for the top five verified referrers. There is no card, no upsell and no paid tier hiding behind the form.",
  },
  {
    q: "I'm not from CSE. Can I build anything?",
    a: "Fine. The projects are software-first, but the problems come from your branch: mess waste, bus timings, clinic queues, attendance, lab scheduling. The idea generator does not filter by coding level, and the 3-day scope is deliberately small enough for one person.",
  },
  {
    q: "I don't have an idea.",
    a: "That is the point of the idea generator. Answer two questions and it gives you one buildable project with a 3-day roadmap. You can change the idea later; the generated idea is a starting point, not a contract.",
  },
  {
    q: "How do the referral rewards work?",
    a: "Every registrant gets a personal link. Only signups confirmed through the emailed link count toward the people and college leaderboards and the ₹200 rewards; browser self-confirmation keeps your seat but does not prove email ownership. One email and one phone number is one entry, and duplicate or clustered signups are flagged before any reward is paid.",
  },
  {
    q: "Do I need to attend all three days?",
    a: "There are no live lectures to miss. You build at your own pace across the three days. You do need to submit a working project by the end of day 3 to get your review and certificate.",
  },
  {
    q: "What does the AI review actually do?",
    a: "It gives you a baseline score out of 100, the strengths it sees and one concrete next step — immediately, as feedback. That number is not your result: the organiser reads every submission, sets the final score, and only then is the certificate issued. Nothing is presented as a placement guarantee.",
  },
  {
    q: "What data do you collect?",
    a: "Name, email, phone, college, year and branch — nothing else. No scraped or purchased contact lists. Email verification gates referral credit, and you can ask the organiser to delete your row at any time.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; verify?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const referrer = (
    params.ref ??
    cookieStore.get("sw_ref")?.value ??
    ""
  ).toLowerCase().slice(0, 40);

  const [stats, leaders, colleges] = await Promise.all([
    getPublicStats(),
    getLeaderboard(5),
    getCollegeRank(12),
  ]);
  const collegeOptions = colleges.map((college) => college.name);
  const topColleges = colleges.slice(0, 4);
  const maxCollege = Math.max(1, ...topColleges.map((college) => college.verified));

  return (
    <div className="min-h-screen">
      <RefCapture />
      <SiteNav />

      {params.verify === "invalid" && (
        <div className="border-b border-[#e7b2a3] bg-[#fdece6]">
          <div className="shell py-2.5 text-[12px] text-[#96310f]">
            That confirmation link is invalid or has already been used. Open your
            thank-you page for a fresh one.
          </div>
        </div>
      )}

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-ink">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-80" />
          <div className="pointer-events-none absolute -right-24 top-10 h-[340px] w-[340px] rounded-full border border-ink/10" />
          <div className="shell relative grid gap-14 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag tag-accent">Free</span>
                <span className="tag">{workshop.dates}</span>
                <span className="tag">3-day build sprint</span>
              </div>

              <h1 className="display mt-6 max-w-[820px] text-[clamp(54px,8.3vw,100px)]">
                Leave with a <em className="italic text-accent">deployed</em> project, not
                another tutorial.
              </h1>

              <p className="mt-6 max-w-[560px] text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
                ShipWeek is a free 3-day sprint for final-year students. Pick a problem,
                build one working thing, and walk out with a live link, an AI baseline review, an
                organiser score, and a certificate that carries your project's name.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="#idea-generator" className="btn btn-primary">
                  Generate my project idea <ArrowUpRight />
                </Link>
                <Link href="/leaderboard" className="btn btn-ghost">
                  See the live board <ArrowRight />
                </Link>
              </div>

              <div className="mt-10 grid max-w-[520px] grid-cols-3 gap-4 border-t border-line pt-5">
                <div>
                  <p className="display text-[30px] leading-none">500</p>
                  <p className="eyebrow mt-1.5 text-ink-faint">seats</p>
                </div>
                <div className="border-l border-line pl-4">
                  <p className="display text-[30px] leading-none">{stats.colleges}</p>
                  <p className="eyebrow mt-1.5 text-ink-faint">colleges</p>
                </div>
                <div className="border-l border-line pl-4">
                  <p className="display text-[30px] leading-none">
                    ₹{workshop.rewardPerWinner * workshop.rewardWinners}
                  </p>
                  <p className="eyebrow mt-1.5 text-ink-faint">referral pool</p>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-4">
              <div className="absolute -right-2 -top-6 z-10 rotate-3 rounded-md border border-ink bg-lime px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-[3px_3px_0_rgba(22,23,16,0.2)]">
                Free · 500 seats
              </div>

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink bg-ink px-5 py-3 text-paper">
                  <div className="flex items-center gap-2">
                    <BoltIcon className="h-3.5 w-3.5 text-lime" />
                    <span className="eyebrow">The board</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-paper/55">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                    </span>
                    Live
                  </span>
                </div>

                <div className="divide-y divide-line">
                  {leaders.length === 0 && (
                    <p className="px-5 py-6 text-[12px] text-ink-soft">
                      The board is empty. Claim the first seat and take the top spot.
                    </p>
                  )}
                  {leaders.map((person, index) => (
                    <div key={person.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="display w-5 shrink-0 text-[20px] text-ink-faint">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold">
                          {person.name}
                          {person.is_demo === 1 && <DemoTag />}
                        </p>
                        <p className="truncate text-[10.5px] text-ink-faint">
                          {person.college} · {person.branch}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="display text-[20px] leading-none">
                          {person.referrals}
                        </span>
                        <span className="ml-1 text-[9px] uppercase tracking-wider text-ink-faint">
                          refs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink bg-[#fffdf7] px-5 py-5">
                  <LiveSeats initial={stats} />
                </div>

                <Link
                  href="/leaderboard"
                  className="flex items-center justify-between border-t border-line px-5 py-3 text-[11.5px] font-semibold transition-colors hover:bg-paper"
                >
                  Full leaderboard, people and colleges
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-b border-ink bg-ink py-3 text-paper">
          <div className="marquee-track flex w-max items-center gap-8">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="eyebrow flex shrink-0 items-center gap-8 text-paper/75"
              >
                {[
                  "Build something real",
                  "3 days",
                  "500 seats",
                  "Free",
                  "Certificate with your project name",
                  "College vs college",
                ].map((item) => (
                  <span key={`${copy}-${item}`} className="flex items-center gap-8">
                    {item}
                    <span className="text-accent">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sprint */}
        <section id="sprint" className="scroll-mt-24 border-b border-line">
          <div className="shell grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div>
              <p className="eyebrow text-accent">The sprint</p>
              <h2 className="display mt-4 max-w-[460px] text-[clamp(40px,5vw,62px)]">
                One problem. Three nights. A live link.
              </h2>
              <p className="mt-5 max-w-[440px] text-[14.5px] leading-relaxed text-ink-soft">
                Nobody needs another certificate for watching a webinar. Final-year students
                need something they can point at in an interview and explain: a small,
                working product with a real user and a real URL.
              </p>
              <div className="mt-8 border-l-2 border-accent pl-5">
                <p className="display max-w-[430px] text-[26px] leading-[1.15]">
                  "The project is the proof. The certificate is just the receipt."
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Pick one problem",
                  body: "A problem you have personally complained about this month. One user, one core loop, one thing that must work in the demo.",
                  tag: "Day 1 · Scope",
                },
                {
                  title: "Build the loop",
                  body: "The shortest path a stranger can click end to end. No dashboards for imaginary admins. Ugly is fine; working is not optional.",
                  tag: "Day 2 · Build",
                },
                {
                  title: "Ship and defend it",
                  body: "Deploy, record a 60-second demo, and submit. The AI gives you a baseline score; the organiser reads it and sets the final one.",
                  tag: "Day 3 · Ship",
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="card-flat group grid grid-cols-[46px_1fr] gap-4 p-5 transition-colors hover:border-ink sm:p-6"
                >
                  <span className="display text-[32px] leading-none text-ink-faint">
                    0{index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[16px] font-semibold">{step.title}</h3>
                      <span className="tag">{step.tag}</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Idea generator */}
        <section id="ideas" className="scroll-mt-24 border-b border-line bg-[#eee9db]">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:py-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow text-accent">The 60-second taste</p>
              <h2 className="display mt-4 text-[clamp(40px,5vw,62px)]">
                Don't pick from a list of clones.
              </h2>
              <p className="mt-5 max-w-[420px] text-[14.5px] leading-relaxed text-ink-soft">
                Most workshop landing pages ask for your email before they give you anything.
                This one gives you the project first: answer two questions, get a buildable
                idea with a 3-day roadmap, and only then decide whether the seat is worth it.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Built for one person and free tiers, not a 6-person team.",
                  "Specific enough to demo in 60 seconds.",
                  "Yours to keep, even if you don't sign up.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-[13px] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-8 inline-flex items-center gap-2 text-[11px] text-ink-faint">
                <SparkIcon className="h-3.5 w-3.5" />
                Generated server-side · no prompt injection surface in the browser
              </div>
            </div>

            <IdeaGenerator />
          </div>
        </section>

        {/* Outcomes */}
        <section className="border-b border-line">
          <div className="shell py-16 lg:py-24">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-accent">What you leave with</p>
                <h2 className="display mt-3 max-w-[640px] text-[clamp(40px,5vw,62px)]">
                  Three things that survive after the weekend.
                </h2>
              </div>
              <p className="max-w-[280px] text-[12.5px] leading-relaxed text-ink-soft">
                Not a folder of screenshots. Three artefacts you can send to a recruiter on
                Monday morning.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="card-flat flex flex-col p-6">
                <div className="rounded-md border border-line bg-ink p-3 text-paper">
                  <div className="flex items-center gap-1.5 border-b border-paper/15 pb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="h-1.5 w-1.5 rounded-full bg-paper/25" />
                    <span className="h-1.5 w-1.5 rounded-full bg-paper/25" />
                    <span className="mono ml-2 truncate text-[9px] text-paper/50">
                      your-project.pages.dev
                    </span>
                  </div>
                  <div className="pt-5">
                    <div className="h-2 w-2/3 rounded-full bg-paper/20" />
                    <div className="mt-2 h-2 w-1/2 rounded-full bg-paper/12" />
                    <div className="mt-4 inline-flex rounded bg-lime px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                      Live demo
                    </div>
                  </div>
                </div>
                <p className="eyebrow mt-6 text-ink-faint">01 · The link</p>
                <h3 className="display mt-2 text-[30px] leading-none">A deployed URL</h3>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                  A working link you can paste into a resume, plus a 60-second demo you have
                  already rehearsed once.
                </p>
              </div>

              <div className="card-flat flex flex-col p-6">
                <div className="flex items-center gap-4 rounded-md border border-line bg-[#fffdf7] p-4">
                  <ScoreDial score={88} size={78} />
                  <div>
                    <p className="eyebrow text-ink-faint">AI review</p>
                    <p className="mt-1 text-[13px] font-semibold">Strong first loop</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                      One fix before the showcase: add a real user quote.
                    </p>
                  </div>
                </div>
                <p className="eyebrow mt-6 text-ink-faint">02 · The read</p>
                <h3 className="display mt-2 text-[30px] leading-none">A specific review</h3>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                  A score, its strengths and one next step. Feedback you can act on, not a
                  gold-star sticker.
                </p>
              </div>

              <div className="card-flat flex flex-col p-6">
                <div className="relative overflow-hidden rounded-md border border-ink bg-[#fffdf7] p-4">
                  <div className="absolute inset-2 rounded border border-line" />
                  <div className="relative px-3 py-4 text-center">
                    <p className="text-[7px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
                      Certificate of completion
                    </p>
                    <p className="display mt-2 text-[25px] leading-none">Your Name</p>
                    <p className="mt-1.5 text-[8px] leading-relaxed text-ink-soft">
                      for shipping <span className="font-semibold text-ink">Your Project</span>
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <span className="h-px w-6 bg-line" />
                      <span className="display text-[10px] text-accent">ShipWeek '26</span>
                      <span className="h-px w-6 bg-line" />
                    </div>
                  </div>
                </div>
                <p className="eyebrow mt-6 text-ink-faint">03 · The receipt</p>
                <h3 className="display mt-2 text-[30px] leading-none">
                  A certificate with your project
                </h3>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                  Your name, the project's name, its live link and the score. Printable to
                  PDF and verifiable by certificate ID.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three days */}
        <section className="border-b border-line bg-[#fffdf7]">
          <div className="shell py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="eyebrow text-accent">How the 3 days run</p>
                <h2 className="display mt-3 text-[clamp(38px,4.6vw,58px)]">
                  Build at your pace. Ship on the same day.
                </h2>
                <p className="mt-4 max-w-[360px] text-[13px] leading-relaxed text-ink-soft">
                  No live lectures. Three evenings of focused work, one submission, one
                  review. The deadline is the only thing on a schedule.
                </p>
              </div>

              <div className="divide-y divide-line border-t border-line">
                {[
                  {
                    day: "01",
                    title: "Scope it",
                    copy: "One user, one problem, one core loop. Cut every screen that exists only to impress a judge.",
                    deliver: "Deliverable: a blank app deployed",
                  },
                  {
                    day: "02",
                    title: "Build the loop",
                    copy: "Make the one path work end to end. Real data, empty states, a loading state that doesn't lie.",
                    deliver: "Deliverable: the demo path works",
                  },
                  {
                    day: "03",
                    title: "Ship it",
                    copy: "Deploy, record 60 seconds, submit. Read the baseline review, fix one thing, then the organiser scores it.",
                    deliver: "Deliverable: live link + review + certificate",
                  },
                ].map((row) => (
                  <div key={row.day} className="grid gap-3 py-7 sm:grid-cols-[70px_1fr_1fr] sm:items-start">
                    <span className="display text-[44px] leading-none text-accent">{row.day}</span>
                    <h3 className="display text-[30px] leading-none">{row.title}</h3>
                    <div>
                      <p className="text-[12.5px] leading-relaxed text-ink-soft">{row.copy}</p>
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                        {row.deliver}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard band */}
        <section className="border-b border-ink bg-ink text-paper">
          <div className="shell grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <p className="eyebrow text-lime">The referral loop</p>
              <h2 className="display mt-4 max-w-[580px] text-[clamp(40px,5.2vw,66px)]">
                Your college is either on this board or it isn't.
              </h2>
              <p className="mt-5 max-w-[480px] text-[14px] leading-relaxed text-paper/65">
                Every registrant gets a personal link. The people and college boards count
                only email-confirmed signups. The top five win ₹200 each — and the leading
                college gets the showcase slot.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="tag !border-paper/20 !bg-paper/10 !text-paper">
                  Top 5 × ₹200
                </span>
                <span className="tag !border-paper/20 !bg-paper/10 !text-paper">
                  Email-confirmed signups only
                </span>
                <span className="tag !border-paper/20 !bg-paper/10 !text-paper">
                  IP + device checks
                </span>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/leaderboard" className="btn btn-lime">
                  See the full board <ArrowRight />
                </Link>
                <Link
                  href="/#idea-generator"
                  className="btn border-paper/25 bg-transparent text-paper hover:bg-paper/10"
                >
                  Get my link <ArrowUpRight />
                </Link>
              </div>

              <p className="mt-6 max-w-[520px] text-[10.5px] leading-relaxed text-paper/35">
                Planning math for the campaign: ~300 from campus captains, ~150 from the
                referral loop, ~50 from clubs and communities. These are assumptions from the
                growth plan, not measured results.
              </p>
            </div>

            <div className="rounded-lg border border-paper/20 bg-paper/[0.04] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-paper/15 pb-3">
                <p className="eyebrow text-paper/50">College standings</p>
                <span className="tag !border-paper/20 !bg-transparent !text-paper/50">
                  Live standings · demo excluded
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {topColleges.length === 0 && (
                  <p className="rounded-md border border-paper/15 px-3 py-5 text-[11.5px] text-paper/55">
                    No live standings yet. The first email-confirmed signup opens the board.
                  </p>
                )}
                {topColleges.map((college, index) => (
                  <div key={college.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="display text-[18px] text-paper/40">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-[13px] font-semibold">
                          {college.name}
                        </span>
                        {college.demo > 0 && <DemoTag />}
                      </div>
                      <span className="mono shrink-0 text-[12px] text-paper/60">
                        {college.verified} verified
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/10">
                      <div
                        className="h-full rounded-full bg-lime"
                        style={{ width: `${Math.max(6, (college.verified / maxCollege) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 border-t border-paper/15 pt-3 text-[10px] leading-relaxed text-paper/40">
                Counts and rankings above include live registrations only. Seeded demo rows are excluded and are not real registrations.
              </p>
            </div>
          </div>
        </section>

        {/* Captain kit */}
        <section className="border-b border-line">
          <div className="shell py-16 lg:py-24">
            <div className="grid gap-8 rounded-xl border border-ink bg-lime p-6 shadow-[5px_5px_0_rgba(22,23,16,0.12)] sm:p-9 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <p className="eyebrow text-ink/60">For campus captains</p>
                <h2 className="display mt-3 max-w-[520px] text-[clamp(38px,4.8vw,58px)]">
                  The captain who moves first owns the board.
                </h2>
                <p className="mt-4 max-w-[470px] text-[13px] leading-relaxed text-ink/70">
                  Get a unique link, a target, and a kit written for your campus: poster
                  caption, WhatsApp pitch, and replies to the four doubts you will actually
                  hear in the group chat.
                </p>
                <ul className="mt-5 space-y-2 text-[12px] text-ink/75">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />One link per captain, so attribution is clean.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />Targets of 20 email-confirmed signups per campus.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />Rewards only pay on email-confirmed signups, not raw clicks.</li>
                </ul>
                <Link href="/kit" className="btn btn-primary mt-6">
                  Open the captain kit <ArrowUpRight />
                </Link>
              </div>

              <div className="rounded-lg border border-ink bg-[#fffdf7] p-4 shadow-[3px_3px_0_rgba(22,23,16,0.15)]">
                <div className="flex items-center gap-2 border-b border-line pb-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2c8a57] text-white">
                    <ChatIcon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold">CSE Final Year '27</p>
                    <p className="text-[8px] text-ink-faint">WhatsApp group · 148 members</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg rounded-tl-none border border-line bg-paper px-3 py-2.5">
                  <p className="text-[10.5px] leading-relaxed text-ink-soft">
                    <strong className="text-ink">ShipWeek is open for VNR VJIET.</strong>
                    <br />
                    3 days. One deployed project. Free.
                    <br />
                    You leave with a live link, an organiser-reviewed score and a certificate with your
                    project's name. Reply "SHIP" and I'll send your seat link.
                  </p>
                  <p className="mt-1.5 text-right text-[8px] text-ink-faint">9:14 AM</p>
                </div>
                <div className="mt-2 flex justify-end">
                  <div className="rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2">
                    <p className="text-[10px] text-ink">SHIP 🚀</p>
                  </div>
                </div>
                <p className="mt-3 border-t border-line pt-2 text-[8.5px] text-ink-faint">
                  Sample kit output · generated fallback, ready to edit
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 border-b border-line">
          <div className="shell grid gap-10 py-16 lg:grid-cols-[0.55fr_1fr] lg:py-24">
            <div>
              <p className="eyebrow text-accent">Doubts, answered</p>
              <h2 className="display mt-3 text-[clamp(38px,4.6vw,56px)]">
                The questions you'd ask in the group chat.
              </h2>
              <p className="mt-4 max-w-[320px] text-[12.5px] leading-relaxed text-ink-soft">
                Still unsure? The idea generator is free and needs no email. Start there.
              </p>
            </div>
            <div className="border-t border-line">
              {faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-[16px] font-normal text-ink-soft transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[720px] pr-10 text-[12.5px] leading-relaxed text-ink-soft">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-accent text-accent-ink">
          <div className="shell py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="eyebrow text-accent-ink/60">ShipWeek '26 · {workshop.dates}</p>
                <h2 className="display mt-3 max-w-[820px] text-[clamp(46px,7vw,88px)]">
                  500 seats. One deployed project. ₹0.
                </h2>
                <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-accent-ink/75">
                  Generate an idea first. It takes twenty seconds and does not ask for your
                  email. If you like it, claim a seat and get your referral link.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <ClaimSeatButton className="btn bg-ink text-paper border-ink">
                  Claim my free seat <ArrowUpRight />
                </ClaimSeatButton>
                <Link
                  href="#idea-generator"
                  className="btn border-ink/30 bg-transparent text-accent-ink hover:bg-black/5"
                >
                  Generate an idea first
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <SignupDialog referrer={referrer} collegeOptions={collegeOptions} />
    </div>
  );
}
