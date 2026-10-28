import type { CaptainKit, CopilotMove, Evaluation, Idea, ShareMessages } from "./types";

const IDEAS: Idea[] = [
  {
    title: "CampusPilot",
    pitch:
      "A mobile-first home screen that turns a messy class WhatsApp group into today's timetable, every deadline in one list, and a realistic 7-day study plan. One core loop: paste the group's messages, get a clean day plan.",
    why: "Every final-year student loses marks to missed deadlines, so the demo is instantly relatable in an interview.",
    stack: ["Next.js", "D1", "Groq API for message cleanup", "Cloudflare Workers"],
    roadmap: [
      "Day 1: timetable + deadline input, one clean daily view",
      "Day 2: paste-a-message parser and the 7-day study plan",
      "Day 3: WhatsApp-style share card and a deployed demo with 5 real timetables",
    ],
  },
  {
    title: "PlacePrep",
    pitch:
      "A voice mock-interview coach for one role. Pick a job description, answer five questions out loud, and get a scored transcript, filler-word count and a stronger rewrite of your weakest answer.",
    why: "It targets the exact anxiety placement season creates and gives you a live link to show recruiters.",
    stack: ["Next.js", "Web Speech API", "Groq API", "Cloudflare Workers"],
    roadmap: [
      "Day 1: role picker, five-question flow, voice capture",
      "Day 2: transcript cleanup, scoring and answer rewrite",
      "Day 3: shareable scorecard and a real demo with three friends",
    ],
  },
  {
    title: "SplitSet",
    pitch:
      "Bill splitting for student flats: photograph a grocery bill, assign items to roommates, and send one UPI request per person. Rent and wifi repeat automatically every month.",
    why: "It has a clear money-saving loop, a real user group (your own flat) and an obvious reason to reopen it monthly.",
    stack: ["Next.js", "Next route handlers", "D1", "A UPI deep link"],
    roadmap: [
      "Day 1: create a flat, add roommates, manual bill entry",
      "Day 2: item assignment and one-tap UPI requests",
      "Day 3: recurring rent and a 5-flat pilot",
    ],
  },
  {
    title: "ClinicQ",
    pitch:
      "Walk-in queue tracking for neighbourhood clinics. Patients see a live token and estimated wait before leaving home; the receptionist gets a one-screen queue they can actually run.",
    why: "It is a real operational problem, and the two-sided demo shows product thinking rather than another CRUD app.",
    stack: ["Next.js", "D1", "5-second polling", "Cloudflare Workers"],
    roadmap: [
      "Day 1: queue and token flow for one clinic",
      "Day 2: wait-time estimate from recent consultation length",
      "Day 3: patient status page and a pilot with one local clinic",
    ],
  },
  {
    title: "MessMate",
    pitch:
      "A mess-demand forecast for hostel kitchens. Import two weeks of plate counts, add the exam calendar, and get tomorrow's expected headcount plus the waste number it saves.",
    why: "It pairs a simple model with a dashboard a hostel office would act on, which is a strong story in a data interview.",
    stack: ["Next.js", "D1", "A weighted-average forecast", "Cloudflare Workers"],
    roadmap: [
      "Day 1: plate-count import and historical chart",
      "Day 2: forecast model with exam/holiday flags",
      "Day 3: cook-facing headcount screen and a pilot week",
    ],
  },
  {
    title: "SecondServe",
    pitch:
      "A campus textbook and lab-kit exchange with a 60-second listing flow, a handoff spot map, and a search that actually understands course codes.",
    why: "It is local, trust-based and measurable: listings, completed handoffs and money saved are all demoable numbers.",
    stack: ["Next.js", "D1", "R2 for photos", "Cloudflare Workers"],
    roadmap: [
      "Day 1: listing flow plus course-code search",
      "Day 2: requests, chat-lite and handoff spots",
      "Day 3: seed 30 listings from your own batch and open it to one department",
    ],
  },
  {
    title: "RouteRebel",
    pitch:
      "Live college shuttle tracking with route ETAs, a driver view and a WhatsApp-group alert when the bus leaves the gate. Students stop guessing whether to wait or walk.",
    why: "It solves a daily, visible annoyance and gives you realtime features to talk about in interviews.",
    stack: ["Next.js", "Leaflet", "D1", "Cloudflare Workers"],
    roadmap: [
      "Day 1: one route, one bus, live map",
      "Day 2: ETA calculation and the departure alert",
      "Day 3: 40-student test and a before/after wait-time metric",
    ],
  },
  {
    title: "CarbonBlock",
    pitch:
      "A hostel-block energy scoreboard that turns monthly electricity readings into a per-person carbon number and a weekly block-vs-block challenge.",
    why: "Sustainability plus a leaderboard is a rare combination: it shows data literacy and behaviour design in one demo.",
    stack: ["Next.js", "D1", "Recharts", "Cloudflare Workers"],
    roadmap: [
      "Day 1: reading input and per-block score",
      "Day 2: weekly challenge and shareable result card",
      "Day 3: run it for one real hostel block for 24 hours",
    ],
  },
  {
    title: "StudyLoop",
    pitch:
      "Turn lecture notes or a PDF into a deck of spaced-repetition cards, with a daily five-minute review queue and a simple retention graph. The loop is notes in, cards out, recall tomorrow.",
    why: "It demonstrates retrieval, LLM output validation and a measurable learning result instead of a generic chatbot.",
    stack: ["Next.js", "Groq API", "D1", "Cloudflare Workers"],
    roadmap: [
      "Day 1: upload, chunk and generate validated cards",
      "Day 2: review scheduler and retention tracking",
      "Day 3: share one deck and test recall with 10 classmates",
    ],
  },
  {
    title: "LocalLoop",
    pitch:
      "Hyperlocal event tickets for campus and neighbourhood gigs: organiser page, UPI payment, one QR ticket and a door scanner that works offline.",
    why: "Payments, QR codes and an offline scanner give you three concrete technical stories from one small product.",
    stack: ["Next.js", "D1", "UPI deep link", "Cloudflare Workers"],
    roadmap: [
      "Day 1: event page and free RSVP with QR",
      "Day 2: paid ticket and door scanner",
      "Day 3: run it as the actual ticket for one campus event",
    ],
  },
  {
    title: "SchemeSetu",
    pitch:
      "A guided scheme finder for small farmers: five plain-language questions, a ranked list of state and central schemes, and a printable checklist of the documents needed for each.",
    why: "It shows you can turn messy public information into a usable decision tool, which is far more memorable than a clone.",
    stack: ["Next.js", "D1", "Groq API for plain-language summaries", "Cloudflare Workers"],
    roadmap: [
      "Day 1: 25 schemes structured and searchable",
      "Day 2: question flow and document checklist",
      "Day 3: test with five farming families and add a local-language toggle",
    ],
  },
  {
    title: "BugBoard",
    pitch:
      "A campus bug bounty board where student clubs post small issues, developers claim them, and reviewers approve a fix. Points and a public fix streak make it social.",
    why: "It builds evidence of real contributions, and the reviewer/claim flow shows you can design permissions and state.",
    stack: ["Next.js", "D1", "GitHub OAuth", "Cloudflare Workers"],
    roadmap: [
      "Day 1: post, claim and submit flows",
      "Day 2: reviewer approval, points and profiles",
      "Day 3: seed 20 real issues from campus clubs and get 5 fixes merged",
    ],
  },
  {
    title: "Attendance Autopsy",
    pitch:
      "A attendance calculator that tells you exactly how many classes you can miss before you hit the threshold, per subject, with a calendar that accounts for holidays and labs.",
    why: "It is a tiny, sharable utility with a clear viral loop; the kind of project that gets used the same day in a hostel.",
    stack: ["Next.js", "localStorage or D1", "An ICS export", "Cloudflare Workers"],
    roadmap: [
      "Day 1: subject setup and the can-I-skip calculator",
      "Day 2: holiday-aware calendar and ICS export",
      "Day 3: share card and a 100-student test",
    ],
  },
  {
    title: "OfferLens",
    pitch:
      "A company-specific placement question map: pick a target company, get its interview rounds, the topics most likely to appear, and a 10-day practice plan based on real student reports.",
    why: "It turns scattered placement gossip into a plan, and the structured data is the hard part you can show off.",
    stack: ["Next.js", "D1", "Groq API for summaries", "Cloudflare Workers"],
    roadmap: [
      "Day 1: 10 companies and their round templates",
      "Day 2: report ingestion and topic weighting",
      "Day 3: 10-day plan export and a pilot with juniors",
    ],
  },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Rough topic map so an offline response still answers the branch/interest the
// student actually picked. Keywords are matched both ways ("health" ~ "healthcare").
const IDEA_TAGS: Record<string, string[]> = {
  CampusPilot: ["campus life", "productivity", "time management", "students", "study"],
  PlacePrep: ["placement", "interview", "career", "jobs", "communication", "speaking"],
  SplitSet: ["money", "finance", "budget", "flatmates", "hostel", "bills"],
  ClinicQ: ["health", "healthcare", "clinic", "hospital", "queue", "waiting"],
  MessMate: ["food", "mess", "canteen", "hostel", "waste", "sustainability", "data"],
  SecondServe: ["books", "textbooks", "marketplace", "exchange", "reuse", "sustainability", "campus life"],
  RouteRebel: ["transport", "bus", "travel", "commute", "maps", "logistics", "campus life"],
  CarbonBlock: ["sustainability", "energy", "climate", "carbon", "environment", "electricity", "hostel"],
  StudyLoop: ["study", "learning", "notes", "exams", "revision", "education", "flashcards", "ai"],
  LocalLoop: ["events", "music", "tickets", "concert", "culture", "community", "payments"],
  SchemeSetu: ["agriculture", "farmers", "rural", "government", "schemes", "policy", "social impact"],
  BugBoard: ["coding", "programming", "developer", "software", "open source", "community"],
  "Attendance Autopsy": ["attendance", "classes", "campus life", "productivity", "students"],
  OfferLens: ["placement", "interview", "career", "jobs", "company", "preparation"],
};

export function fallbackIdea(branch: string, interest: string): Idea {
  const tokens = `${branch} ${interest}`
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length > 3);

  const scored = IDEAS.map((idea) => {
    const tags = IDEA_TAGS[idea.title] ?? [];
    const score = tags.reduce((sum, tag) => {
      const lower = tag.toLowerCase();
      return sum + (tokens.some((token) => lower.includes(token) || token.includes(lower)) ? 1 : 0);
    }, 0);
    return { idea, score };
  });

  const matched = scored.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  // Nothing on topic: stay in the student's world instead of returning a random app.
  const generic = scored.filter((entry) => (IDEA_TAGS[entry.idea.title] ?? []).includes("campus life"));
  const pool = matched.length
    ? matched.slice(0, 3).map((entry) => entry.idea)
    : generic.length
      ? generic.map((entry) => entry.idea)
      : IDEAS;

  const idea = pool[hash(`${branch}:${interest}`) % pool.length];
  return {
    ...idea,
    pitch: idea.pitch.replace(/\s+/g, " ").trim(),
  };
}

