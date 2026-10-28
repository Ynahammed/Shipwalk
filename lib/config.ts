export const workshop = {
  name: "ShipWeek",
  edition: "ShipWeek '26",
  tagline: "Leave with a deployed project, not another tutorial.",
  seats: 500,
  days: 3,
  dates: "Nov 6–8, 2026",
  registrationCloses: "Nov 4, 11:59 PM IST",
  campaignStartsAt: "2026-10-28T18:29:00.000Z",
  campaignEndsAt: "2026-11-04T18:29:00.000Z",
  rewardPerWinner: 200,
  rewardWinners: 5,
  targetPerDay: [60, 200, 200, 300, 400, 470, 500],
  demoPasscode: "ship2026",
};

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
