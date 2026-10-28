import { getDb, getEnv } from "./db";
import {
  fallbackCopilot,
  fallbackEvaluation,
  fallbackIdea,
  fallbackKit,
  fallbackShare,
} from "./fallbacks";
import type { CaptainKit, CopilotMove, Evaluation, Idea, ShareMessages } from "./types";

export type AiSource = "llm" | "fallback" | "llm-invalid";

// Groq's free tier is OpenAI-compatible and needs no credit card.
const API_BASE = "https://api.groq.com/openai/v1";

// Server-side allowlist: the browser never chooses a model.
// Both models are on the Groq free tier and support JSON outputs.
const ALLOWED_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];
const DEFAULT_MODEL = "openai/gpt-oss-20b";

// Rotated per request so repeated clicks do not return the same project.
const ANGLES = [
  "turn a repeated group decision into a fast vote with a visible result",
  "help someone practise a skill and see progress across sessions",
  "make a shared resource's availability visible before someone travels",
  "replace a paper log with a live record that saves someone money",
  "help a small local business see something they currently guess",
  "turn scattered messages into one ranked list",
  "measure something personal over weeks and show the trend",
  "cut waste of money, food, or electricity where it is currently invisible",
];

// Strict schemas are enforced by Groq's constrained decoding. Every field is
// required and no extra fields are allowed, so the validator still guards
// array lengths and value ranges.
const IDEA_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    pitch: { type: "string" },
    why: { type: "string" },
    stack: { type: "array", items: { type: "string" } },
    roadmap: { type: "array", items: { type: "string" } },
  },
  required: ["title", "pitch", "why", "stack", "roadmap"],
  additionalProperties: false,
};

const SHARE_SCHEMA = {
  type: "object",
  properties: {
    casual: { type: "string" },
    placement: { type: "string" },
    curiosity: { type: "string" },
  },
  required: ["casual", "placement", "curiosity"],
  additionalProperties: false,
};

const KIT_SCHEMA = {
  type: "object",
  properties: {
    poster_caption: { type: "string" },
    whatsapp_pitch: { type: "string" },
    replies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          doubt: { type: "string" },
          reply: { type: "string" },
        },
        required: ["doubt", "reply"],
        additionalProperties: false,
      },
    },
  },
  required: ["poster_caption", "whatsapp_pitch", "replies"],
  additionalProperties: false,
};

const COPILOT_SCHEMA = {
  type: "object",
  properties: {
    text: { type: "string" },
    reason: { type: "string" },
  },
  required: ["text", "reason"],
  additionalProperties: false,
};

const EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    strengths: { type: "array", items: { type: "string" } },
    next_step: { type: "string" },
    certificate_text: { type: "string" },
  },
  required: ["score", "strengths", "next_step", "certificate_text"],
  additionalProperties: false,
};

type ModelResult = { text?: string; error?: string };

function resolveModel(env: CloudflareEnv): string {
  const requested = (env.AI_MODEL ?? "").trim();
  return ALLOWED_MODELS.includes(requested) ? requested : DEFAULT_MODEL;
}

function parseJsonObject(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callModel(
  key: string,
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  schemaName: string,
  schema: object,
): Promise<ModelResult> {
  const url = `${API_BASE}/chat/completions`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: maxTokens,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const raw = await response.text();
    if (!response.ok) {
      return {
        error: `${response.status} from ${url}: ${raw.slice(0, 240)}`,
      };
    }

    let parsed: {
      choices?: { message?: { content?: string } }[];
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "Provider returned non-JSON." };
    }
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) {
      return { text: content };
    }
    return { error: "Provider returned an empty completion." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error." };
  }
}