export function fallbackShare(input: {
  name: string;
  college: string;
  ideaTitle: string;
}): ShareMessages {
  const firstName = input.name.split(" ")[0] || "I";
  const title = input.ideaTitle || "my workshop project";
  return {
    casual: `${firstName} here. I'm building ${title} at ShipWeek this weekend — 3 days, free, and I leave with a deployed project instead of another certificate. Build yours next to me?`,
    placement: `Resume check: mine will have a live link. I'm shipping ${title} at ShipWeek, a free 3-day build sprint for final-year students. ${input.college} is already on the leaderboard.`,
    curiosity: `What if your resume said "here's the thing I built" instead of "passionate about technology"? I'm building ${title} at ShipWeek. Come build with me.`,
  };
}

export function fallbackKit(college: string, branchMix: string): CaptainKit {
  return {
    poster_caption: `${college} — 500 seats across colleges. ShipWeek is a free 3-day sprint where final-year students deploy one real project. DM me "SHIP" for a seat.`,
    whatsapp_pitch: `ShipWeek is open for ${college}.

3 days. One deployed project. Free.
Who it's for: final-year students who are done collecting tutorial certificates.
What you leave with: a live project link, an AI review, and a certificate with your project's name on it.

${branchMix} students are already in. Reply "SHIP" and I'll send your seat link. No spam, no scraping — just your own project.`,
    replies: [
      {
        doubt: "Is it actually free?",
        reply:
          "Yes. The 3 days are free. You need a laptop and about 3 hours a day. The referral rewards are optional and only for verified signups.",
      },
      {
        doubt: "I'm not from CSE. Can I build anything?",
        reply: `Yes. The projects are software-first, but the problems are open: mess waste, bus timings, clinic queues, attendance. ${branchMix} is already represented.`,
      },
      {
        doubt: "I don't have an idea.",
        reply:
          "That's step one on the site. Answer two questions and it generates a buildable idea with a 3-day roadmap, before you sign up.",
      },
      {
        doubt: "Is the certificate just for attendance?",
        reply:
          "No. Your certificate carries your project's name and your live link. The AI evaluator scores the project and tells you the one thing to fix next.",
      },
    ],
  };
}

