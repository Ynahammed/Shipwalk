import { cookies } from "next/headers";
import { workshop } from "./config";
import { getEnv } from "./db";
import { hashValue } from "./utils";

export const ADMIN_COOKIE = "sw_admin";

export async function adminPasscode(): Promise<string> {
  const env = await getEnv();
  return env.ADMIN_PASSCODE?.trim() || workshop.demoPasscode;
}

export async function adminToken(): Promise<string> {
  return hashValue(`admin:${await adminPasscode()}`);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === (await adminToken());
}

