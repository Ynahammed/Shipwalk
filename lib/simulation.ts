import { branches, interests, workshop, years } from "./config";
import { DAY_MS, SIM_KIND } from "./mode";

/**
 * Full-campaign simulation.
 *
 * Generates a complete, internally consistent campaign of 300+ students so the
 * dashboard, leaderboard, funnel, review queue and certificates can be exercised
 * at real scale without touching a single real signup.
 *
 * Every row is written with is_demo = 1 and demo_kind = 'sim':
 *  - it can never be counted in live totals (all live queries filter is_demo = 0),
 *  - it can be deleted in one action without touching live or base-demo rows,
 *  - it is visibly tagged and banner-marked while simulation mode is on.
 */

export const SIM_STUDENT_TARGET = 340;

const SIM_COLLEGES = [
  { name: "VNR VJIET", city: "Hyderabad" },
  { name: "CBIT", city: "Hyderabad" },
  { name: "VIT", city: "Vellore" },
  { name: "SRM KTR", city: "Chennai" },
  { name: "PES University", city: "Bengaluru" },
  { name: "IIIT Hyderabad", city: "Hyderabad" },
  { name: "Anurag University", city: "Hyderabad" },
  { name: "BMS College of Engineering", city: "Bengaluru" },
  { name: "Jadavpur University", city: "Kolkata" },
  { name: "COEP Technological University", city: "Pune" },
  { name: "KIIT", city: "Bhubaneswar" },
  { name: "Thapar Institute", city: "Patiala" },
  { name: "NIT Trichy", city: "Tiruchirappalli" },
  { name: "Manipal Institute of Technology", city: "Manipal" },
];

// 16 captains. Referral counts are uneven on purpose.
const SIM_CAPTAINS = [
  { name: "Aarav Sharma", college: 0, branch: "CSE", referrals: 19 },
  { name: "Ananya Rao", college: 1, branch: "IT", referrals: 18 },
  { name: "Vihaan Mehta", college: 2, branch: "CSE", referrals: 17 },
  { name: "Diya Nair", college: 3, branch: "AI & ML", referrals: 16 },
  { name: "Arjun Reddy", college: 4, branch: "ECE", referrals: 15 },
  { name: "Ishita Bose", college: 5, branch: "CSE", referrals: 14 },
  { name: "Kabir Khan", college: 6, branch: "IT", referrals: 13 },
  { name: "Meera Iyer", college: 7, branch: "Data Science", referrals: 12 },
  { name: "Rohan Das", college: 8, branch: "CSE", referrals: 12 },
  { name: "Saanvi Kulkarni", college: 9, branch: "Mechanical", referrals: 11 },
  { name: "Aditya Verma", college: 10, branch: "ECE", referrals: 11 },
  { name: "Nisha Patel", college: 11, branch: "BBA / Management", referrals: 10 },
  { name: "Reyansh Gupta", college: 12, branch: "EEE", referrals: 10 },
  { name: "Tara Menon", college: 13, branch: "AI & ML", referrals: 9 },
  { name: "Dev Malhotra", college: 0, branch: "IT", referrals: 9 },
  { name: "Zara Sheikh", college: 1, branch: "Biotech", referrals: 8 },
];

const FIRST_NAMES = [
  "Aryan", "Sneha", "Rahul", "Priya", "Neel", "Riya", "Om", "Kavya", "Yash", "Pooja",
  "Nikhil", "Shreya", "Aman", "Tanvi", "Siddharth", "Aditi", "Harsh", "Nandini", "Varun", "Simran",
  "Abhinav", "Ritika", "Karan", "Aishwarya", "Mohit", "Divya", "Pranav", "Sanya", "Vivek", "Trisha",
  "Akash", "Bhavya", "Manav", "Charu", "Rajat", "Lavanya", "Sameer", "Anjali", "Gaurav", "Janhavi",
  "Naveen", "Payal", "Vineet", "Swara", "Deepak", "Nidhi", "Raghav", "Mitali", "Suyash", "Komal",
  "Farhan", "Ayesha", "Imran", "Fatima", "Joel", "Maria", "Harish", "Lakshmi", "Teja", "Sruthi",
];

