/**
 * D1 (SQLite) schema. Every statement is idempotent so a cold start can
 * ensure the shape before serving a request.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS registrants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_id INTEGER NOT NULL,
    year TEXT NOT NULL,
    branch TEXT NOT NULL,
    interest TEXT,
    ref_code TEXT NOT NULL UNIQUE,
    referred_by TEXT,
    source TEXT NOT NULL DEFAULT 'direct',
    verified INTEGER NOT NULL DEFAULT 0,
    confirmation_method TEXT NOT NULL DEFAULT 'pending',
    email_sent INTEGER NOT NULL DEFAULT 0,
    verify_token TEXT UNIQUE,
    ip_hash TEXT,
    device_id TEXT,
    idea_json TEXT,
    checked_in INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_registrants_email ON registrants (email)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_registrants_phone ON registrants (phone)`,
  `CREATE INDEX IF NOT EXISTS idx_registrants_referred_by ON registrants (referred_by)`,
  `CREATE INDEX IF NOT EXISTS idx_registrants_created ON registrants (created_at)`,

  `CREATE TABLE IF NOT EXISTS captains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registrant_id INTEGER NOT NULL UNIQUE,
    target INTEGER NOT NULL DEFAULT 20,
    rewards_eligible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (registrant_id) REFERENCES registrants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    ref_code TEXT,
    path TEXT,
    session_id TEXT,
    device_id TEXT,
    ip_hash TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_type_created ON events (type, created_at)`,

  `CREATE TABLE IF NOT EXISTS project_ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch TEXT NOT NULL,
    interest TEXT,
    idea_json TEXT NOT NULL,
    source TEXT NOT NULL,
    registrant_id INTEGER,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registrant_id INTEGER NOT NULL UNIQUE,
    project_title TEXT NOT NULL,
    project_url TEXT NOT NULL,
    description TEXT,
    score INTEGER,
    feedback_json TEXT,
    certificate_id TEXT UNIQUE,
    final_score INTEGER,
    review_status TEXT NOT NULL DEFAULT 'pending',
    reviewed_at TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (registrant_id) REFERENCES registrants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    text TEXT NOT NULL,
    reason TEXT NOT NULL,
    metrics_json TEXT,
    source TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS prompt_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    source TEXT NOT NULL,
    model TEXT,
    duration_ms INTEGER,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS demo_funnel (
    day TEXT PRIMARY KEY,
    visits INTEGER NOT NULL,
    ideas INTEGER NOT NULL,
    signup_starts INTEGER NOT NULL,
    share_clicks INTEGER NOT NULL
  )`,
];

export const VIEW_STATEMENTS: string[] = [
  `DROP VIEW IF EXISTS leaderboard`,
  `CREATE VIEW leaderboard AS
    SELECT
      r.id, r.name, r.ref_code, r.branch, r.is_demo, r.created_at,
      r.confirmation_method,
      c.name AS college,
      (SELECT COUNT(*) FROM registrants x
        WHERE x.referred_by = r.ref_code AND x.verified = 1
          AND x.confirmation_method = 'email' AND x.is_demo = 0) AS referrals
    FROM registrants r
    JOIN colleges c ON c.id = r.college_id
    WHERE r.verified = 1 AND r.confirmation_method = 'email' AND r.is_demo = 0`,
  `DROP VIEW IF EXISTS college_rank`,
  `CREATE VIEW college_rank AS
    SELECT
      c.id, c.name, c.city,
      COUNT(CASE WHEN r.is_demo = 0 THEN 1 END) AS total,
      COALESCE(SUM(CASE WHEN r.verified = 1 AND r.is_demo = 0 AND r.confirmation_method = 'email' THEN 1 ELSE 0 END), 0) AS verified,
      COALESCE(SUM(CASE WHEN r.verified = 1 AND r.is_demo = 0 AND r.confirmation_method = 'self' THEN 1 ELSE 0 END), 0) AS self_confirmed,
      COALESCE(SUM(CASE WHEN r.is_demo = 1 THEN 1 ELSE 0 END), 0) AS demo
    FROM colleges c
    LEFT JOIN registrants r ON r.college_id = c.id
    GROUP BY c.id, c.name, c.city
    HAVING COUNT(CASE WHEN r.is_demo = 0 THEN 1 END) > 0`,
  `DROP VIEW IF EXISTS pace`,
  `CREATE VIEW pace AS
    SELECT date(created_at, '+5 hours', '+30 minutes') AS day, COUNT(*) AS registrations
    FROM registrants
    WHERE is_demo = 0
    GROUP BY date(created_at, '+5 hours', '+30 minutes')`,
];
