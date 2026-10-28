# ShipWeek — Workshop Growth OS

A working implementation of the **Workshop Growth OS** architecture and build plan: a student goes from first click → generated project idea → verified signup → personal referral link → leaderboard → project submission → AI baseline review → organiser score → certificate. The organiser gets a growth dashboard with funnel, pace, sources, college standings, fraud review and a daily copilot move.

**Live preview:** https://site-fe0b5fbb10f54fb1b95fe7e206ddcdef.freebuff.page

**Admin:** `/admin` · deployed environments require an `ADMIN_PASSCODE` secret; without one the dashboard is disabled rather than falling back to a published passcode. Local development falls back to `ship2026`.

---

## What is shipped

Tiers **A, B and C** from the plan are working end to end. Tier D (reminder emails, per-college pages, showcase) is deliberately not built.

| Flow | Route | Status |
| --- | --- | --- |
| Landing page, insight, 500 math, budget | `/` | Working |
| AI/curated project-idea generator | `/api/idea`, `/#idea-generator` | Working |
| 2-step signup with ref capture | signup dialog, `/api/signup` | Working |
| Dedupe, IP/device rate limits, fraud flags | `/api/signup`, `/admin` | Working |
| Email verification before referral credit | `/api/verify` | Working (browser self-confirmation when no email is sent; recorded separately and excluded from rankings) |
| Thank-you page, personal link, WhatsApp share, 3 share variants | `/thank-you/[code]` | Working |
| Live people + college leaderboard | `/leaderboard` | Working (8s polling) |
| Captain kit generator | `/kit`, `/api/kit` | Working |
| Admin funnel, pace vs 500, source/college ranking, raw vs verified | `/admin` | Working |
| Daily AI growth copilot with prompt logs | `/admin`, `/api/copilot` | Working |
| Project submission + AI evaluator | `/submit/[code]` | Working |
| Printable certificate with project name and score | `/certificate/[code]` | Working |
| Seeded demo dataset, opt-in and labelled | `DEMO_DATA=1` | Working |

### The core loop

`Visit with ?ref=CODE` → generate an idea → 2-step signup → thank-you page with a tracked `/r/CODE` link → email verification → verified referral counts → leaderboard updates → build the project in the 60-minute session → submit the live URL → AI baseline review → organiser review and score → certificate that lists the four completed modules.

### The session

| Block | Module | What happens |
| --- | --- | --- |
| 00–15 min | Foundation & AI APIs | LLM architecture, API keys, environment setup without local headaches |
| 15–35 min | Hands-on Code Build | Core app logic, system prompts, asynchronous AI streams |
| 35–50 min | UI & Deployment | Interactive web interface, live shareable URL for recruiters |
| 50–60 min | Placement Strategy | LinkedIn/resume framing and the top technical interview questions |

The agenda lives in `lib/config.ts` (`agenda`) and is the single source for the landing page's breakdown section and the certificate's completed-modules strip.

---

## Stack mapping

The plan specified Next.js + Supabase + Edge Functions + Resend on Vercel. This build runs in the Freebuff Sites environment, so the equivalent pieces are:

| Plan | Implementation | Why |
| --- | --- | --- |
| Next.js on Vercel | Next.js 16 App Router on Cloudflare Workers via OpenNext, deployed with Freebuff Sites | Gives a live public URL from this workspace |
| Supabase Postgres | Cloudflare D1 (SQLite) | Managed SQL with a free tier, no external account needed |
| Supabase Edge Functions | Next.js route handlers | Same rule: API keys only on the server |
| Supabase Realtime | 8-second polling on the public leaderboard | Simpler and cheaper for a 500-person demo; the board still moves while open |
| Resend (plan) | SMTP2GO single-sender HTTP API behind `SMTP2GO_API_KEY` + `SMTP2GO_SENDER` | Real verification email with no domain purchase and no paid tier |
| LLM API | Groq free tier (OpenAI-compatible), called server-side | Five JSON-schema prompts, validated, logged, with curated fallbacks. No credit card or paid credits required. |

No API key is required to run or demo the app. Without `GROQ_API_KEY`, the five AI components use curated fallbacks and every call is logged with `source = fallback`. Without `SMTP2GO_API_KEY` and `SMTP2GO_SENDER`, the thank-you page exposes a demo confirmation link instead of pretending an email was sent.

---

## The five AI components

All calls live in `lib/ai.ts`. The browser never sees a key.