async function logPrompt(
  component: string,
  input: string,
  output: string,
  source: AiSource,
  model: string | null,
  durationMs: number,
): Promise<void> {
  try {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO prompt_logs (component, input, output, source, model, duration_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        component,
        input.slice(0, 6000),
        output.slice(0, 6000),
        source,
        model,
        durationMs,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // Logging must never break the user-facing call.
  }
}

async function withAi<T>(options: {
  component: string;
  system: string;
  user: string;
  fallback: T;
  maxTokens?: number;
  schemaName: string;
  schema: object;
  validate: (value: unknown) => value is T;
}): Promise<{ data: T; source: AiSource; model: string | null; error?: string }> {
  const started = Date.now();
  const env = await getEnv();
  const model = resolveModel(env);
  const input = JSON.stringify({ system: options.system, user: options.user });
  const maxTokens = options.maxTokens ?? 2000;

  if (env.GROQ_API_KEY) {
    const result = await callModel(
      env.GROQ_API_KEY,
      model,
      options.system,
      options.user,
      maxTokens,
      options.schemaName,
      options.schema,
    );

    if (result.error) {
      console.error(`[ai:${options.component}] ${result.error}`);
    }

    if (result.text) {
      const parsed = parseJsonObject(result.text);
      if (parsed && options.validate(parsed)) {
        const duration = Date.now() - started;
        await logPrompt(options.component, input, JSON.stringify(parsed), "llm", model, duration);
        return { data: parsed, source: "llm", model };
      }
      await logPrompt(
        options.component,
        input,
        result.text,
        "llm-invalid",
        model,
        Date.now() - started,
      );
    }

    await logPrompt(
      options.component,
      input,
      JSON.stringify(options.fallback),
      "fallback",
      model,
      Date.now() - started,
    );
    return {
      data: options.fallback,
      source: "fallback",
      model,
      error: result.error ?? "AI output did not match the required schema.",
    };
  }

  await logPrompt(
    options.component,
    input,
    JSON.stringify(options.fallback),
    "fallback",
    null,
    Date.now() - started,
  );
  return {
    data: options.fallback,
    source: "fallback",
    model: null,
    error: "GROQ_API_KEY is not configured; using the curated fallback.",
  };
}

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringList = (value: unknown, min: number, max: number): value is string[] =>
  Array.isArray(value) &&
  value.length >= min &&
  value.length <= max &&
  value.every(isString);

function isIdea(value: unknown): value is Idea {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isString(v.title) &&
    isString(v.pitch) &&
    isString(v.why) &&
    isStringList(v.stack, 2, 6) &&
    isStringList(v.roadmap, 2, 4)
  );
}

export async function generateIdea(
  branch: string,
  interest: string,
): Promise<{ data: Idea; source: AiSource; model: string | null; error?: string }> {
  const fallback = fallbackIdea(branch, interest);
  const system = `You are the project scout for ShipWeek, a free 3-day build sprint for final-year Indian college students. Output exactly one project that a single student can build and deploy in three evenings (~3 hours each), then defend in a placement interview.

THE STACK IS FIXED. Every idea runs on Next.js (App Router, TypeScript) + Tailwind deployed to Cloudflare Workers, with Cloudflare D1 when it must save data, plus browser APIs and at most one free, no-card external API. Never suggest Python, Flask/FastAPI, Streamlit, Django, Docker, Heroku (its free tier is gone), Firebase, Supabase, native iOS/Android builds, or training/fine-tuning a model. For Mechanical/Civil/Electrical branches, still use this web stack on a problem from that field — never invent hardware the student does not own.

SCOPE BUDGET: one core loop, at most three screens, no accounts needed for the demo path, no admin panel, no payments, no real-time collaboration. A visitor must reach the core loop without signing up. The idea must involve something that changes over time — a queue, a schedule, a history, a running total — so it is never a one-shot calculator.

SPECIFICITY CONTRACT:
- Decide the exact user and the moment they open it ("a final-year student the night before a placement shortlist"), but keep that framing out of the pitch.
- pitch: at most 2 sentences describing the product itself — what the user does in one action and what they get back. Never open with "A final-year student..." and never describe a persona wanting something. Never "an AI platform for X" or "a dashboard for Y".
- The core loop must produce something worth looking at: a ranking, a schedule, a map, a score, a matched pair, a cost number, a before/after. A form that writes one row and flips a status is not an idea.
- Coordinate at least two kinds of records (people and slots, entries and votes, items and claims, history and a deadline) and compute a result nobody could read off one row. One person logging their own numbers is a diary, not a project.
- Vary the hard part: matching, scheduling under constraints, deduplication, forecasting from history, or ranking. Do not default to offline sync or IndexedDB unless the idea truly needs it.
- why: name the single hardest part they will build and the interview question it prepares them to answer. Never "showcases full-stack skills".
- roadmap: exactly 3 items, each starting "Day 1:", "Day 2:", "Day 3:" — Day 1 the core loop on seed data, Day 2 the hard part, Day 3 deploy plus a 60-second demo. No tests, Docker, auth or polish filler.

BANNED, because every interviewer has seen them or they are too thin: to-do lists, chat apps, quiz apps, weather apps, URL shorteners, QR generators, link-in-bio pages, countdown timers, resume builders, generic CRUD/admin dashboards, simple approval-status trackers, personal expense/habit/calorie/mood trackers, diabetes/loan/house-price/crop-yield predictors, sentiment-analysis demos, "AI chatbot for college FAQ".

The branch matters only when it genuinely changes the problem; otherwise build around the interest. The idea must differ from every title in the avoid list. Do not default to campus queues, QR codes or booking forms; a QR scan or ticket is at most one small detail inside the loop, never the idea itself.`;

  let avoid: string[] = [];
  try {
    const db = await getDb();
    const recent = await db
      .prepare(
        "SELECT idea_json FROM project_ideas WHERE branch = ? ORDER BY id DESC LIMIT 4",
      )
      .bind(branch)
      .all<{ idea_json: string }>();
    avoid = (recent.results ?? [])
      .map((row) => {
        try {
          return (JSON.parse(row.idea_json) as Idea).title;
        } catch {
          return "";
        }
      })
      .filter((title) => title.length > 0);
  } catch {
    // Variety is a nice-to-have; never fail the request over it.
  }

  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const user = [
    `Branch: ${branch}`,
    `Interest: ${interest}`,
    "Location: India, mid-range Android phone, patchy data",
    "Budget: free tiers only, no credit card",
    "Time: 3 evenings, roughly 3 hours each",
    `Angle for this idea: ${angle}`,
    avoid.length > 0 ? `Do not repeat these: ${avoid.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await withAi({
    component: "project-idea",
    system,
    user,
    fallback,
    maxTokens: 2000,
    schemaName: "project_idea",
    schema: IDEA_SCHEMA,
    validate: isIdea,
  });

  try {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO project_ideas (branch, interest, idea_json, source, registrant_id, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`,
      )
      .bind(branch, interest, JSON.stringify(result.data), result.source, new Date().toISOString())
      .run();
  } catch {
    // The idea itself is still returned if analytics fails.
  }

  return result;
}

