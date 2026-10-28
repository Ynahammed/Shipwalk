import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SCHEMA_STATEMENTS, VIEW_STATEMENTS } from "./schema";
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

  if (env.DEMO_DATA === "1") {
    await seedDemo(env.DB);
  }
  return env.DB;
}

export async function getDb(): Promise<D1Database> {
  ready ??= init();
  return ready;
}
