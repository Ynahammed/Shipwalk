import { cookies } from "next/headers";
import { workshop } from "./config";
import { getEnv } from "./db";
import { isLoopbackHost } from "./host";
import { hashValue } from "./utils";

export const ADMIN_COOKIE = "sw_admin";

/**
 * The demo passcode is only a convenience for local previews. On a deployed
 * worker (or any non-loopback host) an unset ADMIN_PASSCODE disables admin
 * access rather than falling back to a passcode that is published in the repo.
 */
async function demoPasscodeAllowed(): Promise<boolean> {
  // Deliberately host-based, not env-based: a local `.env` flag is baked into
  // the deployed bundle, and this fallback must never work on a public host.
  return isLoopbackHost();
}

/** Returns the active passcode, or null when admin access is disabled. */
export async function adminPasscode(): Promise<string | null> {
  const env = await getEnv();
  const configured = env.ADMIN_PASSCODE?.trim();
  if (configured) return configured;
  return (await demoPasscodeAllowed()) ? workshop.demoPasscode : null;
}

export async function isAdminConfigured(): Promise<boolean> {
  return (await adminPasscode()) !== null;
}

export async function adminToken(): Promise<string | null> {
  const passcode = await adminPasscode();
  return passcode ? hashValue(`admin:${passcode}`) : null;
}

/** Constant-time comparison so the passcode cannot be probed by timing. */
export async function passcodeMatches(submitted: string): Promise<boolean> {
  const expected = await adminPasscode();
  if (!expected || !submitted) return false;
  const [a, b] = await Promise.all([
    hashValue(`compare:${submitted}`),
    hashValue(`compare:${expected}`),
  ]);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = await adminToken();
  return expected !== null && token === expected;
}
