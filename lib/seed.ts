import { branches, interests } from "./config";

/**
 * Deterministic demo campaign. Every row is written with is_demo = 1 and the
 * UI tags it, so preview numbers are never mistaken for real registrations.
 */

const DAY_MS = 86_400_000;

const DEMO_COLLEGES: { name: string; city: string }[] = [
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
  { name: "MVSR Engineering College", city: "Hyderabad" },
  { name: "Amity University", city: "Noida" },
];

const CAPTAINS = [
  { name: "Aarav Sharma", college: 0, branch: "CSE" },
  { name: "Ananya Rao", college: 1, branch: "IT" },
  { name: "Vihaan Mehta", college: 2, branch: "CSE" },
  { name: "Diya Nair", college: 3, branch: "AI & ML" },
  { name: "Arjun Reddy", college: 4, branch: "ECE" },
  { name: "Ishita Bose", college: 5, branch: "CSE" },
  { name: "Kabir Khan", college: 6, branch: "IT" },
  { name: "Meera Iyer", college: 7, branch: "Data Science" },
  { name: "Rohan Das", college: 8, branch: "CSE" },
  { name: "Saanvi Kulkarni", college: 9, branch: "Mechanical" },
  { name: "Aditya Verma", college: 10, branch: "ECE" },
  { name: "Nisha Patel", college: 11, branch: "BBA / Management" },
  { name: "Reyansh Gupta", college: 0, branch: "EEE" },
  { name: "Tara Menon", college: 1, branch: "AI & ML" },
  { name: "Dev Malhotra", college: 2, branch: "IT" },
  { name: "Zara Sheikh", college: 3, branch: "Biotech" },
  { name: "Karthik Srinivas", college: 4, branch: "CSE" },
  { name: "Avni Joshi", college: 5, branch: "Data Science" },
];

// Deliberately uneven, like real captain performance.
const CAPTAIN_REFERRALS = [19, 17, 16, 14, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 7, 6, 5];

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

const DEMO_SOURCES = ["referral", "referral", "referral", "whatsapp", "whatsapp", "club", "linkedin", "captain"];
const DEMO_YEARS = ["Final year", "Final year", "Final year", "Final year", "Final year", "3rd year", "3rd year", "2nd year"];

const DEMO_SUBMISSIONS = [
  {
    registrantId: 24,
    title: "CampusBus — live shuttle tracking",
    url: "https://campusbus-demo.example.com",
    description:
      "A live college shuttle tracker with route ETAs, a driver view and a Telegram alert when the bus leaves the main gate. Built with Next.js, Supabase Realtime and Leaflet. Tested with 40 students for a week.",
    score: 88,
    feedback: {
      score: 88,
      strengths: [
        "Solves a daily, visible campus problem rather than a generic CRUD tutorial.",
        "Has a real deployment and a small set of actual users.",
        "Realtime ETA is the feature people would open twice a day.",
      ],
      next_step: "Add an offline-safe cached timetable and one photo of the shuttle stop before the showcase.",
      certificate_text:
        "Built CampusBus, a realtime campus shuttle tracker, and shipped it to a working deployment during ShipWeek.",
    },
  },
  {
    registrantId: 61,
    title: "MessMate — hostel mess forecasting",
    url: "https://messmate-demo.example.com",
    description:
      "Predicts how many plates each hostel mess should prepare using attendance history and exam calendars. Admin dashboard shows waste per day and an SMS-style headcount for the cook. Python, FastAPI, Postgres, simple regression model.",
    score: 82,
    feedback: {
      score: 82,
      strengths: [
        "Clear cost and waste angle that a hostel office would actually pay attention to.",
        "The model is simple and explainable, which is the right call for a 3-day build.",
        "Dashboard shows the number a mess manager can act on tomorrow morning.",
      ],
      next_step: "Connect the forecast to a real week of mess data instead of the seeded sample.",
      certificate_text:
        "Built MessMate, a mess-demand forecasting tool that turns attendance history into a daily plate count.",
    },
  },
  {
    registrantId: 97,
    title: "PlacePrep AI — mock interview coach",
    url: "https://placeprep-demo.example.com",
    description:
      "A browser-based mock interview coach for final-year students. Pick a role, answer five questions by voice, and get a scored transcript with filler-word counts and a better sample answer. Next.js, Web Speech API, LLM feedback.",
    score: 91,
    feedback: {
      score: 91,
      strengths: [
        "Directly targets the placement anxiety the workshop is about.",
        "Voice input plus a scored transcript is a complete loop, not a chat window.",
        "The sample answer rewrite is the shareable part; it is what students send to friends.",
      ],
      next_step: "Add a role-specific question bank and let students replay one answer before scoring.",
      certificate_text:
        "Built PlacePrep AI, a voice mock-interview coach that scores answers and rewrites the weakest one.",
    },
  },
  {
    registrantId: 142,
    title: "SplitSet — UPI bill splitting for flats",
    url: "https://splitset-demo.example.com",
    description:
      "Bill splitting for student flats: upload a receipt, assign items, and get one UPI request per roommate. Stores recurring rent and wifi splits. Built with React, Node and Postgres. 12 flats on the waitlist.",
    score: 76,
    feedback: {
      score: 76,
      strengths: [
        "The one-tap UPI request is a real convenience over typing amounts into a group chat.",
        "Recurring rent and wifi gives it a reason to be reopened every month.",
        "You already have a waitlist, which is stronger evidence than a nice UI.",
      ],
      next_step: "Finish the receipt-splitting flow end to end; the waitlist will forgive rough edges if that works.",
      certificate_text:
        "Built SplitSet, a UPI-native bill splitter for student flats, and opened it to a 12-flat waitlist.",
    },
  },
];

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261028);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 6);
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const dayIso = (msAgo: number) => iso(msAgo).slice(0, 10);

