import { cookies } from "next/headers";
import { workshop } from "./config";
import { getDb, getEnv } from "./db";
import { isLoopbackHost } from "./host";
import { hashValue, clientIp } from "./utils";

export const ADMIN_COOKIE = "sw_admin";
export const ADMIN_MAX_FAILURES = 5;
export const ADMIN_WINDOW_MS = 15 * 60 * 1000;
export const MIN_PASSCODE_LENGTH = 12;

/** Deployed workers need a real secret; loopback keeps the local preview usable. */
export async function isAdminConfigured(): Promise<boolean> {
  const env = await getEnv();
  if (env.ADMIN_PASSCODE?.trim()) return true;
  return isLoopbackHost();
}

export async function adminPasscode(): Promise<string> {
  const env = await getEnv();
  return env.ADMIN_PASSCODE?.trim() || workshop.demoPasscode;
}

/**
 * Every admin cookie is tied to a monotonically increasing epoch. Bumping the
 * epoch (the "sign out everywhere" action) invalidates every issued session
 * without needing to know or rotate the passphrase itself.
 */
async function sessionEpoch(): Promise<string> {
  try {
    const db = await getDb();
    const row = await db
      .prepare("SELECT value FROM app_settings WHERE key = 'admin_epoch'")
      .first<{ value: string }>();
    return row?.value ?? "1";
  } catch {
    return "1";
  }
}

export async function adminToken(): Promise<string> {
  return hashValue(`admin:${await adminPasscode()}:${await sessionEpoch()}`);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === (await adminToken());
}

export async function revokeAdminSessions(): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES ('admin_epoch', '2')
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)`,
    )
    .run();
}

export function passcodeIsWeak(passcode: string): boolean {
  return passcode.trim().length < MIN_PASSCODE_LENGTH;
}

/** Failed attempts from this IP inside the window, oldest first. */
export async function adminFailures(ipHash: string): Promise<{ count: number; retryAfterSec: number }> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - ADMIN_WINDOW_MS).toISOString();
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS n, MIN(created_at) AS first_at FROM admin_attempts WHERE ip_hash = ? AND created_at >= ?",
    )
    .bind(ipHash, cutoff)
    .first<{ n: number; first_at: string | null }>();
  const count = row?.n ?? 0;
  if (count < ADMIN_MAX_FAILURES || !row?.first_at) {
    return { count, retryAfterSec: 0 };
  }
  const unlocksAt = new Date(row.first_at).getTime() + ADMIN_WINDOW_MS;
  return { count, retryAfterSec: Math.max(1, Math.ceil((unlocksAt - Date.now()) / 1000)) };
}

export async function recordAdminFailure(ipHash: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("DELETE FROM admin_attempts WHERE created_at < ?")
    .bind(new Date(Date.now() - ADMIN_WINDOW_MS).toISOString())
    .run();
  await db
    .prepare("INSERT INTO admin_attempts (ip_hash, created_at) VALUES (?, ?)")
    .bind(ipHash, new Date().toISOString())
    .run();
}

export async function clearAdminFailures(ipHash: string): Promise<void> {
  const db = await getDb();
  await db.prepare("DELETE FROM admin_attempts WHERE ip_hash = ?").bind(ipHash).run();
}

export async function adminAttemptContext(request: Request): Promise<string> {
  return hashValue(clientIp(request));
}