export function fallbackCopilot(metrics: {
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
}): CopilotMove {
  const ideaToSignup = metrics.ideas ? Math.round((metrics.signups / metrics.ideas) * 100) : 0;
  const shareRate = metrics.signups ? Math.round((metrics.shares / metrics.signups) * 100) : 0;
  const pace = metrics.targetToday
    ? Math.round((metrics.todayCount / metrics.targetToday) * 100)
    : 0;

  if (metrics.unverified >= 5) {
    return {
      text: `Send a verification nudge to the ${metrics.unverified} unverified signups before you ask anyone for another referral.`,
      reason: `${metrics.unverified} of ${metrics.total} signups are not verified, so they do not count toward the leaderboard or rewards. Cleaning the queue is the cheapest way to move the verified number today.`,
    };
  }
  if (pace < 60) {
    return {
      text: `Message the six captains closest to their target with their current rank and one ready-to-send WhatsApp message.`,
      reason: `You added ${metrics.todayCount} signups today against a ${metrics.targetToday} target (${pace}% of pace). Captain-led messages verify better than cold posts, and the rank gives each captain a reason to reply now.`,
    };
  }
  if (metrics.ideas > 0 && ideaToSignup < 40) {
    return {
      text: `Move the seat form directly under the generated idea and keep the idea visible through both signup steps.`,
      reason: `Only ${ideaToSignup}% of generated ideas become signups (${metrics.signups} of ${metrics.ideas}). The drop is between the idea and the form, not at the top of the funnel.`,
    };
  }
  if (shareRate < 10) {
    return {
      text: `Ask every verified registrant for one share, with their college's current rank attached to the ask.`,
      reason: `There have been ${metrics.shares} share clicks for ${metrics.signups} signups (${shareRate}%). The referral loop is underused, and college rank is a stronger reason to share than a generic reward.`,
    };
  }
  if (metrics.bestSource) {
    return {
      text: `Put the next ₹500 behind ${metrics.bestSource} and send that channel's best-performing message again.`,
      reason: `${metrics.bestSource} has the strongest verified conversion in the current data, and ${
        metrics.bestCollege ?? "the leading college"
      } is carrying the college board. Repeat the channel that already works before adding a new one.`,
    };
  }
  return {
    text: `Reveal the college leaderboard and message each captain their rank before the next class slot.`,
    reason: `With ${metrics.verified} verified signups and ${metrics.daysLeft} days left, visible rank is the lowest-cost way to create a second push without spending on ads.`,
  };
}

