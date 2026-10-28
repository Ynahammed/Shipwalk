import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await readJson(request);
    const action = String(body.action ?? "");
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid id." }, { status: 400 });
    }

    const db = await getDb();
    if (action === "verify") {
      await db
        .prepare(
          "UPDATE registrants SET verified = 1, confirmation_method = 'admin', verify_token = NULL WHERE id = ? AND is_demo = 0",
        )
        .bind(id)
        .run();
    } else if (action === "checkin") {
      await db
        .prepare("UPDATE registrants SET checked_in = 1 - checked_in WHERE id = ?")
        .bind(id)
        .run();
    } else if (action === "captain") {
      const target = Math.max(5, Math.min(100, Number(body.target) || 20));
      await db
        .prepare(
          "INSERT OR IGNORE INTO captains (registrant_id, target, rewards_eligible, created_at) VALUES (?, ?, 1, ?)",
        )
        .bind(id, target, new Date().toISOString())
        .run();
    } else {
      return Response.json({ error: "Unknown action." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Action failed." }, { status: 500 });
  }
}

