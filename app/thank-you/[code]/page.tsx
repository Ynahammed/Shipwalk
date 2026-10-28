import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CopyButton } from "@/components/CopyButton";
import { DemoTag } from "@/components/DemoTag";
import { ShareStudio } from "@/components/ShareStudio";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowUpRight, Check, SparkIcon } from "@/components/icons";
import { fallbackShare } from "@/lib/fallbacks";
import {
  getLeaderboardRank,
  getReferralStats,
  getRegistrant,
  getSeatNumber,
  getSubmission,
} from "@/lib/data";
import { getEnv } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { maskEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ new?: string; verified?: string; self?: string; emailSent?: string }>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const registrant = await getRegistrant(code);
  if (!registrant) notFound();

  const [seat, rank, referralStats, submission, env, headerList] = await Promise.all([
    getSeatNumber(code),
    getLeaderboardRank(code),
    getReferralStats(code),
    getSubmission(code),
    getEnv(),
    headers(),
  ]);

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3010";
  const proto =
    headerList.get("x-forwarded-proto")?.split(",")[0] ??
    (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const shareLink = `${origin}/r/${registrant.ref_code}`;

  let savedIdea: { title: string; pitch: string } | null = null;
  if (registrant.idea_json) {
    try {
      const parsed = JSON.parse(registrant.idea_json) as { title?: string; pitch?: string };
      if (parsed.title) {
        savedIdea = { title: parsed.title, pitch: parsed.pitch ?? "" };
      }
    } catch {
      savedIdea = null;
    }
  }

  const initialMessages = fallbackShare({
    name: registrant.name,
    college: registrant.college,
    ideaTitle: savedIdea?.title ?? "",
  });
  const firstName = registrant.name.split(" ")[0];
  const verified = registrant.verified === 1;
  const emailConfigured = isEmailConfigured(env);
  const emailSent = query.emailSent === "1";
  const confirmationMethod = registrant.confirmation_method;
  const verifyUrl =
    !verified && registrant.verify_token
      ? `${origin}/api/verify?token=${encodeURIComponent(registrant.verify_token)}`
      : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="shell flex h-[64px] items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-[28px] leading-none">ShipWeek</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint sm:inline">
              Growth OS
            </span>
          </Link>
          <div className="flex items-center gap-4 text-[12px] text-ink-soft">
            <Link href="/leaderboard" className="hover:text-ink">Leaderboard</Link>
            <Link href="/" className="hover:text-ink">Home</Link>
          </div>
        </div>
      </header>

      <main className="shell py-10 lg:py-14">
        {query.new === "1" && (
          <div className="mb-7 flex items-center gap-2 rounded-md border border-[#a9d5b7] bg-[#eaf5ea] px-4 py-2.5 text-[12px] text-[#215c37]">
            <Check className="h-4 w-4" />
            {verified
              ? "Seat saved and email confirmed. Your referral link is live."
              : "Seat saved. One more step: confirm your email so your referrals count."}
          </div>
        )}
        {(query.verified === "1" || query.self === "1") && (
          <div className="mb-7 flex items-center gap-2 rounded-md border border-[#a9d5b7] bg-[#eaf5ea] px-4 py-2.5 text-[12px] text-[#215c37]">
            <Check className="h-4 w-4" />
            {query.self === "1"
              ? "Signup self-confirmed in this browser. This does not verify email ownership."
              : "Email confirmed. Your referral credit is live now."}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag tag-ink">Seat #{seat}</span>
              <span className="tag">of 500</span>
              {verified ? (
                <span className="tag !border-[#a9d5b7] !bg-[#eaf5ea] !text-[#215c37]">
                  <Check className="h-3 w-3" />
                  {confirmationMethod === "email"
                    ? "Email verified"
                    : confirmationMethod === "self"
                      ? "Self-confirmed · email unverified"
                      : confirmationMethod === "admin"
                        ? "Organizer confirmed"
                        : confirmationMethod === "demo"
                          ? "Demo confirmation"
                          : "Confirmed · legacy"}
                </span>
              ) : (
                <span className="tag tag-accent">Verification pending</span>
              )}
              {registrant.is_demo === 1 && <DemoTag />}
            </div>

            <h1 className="display mt-5 text-[clamp(52px,7.5vw,82px)]">
              You're in, <em className="italic text-accent">{firstName}</em>.
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink-soft">
              {verified ? (
                <>
                  Your seat is held for {registrant.college}. {confirmationMethod === "email"
                    ? "Your email is confirmed — "
                    : "Your signup is confirmed, but email ownership is unverified — "}
                  send your link to two people who would actually build something, and
                  block three evenings for {registrant.branch}.
                </>
              ) : (
                <>
                  Your seat is held for {registrant.college}. Now make it count: confirm
                  your email, send your link to two people who would actually build
                  something, and block three evenings for {registrant.branch}.
                </>
              )}
            </p>

            <div className="card-flat mt-7 divide-y divide-line">
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3">
                <span className="eyebrow self-center text-ink-faint">Name</span>
                <span className="text-[13px] font-semibold">{registrant.name}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3">
                <span className="eyebrow self-center text-ink-faint">College</span>
                <span className="text-[13px] font-medium">{registrant.college}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3">
                <span className="eyebrow self-center text-ink-faint">Branch</span>
                <span className="text-[13px] font-medium">
                  {registrant.branch} · {registrant.year}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3">
                <span className="eyebrow self-center text-ink-faint">Your code</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="mono text-[13px] font-semibold">@{registrant.ref_code}</span>
                  <CopyButton
                    value={registrant.ref_code}
                    label="Copy code"
                    className="text-[10.5px] font-semibold text-accent hover:underline"
                  />
                </div>
              </div>
            </div>

            {!verified && (
              <div className="mt-5 rounded-lg border border-ink bg-[#fff0e9] p-4">
                <p className="eyebrow text-accent">One more step</p>
                <h2 className="display mt-1.5 text-[27px] leading-none">
                  {emailSent && emailConfigured ? "Check your email." : "Confirm your signup."}
                </h2>
                {emailSent && emailConfigured ? (
                  <>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                      We sent a confirmation link to{" "}
                      <strong className="text-ink">{maskEmail(registrant.email)}</strong>.
                      Only an email-link confirmation verifies that address.
                    </p>
                    <p className="mt-2 text-[10.5px] text-ink-faint">
                      Check spam if it isn't there in two minutes. The link stays valid.
                    </p>
                  </>
                ) : verifyUrl ? (
                  <>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                      {emailConfigured
                        ? "We couldn't send your confirmation email. You can self-confirm this signup in this browser, but that does not prove you own the email address."
                        : "No confirmation email is configured. You can self-confirm this signup in this browser; this does not prove you own the email address."}
                      {" "}Self-confirmed seats appear separately from email-verified seats.
                    </p>
                    <form action="/api/confirm-self" method="post">
                      <input type="hidden" name="code" value={registrant.ref_code} />
                      <button type="submit" className="btn btn-primary mt-3 !py-2.5 text-[12px]">
                        Confirm signup in this browser <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <p className="mt-2 text-[10px] text-ink-faint">
                      Email: {maskEmail(registrant.email)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                    This signup is waiting for its confirmation email. Use the same browser
                    you signed up with to self-confirm if delivery failed.
                  </p>
                )}
              </div>
            )}

            {verified && (
              <div className="mt-5 rounded-lg border border-[#a9d5b7] bg-[#eaf5ea] p-4">
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#215c37]" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#215c37]">
                      {confirmationMethod === "email"
                        ? "Email verified. Your referrals count."
                        : confirmationMethod === "self"
                          ? "Signup self-confirmed. Email ownership is unverified."
                          : confirmationMethod === "admin"
                            ? "Organizer confirmed this signup. Email ownership is unverified."
                            : confirmationMethod === "demo"
                              ? "Seeded demo record, not a real signup."
                              : "Signup confirmed. Email ownership was not recorded."}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[#3f6a4c]">
                      Referrals on the board are counted as confirmed signups, not proof of
                      email ownership. Check the leaderboard disclosure for how confirmation works.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {savedIdea && (
              <div className="mt-5 rounded-lg border border-line bg-[#fffdf7] p-4">
                <div className="flex items-center gap-2">
                  <SparkIcon className="h-3.5 w-3.5 text-accent" />
                  <p className="eyebrow text-ink-faint">Your saved idea</p>
                </div>
                <h2 className="display mt-2 text-[30px] leading-none">{savedIdea.title}</h2>
                {savedIdea.pitch && (
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                    {savedIdea.pitch}
                  </p>
                )}
              </div>
            )}

            <div className="mt-7">
              <p className="eyebrow text-ink-faint">What happens next</p>
              <ol className="mt-3 space-y-3">
                {[
                  {
                    title: verified && confirmationMethod !== "email" ? "Signup confirmation" : "Confirm your email",
                    body: verified
                      ? confirmationMethod === "email"
                        ? "Email confirmed."
                        : "Signup confirmed; email ownership is unverified."
                      : "Confirm this signup to make it count.",
                  },
                  {
                    title: "Send your link to two people",
                    body: "The share studio has three messages ready. Edit one and send it.",
                  },
                  {
                    title: "Build on day 1",
                    body: "Ship the smallest version of your core loop and deploy it early.",
                  },
                  {
                    title: "Submit on day 3",
                    body: "Paste the link for an AI baseline review. The organiser sets the final score and issues the certificate.",
                  },
                ].map((item, index) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink text-[10px] font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold">{item.title}</p>
                      <p className="text-[11px] leading-relaxed text-ink-soft">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4" id="share">
            <ShareStudio
              code={registrant.ref_code}
              link={shareLink}
              initialMessages={initialMessages}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card-flat p-4">
                <p className="eyebrow text-ink-faint">Your rank</p>
                <p className="display mt-1 text-[38px] leading-none">
                  {rank ? `#${rank}` : "—"}
                </p>
                <p className="mt-1 text-[10.5px] text-ink-soft">
                  {referralStats.verified} verified · {referralStats.total} total referrals
                </p>
              </div>
              <div className="card-flat p-4">
                <p className="eyebrow text-ink-faint">Your college</p>
                <p className="display mt-1 truncate text-[26px] leading-tight">
                  {registrant.college}
                </p>
                <Link
                  href="/leaderboard"
                  className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline"
                >
                  See the board <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="card-flat p-5">
              <p className="eyebrow text-ink-faint">Workshop day</p>
              {submission ? (
                <>
                  <h2 className="display mt-1.5 text-[28px] leading-none">
                    {submission.review_status === "approved"
                      ? "Reviewed and certified."
                      : "With the organiser."}
                  </h2>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
                    {submission.project_title} · AI baseline {submission.score ?? "—"}/100.{" "}
                    {submission.review_status === "approved"
                      ? `Organiser score ${submission.final_score ?? submission.score}/100.`
                      : "The organiser reads the project, sets the final score and issues the certificate."}
                  </p>
                  <Link
                    href={`/certificate/${registrant.ref_code}`}
                    className="btn btn-primary mt-3 w-full !py-2.5 text-[12px]"
                  >
                    {submission.review_status === "approved"
                      ? "Open certificate"
                      : "Check review status"}{" "}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="display mt-1.5 text-[28px] leading-none">
                    Submit the thing you ship.
                  </h2>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
                    The form opens now. Submit after you deploy, before the end of day 3.
                  </p>
                  <Link
                    href={`/submit/${registrant.ref_code}`}
                    className="btn btn-ghost mt-3 w-full !py-2.5 text-[12px]"
                  >
                    Open submission <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>

            <p className="px-1 text-[10px] leading-relaxed text-ink-faint">
              Only name, email, phone, college, year and branch are stored. Ask the organiser
              to remove your row at any time.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