| Component | Input | Output schema | Fallback |
| --- | --- | --- | --- |
| Project scout | branch, interest | `title, pitch, why, stack[], roadmap[3]` | 14 curated buildable ideas |
| Share writer | name, college, branch, idea | `casual, placement, curiosity` | Three template messages |
| Captain kit | college, branch mix | `poster_caption, whatsapp_pitch, replies[4]` | Ready-to-send kit |
| Growth copilot | live funnel metrics | `text, reason` | Rule-based move from pace/verification/share data |
| Project evaluator | title, URL, description | `score, strengths[3], next_step, certificate_text` | Heuristic score 52–94 |

Prompt rules enforced in code:

- Strict JSON Schema enforced by Groq's constrained decoding, then parsed and validated again before use (including array lengths and score ranges).
- Output length caps in prompts and hard character checks on share copy.
- Model allowlist, server-side: `openai/gpt-oss-20b` (default) and `openai/gpt-oss-120b`, both on Groq's free tier; override with `AI_MODEL` only if it is on the allowlist.
- Every prompt and output is written to `prompt_logs` with component, source (`llm` / `fallback` / `llm-invalid`), model, latency and timestamp.
- The evaluator cannot award 95+ for an undeployed repo; the prompt caps the range and the API requires an `https://` URL.

### Enabling live AI or email

Set these as **server secrets** in the Freebuff Sites panel (or in a local `.env`, never committed):

| Variable | Effect |
| --- | --- |
| `GROQ_API_KEY` | Free Groq key; switches all five components from fallbacks to the model |
| `AI_MODEL` | Optional model override from the allowlist |
| `SMTP2GO_API_KEY` | Free SMTP2GO key; sends real verification emails instead of showing the demo link |
| `SMTP2GO_SENDER` | A single sender address verified in SMTP2GO, e.g. `you@gmail.com` (no domain needed) |
| `ADMIN_PASSCODE` | Replaces the demo admin passcode |

Do not put keys in `freebuff.wrangler.jsonc` or any client component.

---

## Data model

Created idempotently on the first request (`lib/schema.ts`), seeded once (`lib/seed.ts`).

Tables: `colleges`, `registrants`, `captains`, `events`, `project_ideas`, `submissions`, `recommendations`, `prompt_logs`, `demo_funnel`.

Views (`VIEW_STATEMENTS`, recreated on cold start):

- `leaderboard` — people with email-confirmed signups and their email-confirmed referrals. Seed rows excluded.
- `college_rank` — live registrations per college, with `verified` meaning email-confirmed only; colleges with no live registrants are omitted.
- `pace` — live registrations per calendar day.

Key fields on `registrants`: `ref_code` (own link), `referred_by` (code that brought them), `verified` (any confirmation), `confirmation_method` (`pending` / `email` / `self` / `admin` / `legacy` / `demo`), `email_sent`, `verify_token`, `is_demo`, `idea_json`, `ip_hash`, `device_id`.

### Confirmation semantics

- **Email** — the only confirmation that proves inbox ownership; it alone counts for leaderboard rank, captain targets and rewards.
- **Self** — the browser that signed up confirms its own seat when no mail was sent. The seat and submission flow continue, but it is excluded from rankings and labelled “email unverified”.
- **Admin** — an organiser confirms a seat from the dashboard. Also excluded from rankings; it records that a human checked the entry, not that the address was proven.
- `verified` therefore means “some confirmation exists”. Public and reward queries always add `confirmation_method = 'email'`.

### Fraud and quality controls

- Unique email and phone indexes plus an application-level duplicate check.
- Email-link confirmation is required before a referral counts in `leaderboard` / `college_rank`; self and admin confirmations never count.
- Rate limits: 10 signups per hashed IP per hour, 4 per device per hour.
- Admin flags 3+ live signups from one IP or device within 15 minutes.
- Raw vs verified is displayed separately on the dashboard; nothing inflated is reported.
- Only name, email, phone, college, year, branch and interest are stored. No scraped lists, no third-party enrichment.
- Admin routes require an HTTP-only, same-site cookie derived from the passcode.

---

## Demo data disclosure

Seeding is **opt-in** and off unless `DEMO_DATA=1` **and** the request is served from localhost. Add that line to your local `.env` only. The loopback check is deliberate: `next build` bakes local `.env` values into the deployed worker, so an env flag alone can read as set on a public host. When enabled and the database is empty, the first request inserts:

- **236 registrants** across **12 colleges**, including **18 captains** with referral targets.
- **4 project submissions** with scores and certificate text.
- **7 days of seeded funnel history** (1,450 visits).

Every seeded registrant/submission has `is_demo = 1`. Behaviour:

