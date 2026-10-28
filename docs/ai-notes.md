# AI + Learning Notes

These are the build-time notes for the five AI components in ShipWeek. They follow the submission format: **what I asked → what AI suggested → what I changed**.

**Read this first:** the build initially ran without a `GROQ_API_KEY`, so every app-level call resolved to its curated fallback and was written to `prompt_logs` with `source = "fallback"`. The quoted outputs below are those fallback rows — they show what the product served with no key, not a model completion. A free Groq key was later added; all five components were then verified with `source = "llm"` and `model = "openai/gpt-oss-20b"`. The prompt text below is the system prompt in `lib/ai.ts`.

## Live Groq verification

After the free key was added, the same prompts were called through `https://api.groq.com/openai/v1/chat/completions` with `reasoning_effort: "low"` and provider-enforced strict JSON Schema output. Results:

| Component | Result | Latency |
| --- | --- | --- |
| Project scout | `Campus Event Sync & RSVP Bot` — a buildable Slack/calendar project | 849 ms |
| Share writer | Three factual WhatsApp messages; no invented rewards | 826 ms |
| Captain kit | Solo sprint facts, “no lectures, no mentors, no teams”; no reward claim | 1,815 ms |
| Growth copilot | “Ask the VIT campus captain to share the workshop link…” with today's numbers | 834 ms |
| Project evaluator | Score 82, three specific strengths, one next step, certificate text | 847 ms |

The first evaluator attempt omitted `next_step` and `certificate_text`, so the validator logged `llm-invalid` and served the fallback. The fix was to stop trusting prompt compliance: every component now sends a strict JSON Schema to Groq, which constrains decoding to the required fields. The validator remains as a second line of defence for array lengths and score ranges.

A live captain-kit/shared-copy attempt also invented mentors, teams and extra prizes. I removed rewards from those prompts entirely (the app states rewards elsewhere) and added explicit forbidden facts. The live outputs above are from the tightened prompts.

Prompt and output rows are still written to `prompt_logs`, so the admin AI log now shows `source = llm` alongside the fallback history. Invalid JSON, schema violations and rate limits still fall back cleanly.

---

## 1. Project scout — give a student something worth building

**What I asked**

> You are the project scout for ShipWeek, a free 3-day build sprint for final-year Indian college students. Give one project idea a single student can actually deploy in 3 days and defend in a placement interview.
>
> Rules:
> - Software only, free-tier services, buildable by one person in 3 evenings.
> - Specific, not "an AI platform for X". It must have one core loop that can be demoed in 60 seconds.
> - No generic to-do, chat, or CRUD dashboard projects.
> - Use the student's branch/interest when it genuinely helps; never force hardware.
> - Roadmap has exactly 3 steps, one per day, each concrete.
> Return ONLY valid JSON in this exact shape: `{"title","pitch","why","stack":[],"roadmap":[]}`.

**What it returned (curated fallback, logged)**

> **SplitSet** — Bill splitting for student flats: photograph a grocery bill, assign items to roommates, and send one UPI request per person. Rent and wifi repeat automatically every month.
>
> Why: clear money-saving loop, a real user group (your own flat), and a reason to reopen it monthly.
>
> Roadmap: create a flat + manual bill entry → item assignment + UPI requests → recurring rent and a 5-flat pilot.

**What I changed**

- The prompt alone is not enough to trust the output. I added a runtime shape check (`title`, `pitch`, `why`, `stack[2..6]`, `roadmap[2..4]`). Anything else is rejected and logged as `llm-invalid`.
- The app never blocks on the model. Fourteen curated ideas cover branch/interest combinations, and the UI labels a fallback **"Curated demo"** rather than pretending it came from a model.
- I rejected the first instinct to ask for "5 ideas". One idea forces scope. The 3-day constraint is in the prompt and in the roadmap schema.
- The signup carries the idea into the account (`registrants.idea_json`) so the thank-you page can reflect it back. The idea is not lost when the visitor converts.

---

## 2. Growth copilot — one move, not a dashboard of advice

**What I asked**

> You are the growth copilot for a 7-day campaign to get 500 registrations for a free 3-day student workshop in India.
>
> Given the funnel numbers, recommend exactly ONE concrete action for the next 6 hours.
> - Prefer peer channels: campus captains, referrals, clubs, WhatsApp groups. Ads are a last resort and the budget is tiny.
> - Use the specific numbers in the reason.
> - Never suggest scraping phone numbers, buying lists, fake scarcity, or engagement bait.
> - The action must be executable today by one organiser.

**What it returned (curated fallback, logged)**

> **Send a verification nudge to the 10 unverified signups before you ask anyone for another referral.**
>
> Reason: 10 of 237 signups are not verified, so they do not count toward the leaderboard or rewards. Cleaning the queue is the cheapest way to move the verified number today.

