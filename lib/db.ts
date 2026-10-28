import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SCHEMA_STATEMENTS, VIEW_STATEMENTS } from "./schema";
import { isLoopbackHost } from "./host";
import { seedDemo } from "./seed";

let ready: Promise<D1Database> | null = null;

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });

  // Next loads `.env` into process.env locally, while Cloudflare supplies
  // secrets on the deployed Worker. Merge both so the same code works in each.
  const local = (typeof process === "undefined" ? {} : process.env) as Record<
    string,
    string | undefined
  >;
  return {
    ...env,
    GROQ_API_KEY: env.GROQ_API_KEY || local.GROQ_API_KEY,
    AI_MODEL: env.AI_MODEL || local.AI_MODEL,
    SMTP2GO_API_KEY: env.SMTP2GO_API_KEY || local.SMTP2GO_API_KEY,
    SMTP2GO_SENDER: env.SMTP2GO_SENDER || local.SMTP2GO_SENDER,
    ADMIN_PASSCODE: env.ADMIN_PASSCODE || local.ADMIN_PASSCODE,
    DEMO_DATA: env.DEMO_DATA || local.DEMO_DATA,
  };
}

export async function purgeDemoRows(db: D1Database): Promise<number> {
  const existing = await db
    .prepare("SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 1")
    .first<{ n: number }>();
  if ((existing?.n ?? 0) === 0) return 0;

  const results = await db.batch([
    db.prepare("DELETE FROM submissions WHERE is_demo = 1"),
    db.prepare(
      "DELETE FROM captains WHERE registrant_id IN (SELECT id FROM registrants WHERE is_demo = 1)",
    ),
    db.prepare("DELETE FROM events WHERE is_demo = 1"),
    db.prepare("DELETE FROM registrants WHERE is_demo = 1"),
    db.prepare("DELETE FROM demo_funnel"),
    db.prepare("DELETE FROM colleges WHERE id NOT IN (SELECT DISTINCT college_id FROM registrants)"),
  ]);
  return results.reduce((sum, result) => sum + (result.meta.changes ?? 0), 0);
}

async function init(): Promise<D1Database> {
  const env = await getEnv();
  if (!env.DB) {
    throw new Error("The DB binding is missing. Check freebuff.wrangler.jsonc.");
  }
  await env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql)));

  // Add provenance for existing confirmations without guessing that old rows
  // proved email ownership. Demo rows are synthetic; older live rows are legacy.
  const registrantColumns = await env.DB
    .prepare("PRAGMA table_info(registrants)")
    .all<{ name: string }>();
  if (!(registrantColumns.results ?? []).some((column) => column.name === "confirmation_method")) {
    await env.DB.exec(
      "ALTER TABLE registrants ADD COLUMN confirmation_method TEXT NOT NULL DEFAULT 'legacy'",
    );
    await env.DB
      .prepare(
        `UPDATE registrants SET confirmation_method = CASE
           WHEN is_demo = 1 THEN 'demo'
           WHEN verified = 1 THEN 'legacy'
           ELSE 'pending'
         END`,
      )
      .run();
  }
  if (!(registrantColumns.results ?? []).some((column) => column.name === "email_sent")) {
    await env.DB.exec("ALTER TABLE registrants ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0");
  }

  await env.DB.batch(VIEW_STATEMENTS.map((sql) => env.DB.prepare(sql)));

  // Seeding is a local preview convenience. The loopback check matters because
  // `next build` bakes the local `.env` into the deployed worker, so DEMO_DATA
  // can read as "1" on a public host.
  const local = await isLoopbackHost();
  if (local) {
    if (env.DEMO_DATA === "1") await seedDemo(env.DB);
  } else {
    // Demo rows cannot be created off-localhost any more, so any that remain
    // are leftovers from an older build. Clear them once instead of leaving a
    // public database holding synthetic students.
    await purgeDemoRows(env.DB);
  }
  return env.DB;
}

export async function getDb(): Promise<D1Database> {
  ready ??= init();
  return ready;
}