- Public seat counts, college rankings, pace, submission lists and the admin campaign funnel filter `is_demo = 0`; seeded rows never change a live number.
- Demo-only colleges are omitted from rankings rather than shown as real standings.
- The admin banner states how many demo rows and sample submissions are excluded, and any seeded certificate/thank-you page carries a **DEMO** badge.
- The admin banner has a **Remove seeded demo rows** control that deletes demo registrations, submissions, captains, events and funnel history in one step. It is irreversible and only appears while demo rows exist.
- A deployed (non-localhost) host also clears leftover demo rows automatically on first request, because demo seeding cannot run there any more. Synthetic rows never coexist with a live campaign.

These are not real results. The 500 signup plan and ₹2,000 budget are planning assumptions reproduced from the source plan.

---

## Tests

```bash
npm test
```

Two suites, no test framework dependency:

- `tests/ranking.test.mjs` applies the real `SCHEMA_STATEMENTS` / `VIEW_STATEMENTS` from `lib/schema.ts` to a throwaway local D1 database, seeds a fixture campaign (email, self, organizer, pending and demo rows) and asserts the ranking contract: only email-link confirmations reach `leaderboard`/`college_rank`, self and organizer confirmations are excluded, demo-only colleges never rank, and a self-confirmed person has no rank.
- `tests/helpers.test.mjs` covers signup validation and display helpers (email, Indian phone normalization including `+91`/leading-zero forms, referral-code charset, source allowlist, masking).

A view or validation regression fails `npm test` instead of quietly inflating a public board.

## Local development

```bash
npm install
npm run dev
```

The local D1 binding comes from `freebuff.wrangler.jsonc` through `initOpenNextCloudflareForDev` in `next.config.ts`. The database lives in `.wrangler/state`; delete that folder to reset the demo seed. D1's compile-time surface is checked in at `types/cloudflare-runtime.d.ts` so a fresh clone typechecks without a generated file; extend `types/cloudflare-env.d.ts` when you add a binding.

```bash
npm run build                     # Next production build + typecheck
npx opennextjs-cloudflare build \
  --config freebuff.wrangler.jsonc \
  --openNextConfigPath freebuff.open-next.config.ts
npx wrangler dev --config freebuff.wrangler.jsonc --port 8788
```

---

## Simulation mode

The dashboard can present a generated campaign of 340 students so every screen can be exercised at
real scale without touching a real signup. It is a third data mode next to live and the original
sample campaign, controlled from the strip under the dashboard header.

- **Run it:** **Run 340-student simulation**. It writes 340 registrants, 16 captains, ~74
  submissions (about two thirds already scored and carrying certificates), 28 aggregated funnel
  events and 14 colleges, then switches the whole site into simulation mode.
- **What changes:** every number on the public site and the dashboard is computed from those rows.
  A banner is rendered above the public nav and in the dashboard, each row keeps the DEMO tag, and
  certification, review and referral views all work against the simulated students.
- **Why it cannot leak:** every simulation row is written with `is_demo = 1, demo_kind = 'sim'`.
  Live queries filter `is_demo = 0`, so a simulation can never enter live totals, the data export or
  the reward maths. A worker restart purges only the original sample campaign; the simulation stays
  until it is cleared.
- **Switch off:** **Back to live data** restores live numbers immediately and keeps the rows.
- **Delete it:** **Clear simulation** removes only `demo_kind = 'sim'` rows and returns to live mode.
- **Rebuild:** regenerates from the same deterministic seed, so a repeat demo looks the same.

---

## Verification performed

- `next build` (Next.js 16.4.3) — compiled and typechecked all routes.
- Local Next dev + D1: signup `201`, duplicate blocked `409`, verify redirect `307`, share `200`, captain kit `200`, submit `201`, certificate `200`, admin unauthorized `401`, admin login `200`, copilot `200`.
- Workerd via `wrangler dev` (the real Workers runtime): home/leaderboard/kit/certificate `200`, CSS `200 text/css`, full signup → verify → submit → certificate flow, admin login and copilot, no worker exceptions.
- Live Groq calls: all five components returned `source = "llm"` with `openai/gpt-oss-20b`; strict JSON Schema outputs were validated.
- Live email call (before this switch): a Resend send returned `emailSent: true`, delivered with the subject “Your ShipWeek seat — confirm your email”, and the emailed token redirected `307` and marked the seat verified. The email layer now targets SMTP2GO; that sender is not yet exercised with a live key.
- Deployed preview (earlier build): `published = true`; `/api/idea`, `/api/share`, `/api/kit` and `/api/copilot` all returned `source = "llm"` with `openai/gpt-oss-20b`; the admin AI log showed live rows.
- `npm test` — 14 passing: ranking contract against a throwaway D1 (email vs self/admin/pending/demo) and signup/display helper units.
- Deployed preview (current build): home `/leaderboard` `/kit` `/admin/login` `200`, `/admin` redirects `307`; `/api/stats` reports `demo: 0` after the first request cleared leftover synthetic rows; the public host rejects the legacy `ship2026` passcode with `503`; `purge-demo` without a session returns `401`.
- Local admin flow: wrong passcode `401`, correct passcode `200`, `purge-demo` removed 277 synthetic rows and `/api/stats` then reported `demo: 0`.
- Simulation mode locally: seeding returned `340` students / `74` submissions / `28` event rows;
  `/api/stats` then reported `total: 340, verified: 280, mode: "simulation"`; home and `/leaderboard`
  rendered `200` with the simulation banner and `sim-` codes; the dashboard showed
  “Showing 340 synthetic students”; approving a simulated submission with `87` produced
  “Set by the organiser” on its certificate; `Back to live data` returned `total: 0` while keeping all
  340 rows; `Clear simulation` removed `462` rows and restored live mode.