const LAST_NAMES = [
  "Kumar", "Reddy", "Gupta", "Nair", "Iyer", "Menon", "Sharma", "Verma", "Rao", "Naidu",
  "Singh", "Patel", "Shah", "Mehta", "Desai", "Joshi", "Kulkarni", "Bhat", "Hegde", "Shetty",
  "Das", "Banerjee", "Ghosh", "Mukherjee", "Chatterjee", "Chowdhury", "Khan", "Ahmed", "Sheikh", "Fernandes",
  "D'Souza", "Thomas", "Mathew", "Joseph", "George", "Pillai", "Varma", "Yadav", "Mishra", "Tiwari",
  "Pandey", "Dubey", "Agarwal", "Jain", "Bansal", "Kapoor", "Malhotra", "Chopra", "Saxena", "Sinha",
];

const PROJECT_TEMPLATES = [
  {
    title: "MessMenu AI — hostel mess planner",
    url: "https://sim-messmenu.example.com",
    description:
      "Paste the week's mess menu and get a shopping list grouped by vendor, with repeated items called out. One server route calls a hosted LLM with a strict JSON schema. Built with Next.js on Cloudflare Workers during the 60-minute session.",
    strengths: ["Replaces a real weekly chore", "Prompt returns validated JSON", "Deployed inside the hour"],
  },
  {
    title: "DeadlineDecoder — syllabus to deadline table",
    url: "https://sim-deadlinedecoder.example.com",
    description:
      "Paste syllabus text and get one table of deliverables and dates, plus what to start tonight. Rows without a parseable date are dropped instead of guessed. Next.js with one hosted model call, deployed in the session.",
    strengths: ["Useful before exam week", "No invented dates", "Result is screenshot-ready"],
  },
  {
    title: "ReplyCoach — three replies to one message",
    url: "https://sim-replycoach.example.com",
    description:
      "Paste a message you are nervous about and get three replies at different levels of formality plus what the sender wants. The system prompt fixes the tones and returns JSON so the tabs never break. Next.js and a hosted LLM.",
    strengths: ["Tone control is the engineering", "One screen, three clear options", "Immediately shareable output"],
  },
  {
    title: "ErrorPlain — stack trace in plain English",
    url: "https://sim-errorplain.example.com",
    description:
      "Paste a stack trace and get the likely cause, three ranked fixes and the one line that matters. The prompt must quote the failing frame and return JSON; ordering is computed in code. Built with Next.js and Groq in the session.",
    strengths: ["Grounded answers with a quoted frame", "Ranked fixes give the page hierarchy", "Two friends already used it"],
  },
  {
    title: "NoteFlash — notes to flashcards",
    url: "https://sim-noteflash.example.com",
    description:
      "Paste lecture notes and get ten flashcards with hidden answers plus three exam-style questions. The prompt caps card length and the app validates the array before rendering. Next.js and a hosted model, deployed during the session.",
    strengths: ["Clear output contract", "Reveal interaction is quick to build", "Useful the night before a test"],
  },
  {
    title: "InterviewDrill — job description to questions",
    url: "https://sim-interviewdrill.example.com",
    description:
      "Paste a job description and get five grounded interview questions with model answers and the one keyword your answer misses. Built with Next.js and one server-side LLM call in the 60-minute session.",
    strengths: ["Questions stay grounded in the pasted text", "Doubles as placement prep", "Model answers are rehearsable"],
  },
  {
    title: "SpendTeller — SMS to spending summary",
    url: "https://sim-spendteller.example.com",
    description:
      "Paste a month of bank SMS alerts and get a categorised spending summary with one category to cut. The model extracts rows; all arithmetic happens in code. Next.js and a hosted LLM, deployed in the session.",
    strengths: ["Model never does the maths", "No bank login needed", "Summary is easy to screenshot"],
  },
  {
    title: "ClinicPlain — notes in plain language",
    url: "https://sim-clinicplain.example.com",
    description:
      "Paste a discharge note and get a plain-language version at two reading levels plus three questions for the next visit. The prompt refuses to give medical advice. Next.js and a hosted model, built during the session.",
    strengths: ["Clear safety rules in the prompt", "Two reading levels side by side", "Real accessibility angle"],
  },
  {
    title: "ComplaintDrafter — firm, polite email",
    url: "https://sim-complaintdrafter.example.com",
    description:
      "Paste what went wrong and get a firm, polite email with subject, body and escalation path. Strict JSON output, editable fields and a copy button. Next.js and a hosted LLM, built and deployed in the session.",
    strengths: ["Tone constraints are explicit", "Editable output beats a chat reply", "Before/after demo is instant"],
  },
  {
    title: "PitchPolish — resume paragraph rewrite",
    url: "https://sim-pitchpolish.example.com",
    description:
      "Paste a project paragraph and get a recruiter-ready version, the three questions it invites and the claim you cannot defend yet. The prompt forbids invented metrics. Next.js and one model call, deployed in the session.",
    strengths: ["Editing with constraints", "Doubles as placement prep", "Output is a resume line"],
  },
];

