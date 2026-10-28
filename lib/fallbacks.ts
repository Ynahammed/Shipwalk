import type { CaptainKit, CopilotMove, Evaluation, Idea, ShareMessages } from "./types";

/**
 * Curated fallbacks for the five AI components.
 *
 * These are the ideas a student sees when the model is unavailable, so they have
 * to be honest about the session: one screen, one prompt, one hosted model call,
 * deployable inside the hour. Every roadmap is the session's four timed blocks.
 */

const IDEAS: Idea[] = [
  {
    title: "DeadlineDecoder",
    pitch:
      "Paste a syllabus PDF, a professor's email or a wall of WhatsApp messages and get back one table: what is due, when, and which item to start tonight. One paste, one structured result.",
    why:
      "The hard part is forcing messy text into a strict JSON schema without inventing dates — exactly the prompt-and-validation question interviewers ask about.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: API key in place, one server route returns a raw completion",
      "15–35: system prompt with a JSON schema, parse and validate the dates",
      "35–50: one screen renders the deadline table, empty and error states included",
      "50–60: deploy it, then write the LinkedIn line and the interview answer",
    ],
  },
  {
    title: "NoteFlash",
    pitch:
      "Paste lecture notes and get ten flashcards plus three exam-style questions, each with the answer hidden behind a tap. One screen, one model call, immediately useful before a test.",
    why:
      "It demonstrates prompt design with a strict output contract and a client-side reveal loop, which is a clean story for a frontend or AI product interview.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first request returning raw text for one paragraph",
      "15–35: prompt that returns valid card JSON, with a length cap per card",
      "35–50: card UI with reveal answers, loading and error states",
      "50–60: deploy, then rehearse the two-line explanation of your prompt",
    ],
  },
  {
    title: "MessMenuAI",
    pitch:
      "Paste the hostel mess menu for the week and get a shopping list grouped by vendor, with items that repeat across days called out. Built for the secretary who currently retypes it into four different chats.",
    why:
      "Extraction plus grouping under a fixed schema is the useful part, and it gives you a concrete answer to \"how did you stop the model from inventing items?\"",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key, route, first completion on a sample menu",
      "15–35: prompt that returns vendor-grouped JSON and rejects unknown items",
      "35–50: three summary cards and a copy-to-clipboard list, then deploy",
      "50–60: LinkedIn caption and the interview answer on hallucination control",
    ],
  },
  {
    title: "ReplyCoach",
    pitch:
      "Paste a message you are nervous about replying to — a recruiter, a professor, a landlord — and get three replies at different levels of formality, plus one line on what the sender actually wants.",
    why:
      "Tone control is the prompt-engineering core, and explaining how you kept the three options distinct is a strong answer to a system-design or product question.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + one raw rewrite of a sample message",
      "15–35: system prompt that fixes three tones and returns strict JSON",
      "35–50: three tabs, copy buttons, a length guard, then deploy",
      "50–60: add the resume line and the answer on prompt drift",
    ],
  },
  {
    title: "InterviewDrill",
    pitch:
      "Paste a job description and get the five questions that role will actually ask, a model answer for each, and the one keyword your current answer is missing. Built in the placement block of the session.",
    why:
      "It turns a document into a practice loop, and the interesting engineering is grounding the questions in the pasted text instead of generic interview advice.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first request that extracts the role's keywords",
      "15–35: prompt for five grounded questions with answers, strict JSON",
      "35–50: question cards with a reveal toggle, then deploy the URL",
      "50–60: use the app on your own target role and rehearse the answer",
    ],
  },
  {
    title: "SpendTeller",
    pitch:
      "Paste a month of bank SMS alerts and get a categorised spending summary with the one category to cut. No bank login, no CSV upload — just the messages already on the phone.",
    why:
      "Parsing unstructured messages into typed rows and then summarising them is a data-shape problem you can explain in any backend interview.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + a first parse of ten sample messages",
      "15–35: category schema, totals computed in code (not by the model)",
      "35–50: summary cards and a bar list, then deploy",
      "50–60: write the \"why the model never does arithmetic\" interview answer",
    ],
  },
  {
    title: "ErrorPlain",
    pitch:
      "Paste a stack trace and get the likely cause in plain English, three ranked fixes, and the one line of the trace that matters. A debug companion that works when you cannot read the error at 2am.",
    why:
      "Explaining code with a grounded, quoted answer is the interesting constraint, and it prepares you for a debugging or code-review interview.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first explanation of a real error you have hit",
      "15–35: prompt that must quote the failing frame and return JSON",
      "35–50: three fix cards, copy button, deploy to a live URL",
      "50–60: LinkedIn line and the answer on constraining model output",
    ],
  },
  {
    title: "ClinicPlain",
    pitch:
      "Paste a discharge note or prescription instructions and get a plain-language version at two reading levels, plus the three questions to ask the doctor next visit.",
    why:
      "It shows you can make a model useful without medical advice, and the safety framing — what the prompt refuses to say — is a mature interview answer.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first rewrite of a sample note",
      "15–35: two-level prompt with an explicit no-diagnosis rule",
      "35–50: side-by-side reading levels, copy button, then deploy",
      "50–60: write the safety paragraph you will say out loud in the interview",
    ],
  },
  {
    title: "ComplaintDrafter",
    pitch:
      "Paste what went wrong — a refund, a broken hostel appliance, a late delivery — and get a firm, polite email plus the escalation path if nobody replies.",
    why:
      "It is a real writing task with tone and structure constraints, and the before/after is instantly demoable to a recruiter.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + one raw draft from a sample complaint",
      "15–35: prompt for subject, body, escalation, strict JSON",
      "35–50: editable output, copy button, deploy",
      "50–60: rehearse how you tested the tone across three complaints",
    ],
  },
  {
    title: "CropWeek",
    pitch:
      "Paste a soil-card reading and this week's weather note and get plain-language actions for the next seven days, ranked by urgency, in the farmer's own words.",
    why:
      "Grounding advice in pasted inputs rather than generic tips is the hard part, and it is a strong answer for an agri-tech or social-impact interview.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first summary of a sample soil card",
      "15–35: prompt that must cite the pasted values and refuse to guess",
      "35–50: action cards with urgency tags, then deploy",
      "50–60: write the grounding explanation and one resume bullet",
    ],
  },
  {
    title: "TimetableTeller",
    pitch:
      "Paste a class timetable screenshot text and get a plain-language week: free study windows, back-to-back days, and the best two hours to revise for a Friday test.",
    why:
      "Turning a grid into a recommendation is a neat reasoning demo, and you can explain exactly where the model ends and your own logic begins.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first parse of a pasted timetable",
      "15–35: prompt for structured slots, then compute the free windows in code",
      "35–50: week view and a study-window card, then deploy",
      "50–60: interview answer on splitting model work from deterministic logic",
    ],
  },
  {
    title: "PitchPolish",
    pitch:
      "Paste your project paragraph and get a recruiter-ready version, the three interview questions it invites, and the one claim you cannot defend yet.",
    why:
      "Editing with constraints — no invented metrics, no buzzwords — is a genuinely useful prompt problem and doubles as placement prep for the session itself.",
    stack: ["Next.js", "Groq API (hosted LLM)", "Cloudflare Workers"],
    roadmap: [
      "00–15: key + first rewrite of your own submission paragraph",
      "15–35: prompt that forbids invented claims and returns JSON",
      "35–50: before/after view, copy button, deploy",
      "50–60: use the output as your LinkedIn post and certificate blurb",
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
  DeadlineDecoder: ["campus life", "study", "productivity", "time management", "students", "exams"],
  NoteFlash: ["study", "learning", "notes", "revision", "exams", "education", "flashcards", "ai"],
  MessMenuAI: ["food", "mess", "canteen", "hostel", "waste", "sustainability", "data"],
  ReplyCoach: ["placement", "career", "communication", "jobs", "interview", "writing"],
  InterviewDrill: ["placement", "interview", "career", "jobs", "company", "preparation"],
  SpendTeller: ["money", "finance", "budget", "hostel", "bills", "students"],
  ErrorPlain: ["coding", "programming", "developer", "software", "debugging", "dev tools"],
  ClinicPlain: ["health", "healthcare", "clinic", "hospital", "accessibility", "communication"],
  ComplaintDrafter: ["campus life", "consumer", "communication", "writing", "students"],
  CropWeek: ["agriculture", "farmers", "rural", "sustainability", "social impact", "climate"],
  TimetableTeller: ["campus life", "study", "productivity", "students", "time management"],
  PitchPolish: ["placement", "career", "resume", "interview", "communication", "ai"],
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
  const title = input.ideaTitle || "my first AI project";
  return {
    casual: `${firstName} here. I'm building ${title} at ShipWeek on Saturday — one free hour, no AI experience needed, and I leave with a live link instead of another certificate for watching a video. Join me?`,
    placement: `Resume line incoming: I'll have a live AI project by Saturday afternoon. ShipWeek is a free 60-minute build session for beginners — you call a real model API and deploy it. ${input.college} is already on the leaderboard.`,
    curiosity: `What if your resume said "here is the AI thing I built and deployed" instead of "passionate about technology"? I'm building ${title} at ShipWeek in one hour. Come build yours next to me.`,
  };
}

export function fallbackKit(college: string, branchMix: string): CaptainKit {
  return {
    poster_caption: `${college} — 500 seats across colleges. ShipWeek is a free 60-minute AI build: no experience needed, and you leave with a deployed project. DM me "BUILD" for a seat.`,
    whatsapp_pitch: `ShipWeek is open for ${college}.

60 minutes. One AI project. Free.
Who it's for: students who have never called an AI API and want a project they can actually show.
What happens: 0–15 LLM basics and API setup, 15–35 hands-on build, 35–50 UI and deploy, 50–60 how to present it.
What you leave with: a live link, an AI review, and a certificate that names what you built.

${branchMix} students are already in. Reply "BUILD" and I'll send your seat link. No spam, no scraping — just your own project.`,
    replies: [
      {
        doubt: "Is it actually free?",
        reply:
          "Yes. The hour is free, including the hosted model call. You need a laptop and a browser; no card, no paid API plan.",
      },
      {
        doubt: "I've never used AI APIs. Will I keep up?",
        reply: `That is the point. The first fifteen minutes are setup and the basics, and everyone builds the same small shape. ${branchMix} students are already in, most with no AI background.`,
      },
      {
        doubt: "I don't have an idea.",
        reply:
          "That's step one on the site. Answer two questions and it gives you a beginner-sized AI project with a 60-minute build plan, before you sign up.",
      },
      {
        doubt: "Is the certificate just for attendance?",
        reply:
          "No. It carries your project's name, your live link, the four modules you completed and the organiser's score. The AI review is only a baseline.",
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
  linkCheck?: string;
}): Evaluation {
  const description = input.description.replace(/\s+/g, " ").trim();
  const words = description.split(" ").filter((word) => word.length > 1).length;
  const isRepo = /github\.com|gitlab\.com|bitbucket\.org/i.test(input.url);
  const mentionsUsers = /\b(user|users|students|deployed|live|pilot|tested|waitlist|people)\b/i.test(
    description,
  );
  const mentionsStack = /\b(next|react|node|python|postgres|supabase|firebase|fastapi|api|llm|ai|prompt|groq|openai)\b/i.test(
    description,
  );

  // The reviewer never opens the link, so the text has to carry the evidence:
  // several sentences and at least one concrete detail, not generic praise.
  const sentences = description.split(/[.!?]+/).filter((part) => part.trim().length > 15).length;
  const concrete =
    /\b(map|search|queue|score|button|form|list|upload|notify|alert|chart|calendar|login|api|database|d1|next\.js|workers|track|dashboard|filter|export|match|rank|schedule|slot|vote|claim|request|photo|payment|ticket|prompt|model|summary|card|rewrite)\b/i.test(
      description,
    ) || /\d/.test(description);
  const reviewable = sentences >= 2 && words >= 30 && concrete;

  if (!reviewable) {
    return {
      score: Math.min(24, 4 + Math.min(words, 20)),
      strengths: [
        "A submission was received, but it does not describe what the project does.",
        "There is no stated input, prompt or result for a reviewer to judge.",
      ],
      next_step:
        "Rewrite the description: what the user pastes in, what the prompt asks the model for, and what the screen shows back.",
      certificate_text: `${input.title} was submitted without enough detail to review.`,
    };
  }

  const linkFailed = Boolean(input.linkCheck?.startsWith("unreachable") || input.linkCheck?.startsWith("blocked"));

  let score = 34;
  if (isRepo) score += 4;
  if (words >= 60) score += 10;
  if (words >= 140) score += 6;
  if (mentionsUsers) score += 10;
  if (mentionsStack) score += 5;
  score = Math.max(30, Math.min(78, score));
  if (linkFailed) score = Math.min(35, score - 12);

  const strengths = [
    isRepo
      ? "The codebase is linked, so a reviewer can read the prompt and the request."
      : "The project has a URL a reviewer can open in their own browser.",
    mentionsUsers
      ? "The description names real users or a real pilot."
      : "The description explains what the model turns the input into.",
    mentionsStack
      ? "The description names the stack and the model call, which makes the project easier to defend in an interview."
      : "The scope is small enough to finish and demo inside the hour.",
  ];
  if (linkFailed) {
    strengths.push("The submitted link did not answer, so the project could not be opened by a reviewer.");
  }

  return {
    score,
    strengths,
    next_step: isRepo
      ? "Deploy the project and put the live URL at the top of the submission; a repo alone is not a shipped project."
      : "Add the before/after of your prompt — the first answer and the one you shipped — so the reviewer can see the iteration.",
    certificate_text: `Built ${input.title} as a first AI project in ShipWeek's 60-minute build; project score ${score}/100.`,
  };
}

export { IDEAS };
