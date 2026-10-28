export const workshop = {
  name: "ShipWeek",
  edition: "ShipWeek '26",
  tagline: "Build your first AI project in 60 minutes.",
  seats: 500,
  minutes: 60,
  dates: "Sat, 7 Nov 2026 · 11:00 AM IST",
  registrationCloses: "Nov 6, 11:59 PM IST",
  campaignStartsAt: "2026-10-28T18:29:00.000Z",
  campaignEndsAt: "2026-11-04T18:29:00.000Z",
  rewardPerWinner: 200,
  rewardWinners: 5,
  targetPerDay: [60, 200, 200, 300, 400, 470, 500],
  demoPasscode: "ship2026",
};

/**
 * The session itself. This is the product: four timed blocks, every minute
 * hands-on. The certificate prints the same four modules the student completed.
 */
export const agenda = [
  {
    window: "00–15 min",
    short: "AI APIs",
    title: "Foundation & AI APIs",
    body: "Understanding LLM architectures, API keys, and environment setup without local headaches.",
  },
  {
    window: "15–35 min",
    short: "Hands-on build",
    title: "Hands-on Code Build",
    body: "Writing core application logic, system prompts, and handling asynchronous AI streams.",
  },
  {
    window: "35–50 min",
    short: "UI & deploy",
    title: "UI & Deployment",
    body: "Attaching an interactive web interface and generating a live shareable URL for recruiters.",
  },
  {
    window: "50–60 min",
    short: "Placement",
    title: "Placement Strategy",
    body: "How to showcase this project on LinkedIn/Resume and answers to top technical interview questions.",
  },
] as const;

export const branches = [
  "CSE",
  "IT",
  "AI & ML",
  "Data Science",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "Chemical",
  "Biotech",
  "BBA / Management",
  "Other",
] as const;

export const interests = [
  "AI & automation",
  "Placements & careers",
  "Campus life",
  "Fintech",
  "Health",
  "Sustainability",
  "Dev tools",
  "Local commerce",
] as const;

export const years = ["2nd year", "3rd year", "Final year"] as const;

export const sources = [
  { id: "captain", label: "Campus captain" },
  { id: "referral", label: "Referred by a friend" },
  { id: "club", label: "Club / T&P cell" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reddit", label: "Reddit" },
  { id: "whatsapp", label: "WhatsApp group" },
  { id: "direct", label: "Direct / other" },
] as const;
