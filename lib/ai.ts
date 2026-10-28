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
  "turn a wall of messy text into a ranked, actionable list",
  "rewrite one message for a specific audience and explain why it works",
  "extract structured fields from an unstructured document or message",
  "explain a dense paragraph at three levels of difficulty",
  "compare two options against stated criteria and pick one",
  "turn a rough idea into a step-by-step plan with time estimates",
  "find what is missing from a draft and ask the questions a reviewer would",
  "convert a timetable, menu or ledger into a plain-language summary",
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
  const system = `You are the project scout for ShipWeek, a free 60-minute AI build session for Indian college students who have never called an AI API. Output exactly one first-AI-project that a single beginner can build and deploy inside the hour, then talk about in a placement interview.

THE STACK IS FIXED. Every idea is one Next.js (App Router, TypeScript) + Tailwind page deployed to Cloudflare Workers, with at most one server-side call to a hosted OpenAI-compatible LLM (Groq). No database, no accounts, no payments, no background jobs, no agents, no vector store, no fine-tuning. Never suggest Python, Streamlit, Flask/FastAPI, Django, Docker, Heroku (its free tier is gone), Firebase, Supabase, native iOS/Android builds, or anything that needs a GPU or a paid API.

SESSION BUDGET: input box -> one system prompt -> one model call -> one rendered result. The input must be text the student can paste (notes, a menu, a message, a job description), pre-filled with a sample so the demo works instantly. The output must be worth screenshotting: a ranked list, a structured plan, a rewritten message, a score with reasons. No multi-page navigation, no persistence, no auth.

SPECIFICITY CONTRACT:
- Decide the exact user and the moment they open it ("a hostel secretary pasting next week's menu"), but keep that framing out of the pitch.
- pitch: at most 2 sentences describing the product itself — what the user pastes in and what comes back. Never open with "A final-year student..." and never describe a persona wanting something. Never "an AI platform for X" or "a dashboard for Y".
- The core loop must produce something worth looking at: a ranked list, a structured plan, a rewrite, a score with reasons. A form that forwards one string to a chatbot is not an idea.
- The prompt must do real work: the model has to transform, rank, extract or explain, and the app must validate the response before rendering it.
- Vary the prompt-engineering hard part: strict JSON output, tone control, extraction from messy text, ranking with criteria, or explaining a decision.
- why: name the single hardest part they will build and the interview question it prepares them to answer. Never "showcases AI skills".
- roadmap: exactly 4 items, starting "00–15:", "15–35:", "35–50:", "50–60:" — in order: API key and first raw completion, the system prompt plus validated JSON, the screen plus a deploy, then the LinkedIn line and interview answer. No tests, Docker, auth or polish filler.

BANNED, because every interviewer has seen them or they are too thin: chatbot wrappers, generic "AI assistant" panels, to-do lists, quiz apps, weather apps, URL shorteners, QR generators, link-in-bio pages, countdown timers, resume builders, generic CRUD/admin dashboards, personal expense/habit/calorie/mood trackers, diabetes/loan/house-price/crop-yield predictors, sentiment-analysis demos, and "AI chatbot for college FAQ".

The branch matters only when it genuinely changes the problem; otherwise build around the interest. The idea must differ from every title in the avoid list, and must be finishable by one beginner across the session's two build blocks (15–35 code, 35–50 UI and deploy).`;

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
    "Time: 60 minutes total, guided live: 00–15 foundation and API key, 15–35 code build, 35–50 UI and deploy, 50–60 placement prep",
    "The whole hour is hands-on: they type along from the first API call to the live deployed link",
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
  const system = `You write WhatsApp share messages for a student who just registered for ShipWeek, a free 60-minute AI build session.

Event facts you may use: free 60-minute session for beginners, no prior AI experience needed, 500 seats, a deployed project with a live link, a certificate naming the project, and a personal referral link.
Rules:
- First person, like a real student texting friends. No corporate voice.
- Do not mention rewards, ₹200, prizes, incentives, mentors, teams, hackathons, networking, job guarantees, extra credits or goodies. The app explains rewards separately.
- No fake urgency, no invented stats, no "only X seats left".
- No links: the app adds the personal link after the message.
- Max one emoji. Each message under 280 characters.
- Three genuinely different angles: casual invite to friends, placement/career angle, curiosity hook for a group.
Return ONLY valid JSON:
{"casual":"...","placement":"...","curiosity":"..."}`;

  const user = `Name: ${input.name}\nCollege: ${input.college}\nBranch: ${input.branch}\nTheir project idea: ${input.ideaTitle || "a first AI project"}\nEvent: 60 minutes, free, no prior AI experience, 500 seats, deployed project and certificate`;

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
  const system = `You write launch kits for campus captains promoting ShipWeek, a free 60-minute AI build session for beginners. 500 seats total, certificate with the project name, referral rewards for the top five.

Facts you may use: ShipWeek is a free 60-minute AI build session on 7 Nov, with 500 seats, no prior AI experience required, a deployed project with a live link by the end of the hour, and a certificate naming the project. There are no mentors, teams, peer reviews, networking sessions, job guarantees, rewards, ₹200, prizes, extra credits or goodies.
Rules:
- Sound like a student organiser, not a brand.
- Never mention a fact outside the list above. Do not mention rewards, ₹200, prizes or incentives; the app explains those separately. No fake scarcity, no "only 50 seats", no placement guarantees.
- Poster caption under 200 characters. WhatsApp pitch under 700 characters, with line breaks.
- Exactly 4 replies to the doubts students actually raise.
Return ONLY valid JSON:
{"poster_caption":"...","whatsapp_pitch":"...","replies":[{"doubt":"...","reply":"..."}]}`;

  const user = `College: ${college}\nBranch mix: ${branchMix}\nAudience: students with no AI experience, placement-focused, WhatsApp-native`;

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
  const system = `You are the growth copilot for a 7-day campaign to get 500 registrations for a free 60-minute beginner AI workshop in India.

Campaign facts: free, 60 minutes, no prior AI experience needed, 500 seats, one deployed first AI project and a certificate naming it. There are no teams, mentors, extra seats, placement guarantees, rewards, ₹200, prizes or other incentives.

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
  linkCheck?: string;
}): Promise<{ data: Evaluation; source: AiSource; model: string | null }> {
  const fallback = fallbackEvaluation(input);
  const system = `You evaluate beginner projects from a 60-minute AI build session. You receive text only: a title, a URL string and a description.

