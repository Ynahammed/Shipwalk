export type Registrant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  college_id: number;
  college: string;
  year: string;
  branch: string;
  interest: string | null;
  ref_code: string;
  referred_by: string | null;
  source: string;
  verified: number;
  confirmation_method: "pending" | "email" | "self" | "admin" | "demo" | "legacy";
  email_sent: number;
  verify_token: string | null;
  idea_json: string | null;
  checked_in: number;
  is_demo: number;
  demo_kind?: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  id: number;
  name: string;
  ref_code: string;
  branch: string;
  is_demo: number;
  created_at: string;
  confirmation_method: string;
  college: string;
  referrals: number;
};

export type CollegeRow = {
  id: number;
  name: string;
  city: string;
  total: number;
  verified: number;
  self_confirmed: number;
  demo: number;
};

export type Idea = {
  title: string;
  pitch: string;
  why: string;
  stack: string[];
  roadmap: string[];
};

export type ShareMessages = {
  casual: string;
  placement: string;
  curiosity: string;
};

export type CaptainKit = {
  poster_caption: string;
  whatsapp_pitch: string;
  replies: { doubt: string; reply: string }[];
};

export type CopilotMove = {
  text: string;
  reason: string;
};

export type Evaluation = {
  score: number;
  strengths: string[];
  next_step: string;
  certificate_text: string;
};

export type SubmissionRow = {
  id: number;
  registrant_id: number;
  project_title: string;
  project_url: string;
  description: string | null;
  score: number | null;
  feedback_json: string | null;
  certificate_id: string | null;
  final_score: number | null;
  review_status: "pending" | "approved";
  reviewed_at: string | null;
  url_status: string | null;
  url_checked_at: string | null;
  is_demo: number;
  demo_kind?: string | null;
  created_at: string;
  name?: string;
  ref_code?: string;
  college?: string;
  checked_in?: number;
};

export type PacePoint = {
  label: string;
  date: string;
  count: number;
  cumulative: number;
  target: number;
};

export type DataModeName = "live" | "simulation";

export type PublicStats = {
  total: number;
  verified: number;
  selfConfirmed: number;
  demo: number;
  seats: number;
  colleges: number;
  mode: DataModeName;
};

export type AdminOverview = {
  mode: DataModeName;
  simulation: {
    students: number;
    submissions: number;
    certificates: number;
  };
  totals: {
    total: number;
    verified: number;
    emailConfirmed: number;
    selfConfirmed: number;
    adminConfirmed: number;
    legacyConfirmed: number;
    live: number;
    unverified: number;
    demo: number;
    checkedIn: number;
    liveSubmissions: number;
    demoSubmissions: number;
    colleges: number;
    captains: number;
  };
  funnel: {
    visits: number;
    ideas: number;
    signupStarts: number;
    signups: number;
    shares: number;
    demoVisits: number;
    liveVisits: number;
  };
  pace: PacePoint[];
  campaignStatus: "prelaunch" | "active" | "closed";
  campaignDay: number;
  seatsTarget: number;
  sources: { source: string; total: number; verified: number }[];
  colleges: CollegeRow[];
  topReferrers: LeaderboardRow[];
  unverifiedList: (Registrant & { college: string })[];
  submissions: SubmissionRow[];
  flags: {
    kind: "ip" | "device";
    value: string;
    count: number;
    firstAt: string;
    lastAt: string;
  }[];
  copilot: {
    text: string;
    reason: string;
    source: string;
    createdAt: string;
  } | null;
  promptLogs: {
    id: number;
    component: string;
    source: string;
    model: string | null;
    duration_ms: number | null;
    created_at: string;
  }[];
  demoFunnel: number;
  errors: {
    id: number;
    message: string;
    path: string | null;
    digest: string | null;
    created_at: string;
  }[];
  security: {
    weakPasscode: boolean;
    recentFailures: number;
  };
};
