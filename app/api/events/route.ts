import { getDb } from "@/lib/db";
import { hashValue, clientIp, readJson } from "@/lib/utils";

const ALLOWED = new Set(["visit", "idea_generated", "signup_start", "share_click"]);

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const type = String(body.type ?? "");
    if (!ALLOWED.has(type)) {
      return Response.json({ ok: false }, { status: 400 });
    }

    const db = await getDb();
    const ipHash = await hashValue(clientIp(request));
    await db
      .prepare(
        `INSERT INTO events (type, ref_code, path, session_id, device_id, ip_hash, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        type,
        typeof body.ref === "string" ? body.ref.slice(0, 40) : null,
        typeof body.path === "string" ? body.path.slice(0, 200) : null,
        typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null,
        typeof body.deviceId === "string" ? body.deviceId.slice(0, 64) : null,
        ipHash,
        new Date().toISOString(),
      )
      .run();

    return Response.json({ ok: true });
  } catch {
    // Analytics must never break the page.
    return Response.json({ ok: false });
  }
}
