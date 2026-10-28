declare global {
  interface CloudflareEnv {
    DB: D1Database;
    GROQ_API_KEY?: string;
    AI_MODEL?: string;
    SMTP2GO_API_KEY?: string;
    SMTP2GO_SENDER?: string;
    ADMIN_PASSCODE?: string;
    DEMO_DATA?: string;
  }
}

export {};