export async function seedDemo(db: D1Database): Promise<void> {
  const existing = await db
    .prepare("SELECT COUNT(*) AS n FROM registrants")
    .first<{ n: number }>();
  if ((existing?.n ?? 0) > 0) return;

  // 1. Colleges (explicit ids keep the generated rows easy to link).
  await db.batch(
    DEMO_COLLEGES.map((c, i) =>
      db
        .prepare("INSERT OR IGNORE INTO colleges (id, name, city, created_at) VALUES (?, ?, ?, ?)")
        .bind(i + 1, c.name, c.city, iso(7 * DAY_MS)),
    ),
  );

  // 2. Registrants: 18 captains, 197 captain referrals, 21 organic referrals.
  type DemoRegistrant = {
    id: number;
    name: string;
    email: string;
    phone: string;
    collegeId: number;
    year: string;
    branch: string;
    interest: string;
    refCode: string;
    referredBy: string | null;
    source: string;
    verified: number;
    verifyToken: string;
    checkedIn: number;
    createdAt: string;
  };

  const rows: DemoRegistrant[] = [];
  const usedNames = new Set<string>();

  CAPTAINS.forEach((captain, i) => {
    const id = i + 1;
    const first = captain.name.split(" ")[0].toLowerCase();
    const last = captain.name.split(" ")[1].toLowerCase().replace(/[^a-z]/g, "");
    rows.push({
      id,
      name: captain.name,
      email: `${first}.${last}@example.com`,
      phone: `900000${String(1000 + id)}`,
      collegeId: captain.college + 1,
      year: "Final year",
      branch: captain.branch,
      interest: pick(interests),
      refCode: `${slug(captain.name)}-${100 + id}`,
      referredBy: null,
      source: "captain",
      verified: 1,
      verifyToken: `demo-token-${id}`,
      checkedIn: 1,
      createdAt: iso(7 * DAY_MS - 3_600_000),
    });
    usedNames.add(captain.name);
  });

  let nextId = CAPTAINS.length + 1;

  for (let c = 0; c < CAPTAINS.length; c++) {
    const captain = CAPTAINS[c];
    for (let k = 0; k < CAPTAIN_REFERRALS[c]; k++) {
      const id = nextId++;
      let first = pick(FIRST_NAMES);
      let last = pick(LAST_NAMES);
      let guard = 0;
      while (usedNames.has(`${first} ${last}`) && guard < 20) {
        first = pick(FIRST_NAMES);
        last = pick(LAST_NAMES);
        guard++;
      }
      usedNames.add(`${first} ${last}`);
      const sameCollege = rand() < 0.82;
      const collegeId = sameCollege ? captain.college + 1 : 1 + Math.floor(rand() * DEMO_COLLEGES.length);
      const day = Math.max(0, Math.min(6, Math.floor(rand() * 6.4)));
      const verified = rand() < 0.93 ? 1 : 0;
      rows.push({
        id,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}${id}@example.com`,
        phone: `900000${String(1000 + id)}`,
        collegeId,
        year: pick(DEMO_YEARS),
        branch: pick(branches.filter((b) => b !== "Other")),
        interest: pick(interests),
        refCode: `${slug(first)}-${100 + id}`,
        referredBy: rows[c].refCode,
        source: pick(DEMO_SOURCES),
        verified,
        verifyToken: `demo-token-${id}`,
        checkedIn: verified && rand() < 0.58 ? 1 : 0,
        createdAt: iso((6 - day) * DAY_MS + Math.floor(rand() * 10) * 3_600_000),
      });
    }
  }

  // Organic referrals: a handful of early registrants shared their own link.
  const organicReferrers = [22, 35, 48, 63, 77, 91, 108, 126, 144, 159, 173, 187, 199, 211];
  const organicCounts = [2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1];
  for (let i = 0; i < organicReferrers.length; i++) {
    const referrer = rows.find((r) => r.id === organicReferrers[i]);
    if (!referrer) continue;
    for (let k = 0; k < organicCounts[i]; k++) {
      const id = nextId++;
      let first = pick(FIRST_NAMES);
      let last = pick(LAST_NAMES);
      let guard = 0;
      while (usedNames.has(`${first} ${last}`) && guard < 20) {
        first = pick(FIRST_NAMES);
        last = pick(LAST_NAMES);
        guard++;
      }
      usedNames.add(`${first} ${last}`);
      const day = 2 + Math.floor(rand() * 5);
      const verified = rand() < 0.9 ? 1 : 0;
      rows.push({
        id,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}${id}@example.com`,
        phone: `900000${String(1000 + id)}`,
        collegeId: referrer.collegeId,
        year: pick(DEMO_YEARS),
        branch: pick(branches.filter((b) => b !== "Other")),
        interest: pick(interests),
        refCode: `${slug(first)}-${100 + id}`,
        referredBy: referrer.refCode,
        source: "referral",
        verified,
        verifyToken: `demo-token-${id}`,
        checkedIn: verified && rand() < 0.5 ? 1 : 0,
        createdAt: iso((6 - day) * DAY_MS + Math.floor(rand() * 12) * 3_600_000),
      });
    }
  }

  const registrantStatement = db.prepare(
    `INSERT OR IGNORE INTO registrants
      (id, name, email, phone, college_id, year, branch, interest, ref_code, referred_by,
       source, verified, confirmation_method, verify_token, ip_hash, device_id, idea_json, checked_in, is_demo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, NULL, NULL, NULL, ?, 1, ?)`,
  );
  for (let i = 0; i < rows.length; i += 40) {
    await db.batch(
      rows.slice(i, i + 40).map((r) =>
        registrantStatement.bind(
          r.id, r.name, r.email, r.phone, r.collegeId, r.year, r.branch, r.interest,
          r.refCode, r.referredBy, r.source, r.verified, r.verifyToken, r.checkedIn, r.createdAt,
        ),
      ),
    );
  }

  // 3. Captains.
  await db.batch(
    CAPTAINS.map((_, i) =>
      db
        .prepare("INSERT OR IGNORE INTO captains (registrant_id, target, rewards_eligible, created_at) VALUES (?, 20, 1, ?)")
        .bind(i + 1, iso(7 * DAY_MS)),
    ),
  );

  // 4. Workshop-day submissions.
  await db.prepare("UPDATE registrants SET checked_in = 1 WHERE id IN (24, 61, 97, 142)").run();
  await db.batch(
    DEMO_SUBMISSIONS.map((s) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO submissions
            (registrant_id, project_title, project_url, description, score, feedback_json, certificate_id, is_demo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(
          s.registrantId, s.title, s.url, s.description, s.score,
          JSON.stringify(s.feedback), `SW-26-${String(s.registrantId).padStart(4, "0")}`,
          iso(DAY_MS / 2),
        ),
    ),
  );

  // 5. Seeded funnel history. Real visits are tracked in `events`; this table
  //    only exists so the dashboard has a campaign-sized demo on day one.
  const funnel = [
    { visits: 95, ideas: 30, signupStarts: 21, shares: 7 },
    { visits: 240, ideas: 72, signupStarts: 55, shares: 18 },
    { visits: 330, ideas: 104, signupStarts: 78, shares: 27 },
    { visits: 290, ideas: 88, signupStarts: 66, shares: 25 },
    { visits: 220, ideas: 62, signupStarts: 47, shares: 19 },
    { visits: 160, ideas: 41, signupStarts: 31, shares: 13 },
    { visits: 115, ideas: 26, signupStarts: 19, shares: 8 },
  ];
  await db.batch(
    funnel.map((f, i) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO demo_funnel (day, visits, ideas, signup_starts, share_clicks) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(dayIso((6 - i) * DAY_MS), f.visits, f.ideas, f.signupStarts, f.shares),
    ),
  );
}

export { DEMO_COLLEGES };