- `npm run test:integration` — 12 passing route-level tests on a real server and D1: submission
  guard, approval gate, login lockout, export, erasure, session revocation, and four simulation tests
  (300+ rows all tagged `sim`, unique emails/phones/codes, live rows untouched, banner and leaderboard
  presentation, mode switch, clear leaving base demo intact).

Not verified: delivery through SMTP2GO (its sender domain was rejected as unverified, so live signups fall back to browser self-confirmation), payment/reward payouts (rewards are copy only, no money movement), and mobile Safari on a physical device.

---

## Known limitations

- **Tier D is not built:** 24h/1h reminder emails, per-college landing pages and the post-workshop showcase are out of scope, as the plan allows.
- **Realtime is polling:** the leaderboard refreshes every 8 seconds rather than using WebSockets; the data is still live.
- **Session date is fixed in config:** `Sat, 7 Nov 2026 · 11:00 AM IST` (`workshop.dates`); the registration campaign still runs over 7 days, and seeded rows are excluded from the pace window entirely.
- **Admin access is off by default on deployed workers.** `ADMIN_PASSCODE` must be set as a server secret, ideally 16+ characters; the dashboard warns below 12. Login is limited to five failed attempts per IP per 15 minutes, and **Sign out everywhere** rotates a session epoch so every issued cookie dies without changing the passphrase.
- **Operations:** server errors are captured to `error_log` and shown in the dashboard, **Download data export** produces a JSON backup of every live table, and **Delete** on a student removes their record, submission, events and referral credit.
- **Link checks:** each submitted URL is fetched once from the server (private addresses refused) and the result is stored with the review, so an unreachable link caps the AI baseline at 35.
- **Simulation mode is a display mode, not a traffic simulator.** It changes what every read query
  counts; it does not send students to the site, and simulation rows are deliberately left out of the
  data export. Real signups made while it is on are still stored normally and reappear the moment you
  switch back to live data.
- **SMTP2GO single-sender mode trades polish for no domain.** Mail from a verified single address has no SPF/DKIM alignment for that address, so Gmail can label it “via smtpcorp.com” and spam placement is more likely. The free plan allows 1,000 emails/month, 200/day and 25/hour while no sending domain is verified. Verifying a domain later removes the hourly cap and improves placement; no code change is needed, only a different sender address.
- **Groq's free tier has rate limits** (published at 30 RPM / 1K requests per day for `openai/gpt-oss-20b`). The app falls back cleanly when a call is rate-limited; a busy live event may need a higher tier or a second provider.
- **OpenNext warns on Windows.** The build completes; production runs on Linux.

---

## File map

```
app/
  page.tsx                    landing page, 60-minute breakdown, generator, board, FAQ
  leaderboard/                public people + college board
  kit/                        captain kit studio
  thank-you/[code]/           seat, verification, personal link, share studio, rank
  submit/[code]/              submission + existing review
  certificate/[code]/         printable certificate
  admin/                      passcode gate + growth dashboard
  api/                        idea, signup, verify, share, kit, submit, copilot,
                              leaderboard, stats, events, admin actions
  r/[code]/                   tracked referral redirect
components/                   public UI, charts, admin UI, icons
lib/
  schema.ts, seed.ts          D1 tables, views, labelled demo data
  data.ts                     dashboard and public queries
  ai.ts                       five AI calls, validation, prompt logs, fallbacks
  fallbacks.ts                curated ideas, share copy, kit, copilot, evaluator
  utils.ts, auth.ts, email.ts, track.ts, config.ts
docs/ai-notes.md              prompt/output notes for the submission
```