export function fallbackEvaluation(input: {
  title: string;
  url: string;
  description: string;
  name: string;
}): Evaluation {
  const description = input.description || "";
  const words = description.trim().split(/\s+/).filter(Boolean).length;
  const isRepo = /github\.com|gitlab\.com|bitbucket\.org/i.test(input.url);
  const mentionsUsers = /\b(user|users|students|deployed|live|pilot|tested|waitlist|people)\b/i.test(
    description,
  );
  const mentionsStack = /\b(next|react|node|python|postgres|supabase|firebase|fastapi|api|llm|ai)\b/i.test(
    description,
  );

  let score = 54;
  if (/^https?:\/\//.test(input.url)) score += 10;
  if (isRepo) score -= 8;
  if (words >= 60) score += 7;
  if (words >= 140) score += 5;
  if (mentionsUsers) score += 9;
  if (mentionsStack) score += 5;
  score = Math.max(52, Math.min(94, score));

  const strengths = [
    isRepo
      ? "You shipped a real codebase rather than a slide deck."
      : "You have a working deployment, not just a local demo.",
    mentionsUsers
      ? "The description shows evidence of real users or a real pilot."
      : "The project has a clear, specific problem it is solving.",
    mentionsStack
      ? "You can explain the stack, which makes the project easier to defend in an interview."
      : "The scope is small enough to finish and demo confidently.",
  ];

  return {
    score,
    strengths,
    next_step: isRepo
      ? "Deploy the project and put the live URL at the top of the submission; a repo alone is not a shipped product."
      : "Record a 30-second screen demo and add one real user quote to the project page before the showcase.",
    certificate_text: `Built ${input.title}, shipped it during ShipWeek, and earned a project score of ${score}/100.`,
  };
}

export { IDEAS };