const APPROVED_RATIO = 0.62;

export type SimRegistrantRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  collegeIndex: number;
  year: string;
  branch: string;
  interest: string;
  refCode: string;
  referredBy: string | null;
  source: string;
  verified: number;
  confirmationMethod: "email" | "self" | "pending";
  checkedIn: number;
  createdAt: string;
};

export type SimSubmissionRow = {
  registrantId: number;
  title: string;
  url: string;
  description: string;
  score: number;
  finalScore: number | null;
  reviewStatus: "pending" | "approved";
  feedbackJson: string;
  certificateId: string | null;
  createdAt: string;
};

export type SimEventRow = {
  type: string;
  path: string;
  qty: number;
  sessionId: string;
  createdAt: string;
};

export type SimulationRows = {
  colleges: { name: string; city: string }[];
  registrants: SimRegistrantRow[];
  captains: { registrantId: number; target: number }[];
  submissions: SimSubmissionRow[];
  events: SimEventRow[];
};

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cleanSlug = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);

/**
 * Pure, deterministic generator. No database access, so the shape and the
 * invariants can be tested directly.
 */
export function buildSimulation(
  options: { now?: number; accountCount?: number; historyDays?: number } = {},
): SimulationRows {
  const now = options.now ?? Date.now();
  const target = Math.max(300, options.accountCount ?? SIM_STUDENT_TARGET);
  const rand = mulberry32(20261106);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  // Campaign history is compressed into the days that have actually elapsed so
  // the pace chart never shows students registering in the future.
  const elapsed = Math.max(1, Math.min(7, options.historyDays ?? 7));
  const historySpan = Math.max(DAY_MS, (elapsed - 1) * DAY_MS);
  const createdAt = () => {
    const skew = Math.pow(rand(), 1.25);
    return new Date(now - Math.floor(skew * historySpan) - Math.floor(rand() * 3_600_000)).toISOString();
  };

  const usedNames = new Set<string>();
  const usedEmails = new Set<string>();
  const registrants: SimRegistrantRow[] = [];
  const captains: { registrantId: number; target: number }[] = [];

  const addRegistrant = (
    base: Omit<SimRegistrantRow, "id" | "email" | "phone" | "refCode" | "interest">,
  ): SimRegistrantRow => {
    const id = registrants.length + 1;
    let first = base.name.split(" ")[0];
    let last = base.name.split(" ").slice(1).join(" ") || pick(LAST_NAMES);
    let name = `${first} ${last}`;
    let guard = 0;
    while (usedNames.has(name) && guard < 40) {
      first = pick(FIRST_NAMES);
      last = pick(LAST_NAMES);
      name = `${first} ${last}`;
      guard++;
    }
    usedNames.add(name);

    const emailBase = `${cleanSlug(first)}.${cleanSlug(last) || "student"}${id}@example.com`;
    let email = emailBase;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = emailBase.replace("@", `${suffix}@`);
      suffix++;
    }
    usedEmails.add(email);

    const row: SimRegistrantRow = {
      ...base,
      id,
      name,
      email,
      phone: `98${String(30_000_000 + id)}`,
      refCode: `sim-${1000 + id}`,
      interest: pick(interests),
    };
    registrants.push(row);
    return row;
  };

  SIM_CAPTAINS.forEach((captain, index) => {
    const row = addRegistrant({
      name: captain.name,
      collegeIndex: captain.college,
      year: "Final year",
      branch: captain.branch,
      referredBy: null,
      source: "captain",
      verified: 1,
      confirmationMethod: "email",
      checkedIn: 1,
      createdAt: createdAt(),
    });
    captains.push({ registrantId: row.id, target: 20 + (index % 4) * 5 });
  });

  // Captain referrals first, so the leaderboard has a believable top order.
  SIM_CAPTAINS.forEach((captain, captainIndex) => {
    const referrer = registrants[captainIndex];
    for (let k = 0; k < captain.referrals; k++) {
      const sameCollege = rand() < 0.78;
      const roll = rand();
      const verified = roll < 0.9 ? 1 : 0;
      const method = verified === 1 ? (rand() < 0.93 ? "email" : "self") : "pending";
      addRegistrant({
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        collegeIndex: sameCollege
          ? captain.college
          : Math.floor(rand() * SIM_COLLEGES.length),
        year: rand() < 0.62 ? "Final year" : pick(years),
        branch: pick(branches.filter((b) => b !== "Other")),
        referredBy: referrer.refCode,
        source: pick(["referral", "referral", "whatsapp", "club", "captain", "linkedin"]),
        verified,
        confirmationMethod: method,
        checkedIn: verified === 1 && rand() < 0.52 ? 1 : 0,
        createdAt: createdAt(),
      });
    }
  });

  // Organic growth: earlier students refer their own friends until the
  // campaign reaches its target size.
  let cursor = SIM_CAPTAINS.length;
  while (registrants.length < target) {
    const referrer = rand() < 0.55 && cursor < registrants.length ? registrants[cursor++] : null;
    const roll = rand();
    const verified = roll < 0.87 ? 1 : 0;
    const method = verified === 1 ? (rand() < 0.9 ? "email" : "self") : "pending";
    addRegistrant({
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      collegeIndex: referrer
        ? referrer.collegeIndex
        : Math.floor(rand() * SIM_COLLEGES.length),
      year: rand() < 0.55 ? "Final year" : pick(years),
      branch: pick(branches.filter((b) => b !== "Other")),
      referredBy: referrer?.refCode ?? null,
      source: referrer ? pick(["referral", "referral", "whatsapp"]) : pick(["whatsapp", "linkedin", "club", "direct"]),
      verified,
      confirmationMethod: method,
      checkedIn: verified === 1 && rand() < 0.48 ? 1 : 0,
      createdAt: createdAt(),
    });
  }

  // Submissions: the students who checked in mostly submitted. About two thirds
  // already have an organiser score and a certificate; the rest sit in the queue.
  const submitters = registrants
    .filter((r) => r.checkedIn === 1 && r.verified === 1)
    .slice(0, Math.min(78, Math.floor(registrants.length * 0.22)));
  const submissions: SimSubmissionRow[] = submitters.map((student, index) => {
    const template = PROJECT_TEMPLATES[index % PROJECT_TEMPLATES.length];
    const baseline = 48 + Math.floor(rand() * 44);
    const approved = rand() < APPROVED_RATIO;
    const finalScore = approved ? Math.max(40, Math.min(97, baseline + Math.floor(rand() * 11) - 4)) : null;
    const nextStep = approved
      ? "Keep the deployed version online and add one screenshot of the working flow before the showcase."
      : "Add the missing end-to-end flow the review mentions, then resubmit before the deadline.";
    return {
      registrantId: student.id,
      title: `${template.title}`,
      url: `${template.url}/${student.id}`,
      description: template.description,
      score: baseline,
      finalScore,
      reviewStatus: approved ? "approved" : "pending",
      feedbackJson: JSON.stringify({
        score: baseline,
        strengths: template.strengths,
        next_step: nextStep,
        certificate_text: `${student.name} built ${template.title.split(" — ")[0]}, a working project shipped during ShipWeek.`,
      }),
      certificateId: approved ? `SW-SIM-${String(student.id).padStart(4, "0")}` : null,
      createdAt: createdAt(),
    };
  });

  // Funnel history. Each row is an aggregated count (qty) for one day, which
  // keeps the simulation to a few dozen rows instead of thousands.
  const segments = [
    { type: "visit", total: Math.round(target * 4.6), path: "/" },
    { type: "idea_generated", total: Math.round(target * 1.6), path: "/#idea-generator" },
    { type: "signup_start", total: Math.round(target * 1.45), path: "/#claim" },
    { type: "share_click", total: Math.round(target * 0.55), path: "/thank-you" },
  ];
  const dayWeights = [0.07, 0.11, 0.14, 0.16, 0.18, 0.19, 0.15];
  const events: SimEventRow[] = [];
  segments.forEach((segment) => {
    for (let day = 0; day < 7; day++) {
      const qty = Math.round(segment.total * dayWeights[day]);
      if (qty <= 0) continue;
      const age = Math.min(6, Math.max(0, 6 - day)) * DAY_MS;
      events.push({
        type: segment.type,
        path: segment.path,
        qty,
        sessionId: `sim-session-${segment.type}-${day}`,
        createdAt: new Date(now - age - Math.floor(rand() * 6 * 3_600_000)).toISOString(),
      });
    }
  });

  return { colleges: SIM_COLLEGES, registrants, captains, submissions, events };
}