What you cannot see:
- You cannot run the app, read the repo, or count users. A URL in the submission proves only that a link was typed.
- You are given one machine check of the link. If it says the link failed or timed out, say so plainly and cap the score at 35: a project nobody can open is not demoable.
- If the link check succeeded, that only means a page answered HTTP 200. Never claim the core loop works, that users exist, or that it is deployed well.

How to score (0-100, anchored — pick the band before picking a number). A first AI project is expected to be small; do not penalise small scope, only missing function:
- 0-15: not a reviewable project. Gibberish, placeholder text, keyboard mash, a link back to the submission form, or no described functionality.
- 16-35: an idea, a landing page, or a generic chatbot with no described input, prompt or result.
- 36-55: the model is called, but the loop is incomplete or the output is not usable/rendered.
- 56-75: one complete AI loop described end to end: an input, a prompt that does real work, a validated result and a screen that shows it.
- 76-88: a complete loop plus concrete evidence: prompt iteration, edge cases handled, real people who tried it, a measured result.
- 89-100: exceptional for one hour, with specific verifiable numbers or multiple tested use cases.

Hard rules:
- If the description is shorter than three sentences or never names an input and a feature, score at most 15.
- Strengths must quote what the description actually says. For a 0-15 score, state plainly what is missing instead of inventing strengths.
- next_step is one concrete fix they could make in thirty minutes.
- The certificate_text must not claim deployment, users or results; it names the project and what it does, framed as a first AI project built in the session.
Return ONLY valid JSON:
{"score":0,"strengths":["...","..."],"next_step":"...","certificate_text":"one sentence naming the project and what it does"}`;

  const user = `Student: ${input.name} (${input.college})\nProject title: ${input.title}\nProject URL: ${input.url}\nLink check: ${input.linkCheck ?? "not checked"}\nDescription: ${input.description || "(no description provided)"}`;

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