function isShareMessages(value: unknown): value is ShareMessages {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isString(v.casual) &&
    isString(v.placement) &&
    isString(v.curiosity) &&
    [v.casual, v.placement, v.curiosity].every((s) => (s as string).length <= 400)
  );
}

export async function writeShareMessages(input: {
  name: string;
  college: string;
  branch: string;
  ideaTitle: string;
}): Promise<{ data: ShareMessages; source: AiSource; model: string | null }> {
  const fallback = fallbackShare(input);
  const system = `You write WhatsApp share messages for a final-year Indian student who just registered for ShipWeek, a free 3-day project sprint.

Event facts you may use: free 3-day individual build sprint for final-year students, 500 seats, a certificate carrying the project name, and a personal referral link.
Rules:
- First person, like a real student texting friends. No corporate voice.
- Do not mention rewards, ₹200, prizes, incentives, mentors, teams, hackathons, networking, job guarantees, extra credits or goodies. The app explains rewards separately.
- No fake urgency, no invented stats, no "only X seats left".
- No links: the app adds the personal link after the message.
- Max one emoji. Each message under 280 characters.
- Three genuinely different angles: casual invite to friends, placement/career angle, curiosity hook for a group.
Return ONLY valid JSON:
{"casual":"...","placement":"...","curiosity":"..."}`;

  const user = `Name: ${input.name}\nCollege: ${input.college}\nBranch: ${input.branch}\nTheir project idea: ${input.ideaTitle || "a workshop project"}\nEvent: 3 days, free, 500 seats, certificate with the project name`;

  return withAi({
    component: "share-writer",
    system,
    user,
    fallback,
    maxTokens: 1600,
    schemaName: "share_messages",
    schema: SHARE_SCHEMA,
    validate: isShareMessages,
  });
}

function isCaptainKit(value: unknown): value is CaptainKit {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isString(v.poster_caption) &&
    isString(v.whatsapp_pitch) &&
    Array.isArray(v.replies) &&
    v.replies.length >= 3 &&
    v.replies.length <= 6 &&
    v.replies.every(
      (r) =>
        !!r &&
        typeof r === "object" &&
        isString((r as Record<string, unknown>).doubt) &&
        isString((r as Record<string, unknown>).reply),
    )
  );
}