/** How many simulation rows currently exist, for the dashboard control. */
export async function simulationSummary(db: D1Database) {
  const [students, submissions, certificates] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 1 AND demo_kind = ?")
      .bind(SIM_KIND)
      .first<{ n: number }>(),
    db
      .prepare("SELECT COUNT(*) AS n FROM submissions WHERE is_demo = 1 AND demo_kind = ?")
      .bind(SIM_KIND)
      .first<{ n: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM submissions WHERE is_demo = 1 AND demo_kind = ? AND review_status = 'approved'",
      )
      .bind(SIM_KIND)
      .first<{ n: number }>(),
  ]);
  return {
    students: students?.n ?? 0,
    submissions: submissions?.n ?? 0,
    certificates: certificates?.n ?? 0,
  };
}

/** Deletes only simulation rows. Live data and the original demo are untouched. */
export async function clearSimulation(db: D1Database): Promise<number> {
  const results = await db.batch([
    db.prepare("DELETE FROM submissions WHERE is_demo = 1 AND demo_kind = ?").bind(SIM_KIND),
    db.prepare(
      "DELETE FROM captains WHERE registrant_id IN (SELECT id FROM registrants WHERE is_demo = 1 AND demo_kind = ?)",
    ).bind(SIM_KIND),
    db.prepare("DELETE FROM events WHERE is_demo = 1 AND demo_kind = ?").bind(SIM_KIND),
    db.prepare("DELETE FROM registrants WHERE is_demo = 1 AND demo_kind = ?").bind(SIM_KIND),
    db.prepare(
      "DELETE FROM colleges WHERE id NOT IN (SELECT DISTINCT college_id FROM registrants)",
    ),
  ]);
  return results.reduce((sum, result) => sum + (result.meta.changes ?? 0), 0);
}