**What I changed**

- The first draft compared today's **daily** signups to the **cumulative** 500 target, which made every day look like a failure. I changed the calculation to the increment between yesterday's plan point and today's (`500 − 470 = 30` for day 7).
- The fallback order is deliberate: stale verification → pace → idea-to-signup drop → share rate → best source. Verification comes first because those rows cannot earn referral credit.
- The copilot writes to `recommendations` with the live metrics snapshot. Regenerating does not overwrite history, so the dashboard can show how the advice changed.
- I rejected a paid-boost recommendation as the default. At a ₹2,000 budget, ₹500 of ads cannot produce 500 registrations; peer messages are the cheaper and more trusted channel. The prompt says so, and the fallback never suggests ads.
- The "reason" field is mandatory. A recommendation without the numbers is a horoscope.

---

## 3. Project evaluator — feedback that becomes a certificate

**What I asked**

> You evaluate final-year student projects from a 3-day build sprint. Be specific, fair and useful.
> - Score 0-100. 60-85 for a completed small project, 86-94 for a deployed project with evidence of users. 95+ is reserved for exceptional, real-world traction.
> - Strengths must reference what is actually in the submission, not generic praise.
> - The next step is one concrete fix, achievable this week.
> - No invented facts about the project.
> Return ONLY valid JSON: `{"score","strengths":[3],"next_step","certificate_text"}`.

**What it returned (curated fallback, test submission)**

> **Score 78** — strengths: has a working deployment; description shows evidence of real users or a pilot; can explain the stack.
>
> Next step: record a 30-second screen demo and add one real user quote before the showcase.
>
> Certificate text: "Built Workerd Test, shipped it during ShipWeek, and earned a project score of 78/100."

**What I changed**

- The API refuses a submission without a valid `https://` URL. The prompt penalizes a GitHub-only link, and the fallback deducts points for it.
- Scores are capped at 94 in the fallback and the prompt reserves 95+ for deployed projects with traction. A workshop reviewer should not hand out 100 for a weekend CRUD app.
- The certificate is generated from the stored submission, not from free text typed by the student. The project name, URL, score and certificate ID are the same record shown in admin.
- I added one-submission-per-seat at the database level (`UNIQUE registrant_id`) because a certificate ID cannot be stable if the project changes after issue.
- The demo submissions are pre-written and labelled demo; the evaluator's own test row was removed from the preview database after the workerd smoke test.

---

## Plan-level rejections

These are implementation decisions, not model output. They are the suggestions I considered while building the plan and rejected, with reasons:

| Suggestion | Rejected because |
| --- | --- |
| Put ₹500 into Meta ads / a paid influencer on day 3 | ₹2,000 total cannot buy 500 registrations; peer channels are cheaper and more trusted. The budget line stays in the copy, not in a payment integration. |
| Scrape or buy student phone numbers | Privacy risk, spam, and it poisons the referral attribution the whole product depends on. |
| Fake scarcity ("only 50 seats left") | Students talk to each other. A false count destroys the trust that makes a peer referral work. The room is 500 seats and the UI says 500. |
| A full WhatsApp Business API bot | Approval time and cost for little extra value in 7 days. A tracked `wa.me` share link and a personal link do the job. |
| A generic "AI chatbot" on the landing page | It gives no taste of the outcome. The idea generator is narrower and more convincing: one buildable project in 60 seconds. |

---

## Learning notes

1. **Schema validation is the line between a demo and a product.** The model is allowed to be creative; the app is not allowed to render whatever comes back. Every AI path has a validator and a fallback.
2. **A fallback is part of the feature.** The idea generator, share writer, kit, copilot and evaluator all work with no key. That is why the preview can be reviewed before billing or credentials exist.
3. **Label demo data at the row, the aggregate and the page.** The `is_demo` flag, the `DEMO` tag, the dashboard banner and the README say the same thing. The quickest way to lose trust is a seeded number presented as a result.
4. **Polling is the right complexity for this board.** Eight seconds is fast enough to feel live for 500 users, with none of the reconnect/state work a realtime channel adds.
5. **The growth copilot is only useful if it reads the funnel it claims to read.** The daily/cumulative target bug was invisible until the numbers were checked against the plan; the fix was a one-line calculation and a better recommendation.
6. **Logging fallback calls feels noisy, but it is the audit trail.** Without the `source` column, the dashboard could not tell the difference between "the model said this" and "the app served a template".

## Next 24 hours

- Show the full prompt and output in the admin AI log, not only the metadata row.
- Verify a SMTP2GO single sender (no domain needed) and add the 24-hour / 1-hour reminders (Tier D).
- A/B test the three share variants using the existing `share_click` events, split by variant.
- Add per-college landing pages with local copy and a captain-specific OG card.
