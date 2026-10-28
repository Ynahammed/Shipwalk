import { isAdmin } from "@/lib/auth";
import { getDb, purgeDemoRows } from "@/lib/db";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await readJson(request);
    const action = String(body.action ?? "");
    const db = await getDb();

    // One-way cleanup: removes the synthetic preview campaign (and only that)
    // so a live deployment is left with real registrations only.
    if (action === "purge-demo") {
      const removed = await purgeDemoRows(db);
      return Response.json({ ok: true, removed });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid id." }, { status: 400 });
    }

    if (action === "verify") {
      await db
        .prepare(
          "UPDATE registrants SET verified = 1, confirmation_method = 'admin', verify_token = NULL WHERE id = ? AND is_demo = 0",
        )
        .bind(id)
        .run();
    } else if (action === "checkin") {
      await db
        .prepare("UPDATE registrants SET checked_in = 1 - checked_in WHERE id = ? AND is_demo = 0")
        .bind(id)
        .run();
    } else if (action === "approve-submission") {
      // The organiser's score is the result. It is stored separately from the AI
      // baseline so the baseline can never be mistaken for the final score.
      const score = Number(body.score);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        return Response.json(
          { error: "Enter a whole-number score between 0 and 100." },
          { status: 400 },
        );
      }
      const updated = await db
        .prepare(
          "UPDATE submissions SET final_score = ?, review_status = 'approved', reviewed_at = ? WHERE registrant_id = ? AND is_demo = 0",
        )
        .bind(score, new Date().toISOString(), id)
        .run();
      if ((updated.meta.changes ?? 0) === 0) {
        return Response.json({ error: "No live submission for that student." }, { status: 404 });
      }
      return Response.json({ ok: true, score });
    } else if (action === "reset-submission") {
      // Lets an organiser clear a submission that should never have been scored
      // (placeholder text, a link back to this site). The student keeps their
      // seat and can submit again; the old score and certificate stop existing.
      const removed = await db
        .prepare("DELETE FROM submissions WHERE registrant_id = ? AND is_demo = 0")
        .bind(id)
        .run();
      if ((removed.meta.changes ?? 0) === 0) {
        return Response.json({ error: "No live submission for that student." }, { status: 404 });
      }
      return Response.json({ ok: true, removed: removed.meta.changes });
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
