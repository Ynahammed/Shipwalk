import { getDb } from "./db";

/**
 * Which set of rows the site is currently presenting.
 *
 * `live`        real registrations only (is_demo = 0)
 * `simulation`  the generated campaign (is_demo = 1, demo_kind = 'sim')
 *
 * Simulation rows are still demo rows: they can never leak into live totals,
 * they carry the DEMO tag, and every page renders a banner while the mode is on.
 * The mode is stored in D1, so turning it off immediately restores live numbers
 * without deleting anything.
 */
export type DataMode = "live" | "simulation";

export const DAY_MS = 86_400_000;
export const SIM_KIND = "sim";
export const DEMO_KIND = "demo";
export const MODE_SETTING = "data_mode";

export async function getDataMode(): Promise<DataMode> {
  try {
    const db = await getDb();
    const row = await db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .bind(MODE_SETTING)
      .first<{ value: string }>();
    return row?.value === "simulation" ? "simulation" : "live";
  } catch {
    return "live";
  }
}

export async function setDataMode(mode: DataMode): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .bind(MODE_SETTING, mode)
    .run();
}

/**
 * SQL predicate for the rows that make up the campaign in a given mode.
 * Pass the table alias when the query joins.
 */
export function activeSql(mode: DataMode, alias = ""): string {
  const p = alias ? `${alias}.` : "";
  return mode === "simulation"
    ? `${p}is_demo = 1 AND ${p}demo_kind = '${SIM_KIND}'`
    : `${p}is_demo = 0`;
}

/**
 * The predicate for a row's own set. Student-facing pages use this so a
 * simulated student's referral count and rank are computed inside the same
 * simulation instead of returning zero.
 */
export function ownSetSql(isDemo: number, kind: string | null | undefined, alias = ""): string {
  const p = alias ? `${alias}.` : "";
  if (isDemo !== 1) return `${p}is_demo = 0`;
  return `${p}is_demo = 1 AND ${p}demo_kind = '${kind === SIM_KIND ? SIM_KIND : DEMO_KIND}'`;
}