export async function writeCaptainKit(
  college: string,
  branchMix: string,
): Promise<{ data: CaptainKit; source: AiSource; model: string | null }> {
  const fallback = fallbackKit(college, branchMix);
  const system = `You write launch kits for campus captains promoting ShipWeek, a free 3-day build sprint for final-year students. 500 seats total, certificate with the project name, referral rewards for the top five.

Facts you may use: ShipWeek is a free 3-day individual build sprint, Nov 6–8, with 500 seats, no live lectures, and a certificate carrying the project name. There are no mentors, teams, peer reviews, networking sessions, job guarantees, rewards, ₹200, prizes, extra credits or goodies.
Rules:
- Sound like a student organiser, not a brand.
- Never mention a fact outside the list above. Do not mention rewards, ₹200, prizes or incentives; the app explains those separately. No fake scarcity, no "only 50 seats", no placement guarantees.
- Poster caption under 200 characters. WhatsApp pitch under 700 characters, with line breaks.
- Exactly 4 replies to the doubts students actually raise.
Return ONLY valid JSON:
{"poster_caption":"...","whatsapp_pitch":"...","replies":[{"doubt":"...","reply":"..."}]}`;

  const user = `College: ${college}\nBranch mix: ${branchMix}\nAudience: final-year students, placement-focused, WhatsApp-native`;

  return withAi({
    component: "captain-kit",
    system,
    user,
    fallback,
    maxTokens: 2000,
    schemaName: "captain_kit",
    schema: KIT_SCHEMA,
    validate: isCaptainKit,
  });
}

export type CopilotMetrics = {
  total: number;
  verified: number;
  todayCount: number;
  targetToday: number;
  signups: number;
  ideas: number;
  visits: number;
  shares: number;
  unverified: number;
  bestSource: string | null;
  bestCollege: string | null;
  daysLeft: number;
};

function isCopilotMove(value: unknown): value is CopilotMove {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return isString(v.text) && isString(v.reason) && v.text.length <= 240;
}

export async function recommendNextMove(
  metrics: CopilotMetrics,
): Promise<{ data: CopilotMove; source: AiSource; model: string | null }> {
  const fallback = fallbackCopilot(metrics);
  const system = `You are the growth copilot for a 7-day campaign to get 500 registrations for a free 3-day student workshop in India.

Campaign facts: free, 3 days, 500 seats, individual projects and a certificate with the project name. There are no teams, mentors, extra seats, placement guarantees, rewards, ₹200, prizes or other incentives.

Given the funnel numbers, recommend exactly ONE concrete action for the next 6 hours.
Rules:
- Prefer peer channels: campus captains, referrals, clubs, WhatsApp groups. Ads are a last resort and the budget is tiny.
- Use the specific numbers in the reason.
- Never mention rewards, ₹200, prizes or incentives. Never invent an extra seat. Do not suggest "invite X friends for an extra spot".
- Never suggest scraping phone numbers, buying lists, fake scarcity, or engagement bait.
- The action must be executable today by one organiser.
Return ONLY valid JSON:
{"text":"one imperative action, under 180 characters","reason":"2 sentences citing the numbers"}`;

  const user = `Funnel and campaign state:\n${JSON.stringify(metrics, null, 2)}`;

  const result = await withAi({
    component: "growth-copilot",
    system,
    user,
    fallback,
    maxTokens: 1200,
    schemaName: "growth_copilot_move",
    schema: COPILOT_SCHEMA,
    validate: isCopilotMove,
  });

  try {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO recommendations (day, text, reason, metrics_json, source, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        new Date().toISOString().slice(0, 10),
        result.data.text,
        result.data.reason,
        JSON.stringify(metrics),
        result.source,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // Still return the recommendation even if persistence fails.
  }

  return result;
}

function isEvaluation(value: unknown): value is Evaluation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === "number" &&
    v.score >= 0 &&
    v.score <= 100 &&
    isStringList(v.strengths, 2, 5) &&
    isString(v.next_step) &&
    isString(v.certificate_text)
  );
}

export async function evaluateProject(input: {
  name: string;
  college: string;
  title: string;
  url: string;
  description: string;
}): Promise<{ data: Evaluation; source: AiSource; model: string | null }> {
  const fallback = fallbackEvaluation(input);
  const system = `You evaluate final-year student projects from a 3-day build sprint. Be specific, fair and useful.

Rules:
- Score 0-100. 60-85 for a completed small project, 86-94 for a deployed project with evidence of users. 95+ is reserved for exceptional, real-world traction.
- Strengths must reference what is actually in the submission, not generic praise.
- The next step is one concrete fix, achievable this week.
- No invented facts about the project.
Return ONLY valid JSON:
{"score":82,"strengths":["...","...","..."],"next_step":"...","certificate_text":"one sentence naming the project and outcome"}`;

  const user = `Student: ${input.name} (${input.college})\nProject title: ${input.title}\nProject URL: ${input.url}\nDescription: ${input.description || "(no description provided)"}`;

  return withAi({
    component: "project-evaluator",
    system,
    user,
    fallback,
    maxTokens: 1600,
    schemaName: "project_evaluation",
    schema: EVALUATION_SCHEMA,
    validate: isEvaluation,
  });
}