/**
 * Writes a full simulation. Always rebuilds from scratch so repeated runs are
 * deterministic instead of stacking duplicate campaigns.
 */
export async function seedSimulation(
  db: D1Database,
  options: { now?: number } = {},
): Promise<{ students: number; submissions: number; events: number }> {
  await clearSimulation(db);
  const now = options.now ?? Date.now();
  const start = new Date(workshop.campaignStartsAt).getTime();
  const historyDays = Math.max(1, Math.min(7, Math.floor((now - start) / DAY_MS) + 1));
  const rows = buildSimulation({ ...options, now, historyDays });

  // 1. Colleges: reuse any that already exist, then resolve ids by name.
  await db.batch(
    rows.colleges.map((college) =>
      db
        .prepare("INSERT OR IGNORE INTO colleges (name, city, created_at) VALUES (?, ?, ?)")
        .bind(college.name, college.city, new Date().toISOString()),
    ),
  );
  const collegeRows = await db
    .prepare("SELECT id, name FROM colleges")
    .all<{ id: number; name: string }>();
  const collegeIds = new Map((collegeRows.results ?? []).map((c) => [c.name, c.id]));

  // 2. Registrants. Explicit ids start after the current maximum so live and
  //    base-demo rows are never touched or renumbered.
  const maxRow = await db
    .prepare("SELECT COALESCE(MAX(id), 0) AS n FROM registrants")
    .first<{ n: number }>();
  const idBase = maxRow?.n ?? 0;
  const registrantStatement = db.prepare(
    `INSERT INTO registrants
      (id, name, email, phone, college_id, year, branch, interest, ref_code, referred_by,
       source, verified, confirmation_method, email_sent, verify_token, ip_hash, device_id,
       idea_json, checked_in, is_demo, demo_kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, ?, 1, ?, ?)`,
  );
  for (let i = 0; i < rows.registrants.length; i += 40) {
    await db.batch(
      rows.registrants.slice(i, i + 40).map((r) =>
        registrantStatement.bind(
          idBase + r.id,
          r.name,
          r.email,
          r.phone,
          collegeIds.get(rows.colleges[r.collegeIndex].name) ?? 1,
          r.year,
          r.branch,
          r.interest,
          r.refCode,
          r.referredBy,
          r.source,
          r.verified,
          r.confirmationMethod,
          r.checkedIn,
          SIM_KIND,
          r.createdAt,
        ),
      ),
    );
  }

  // 3. Captains.
  await db.batch(
    rows.captains.map((captain) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO captains (registrant_id, target, rewards_eligible, created_at) VALUES (?, ?, 1, ?)",
        )
        .bind(idBase + captain.registrantId, captain.target, new Date().toISOString()),
    ),
  );

  // 4. Submissions and certificates.
  for (let i = 0; i < rows.submissions.length; i += 40) {
    await db.batch(
      rows.submissions.slice(i, i + 40).map((s) =>
        db
          .prepare(
            `INSERT INTO submissions
              (registrant_id, project_title, project_url, description, score, feedback_json,
               certificate_id, final_score, review_status, reviewed_at, url_status, url_checked_at,
               is_demo, demo_kind, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          )
          .bind(
            idBase + s.registrantId,
            s.title,
            s.url,
            s.description,
            s.score,
            s.feedbackJson,
            s.certificateId,
            s.finalScore,
            s.reviewStatus,
            s.reviewStatus === "approved" ? s.createdAt : null,
            "ok HTTP 200 (simulated)",
            s.createdAt,
            SIM_KIND,
            s.createdAt,
          ),
      ),
    );
  }

  // 5. Aggregated funnel events.
  await db.batch(
    rows.events.map((event) =>
      db
        .prepare(
          `INSERT INTO events (type, path, session_id, qty, is_demo, demo_kind, created_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(event.type, event.path, event.sessionId, event.qty, SIM_KIND, event.createdAt),
    ),
  );

  return {
    students: rows.registrants.length,
    submissions: rows.submissions.length,
    events: rows.events.length,
  };
}
