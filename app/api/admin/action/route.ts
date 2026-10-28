import { isAdmin, revokeAdminSessions } from "@/lib/auth";
import { getDb, purgeDemoRows } from "@/lib/db";
import { activeSql, getDataMode, setDataMode } from "@/lib/mode";
import { clearSimulation, seedSimulation } from "@/lib/simulation";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await readJson(request);
    const action = String(body.action ?? "");
    const db = await getDb();
    const mode = await getDataMode();
    const act = activeSql(mode);

    // One-way cleanup: removes the synthetic preview campaign (and only that)
    // so a live deployment is left with real registrations only.
    if (action === "purge-demo") {
      const removed = await purgeDemoRows(db);
      return Response.json({ ok: true, removed });
    }

    if (action === "revoke-sessions") {
      // Invalidates every issued admin cookie, including the one making this call.
      await revokeAdminSessions();
      return Response.json({ ok: true });
    }

    // Simulation controls. These are the only actions that change which row set
    // the whole site presents, so they are handled before any id parsing.
    if (action === "seed-simulation") {
      const seeded = await seedSimulation(db);
      await setDataMode("simulation");
      return Response.json({ ok: true, mode: "simulation", ...seeded });
    }

    if (action === "clear-simulation") {
      const removed = await clearSimulation(db);
      await setDataMode("live");
      return Response.json({ ok: true, mode: "live", removed });
    }

    if (action === "set-mode") {
      const requested = body.mode === "simulation" ? "simulation" : "live";
      await setDataMode(requested);
      return Response.json({ ok: true, mode: requested });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid id." }, { status: 400 });
    }

    if (action === "verify") {
      await db
        .prepare(
          `UPDATE registrants SET verified = 1, confirmation_method = 'admin', verify_token = NULL WHERE id = ? AND ${act}`,
        
        )
        .bind(id)
        .run();
    } else if (action === "checkin") {
      await db
        .prepare(`UPDATE registrants SET checked_in = 1 - checked_in WHERE id = ? AND ${act}`)
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
          `UPDATE submissions SET final_score = ?, review_status = 'approved', reviewed_at = ? WHERE registrant_id = ? AND ${activeSql(mode)}`,
        )
        .bind(score, new Date().toISOString(), id)
        .run();
      if ((updated.meta.changes ?? 0) === 0) {
        return Response.json({ error: "No live submission for that student." }, { status: 404 });
      }
      return Response.json({ ok: true, score });
    } else if (action === "delete-registrant") {
      // Erasure path: removes the student, their submission, events and captain
      // row, and releases anyone who signed up with their referral code.
      const target = await db
        .prepare("SELECT ref_code FROM registrants WHERE id = ? AND is_demo = 0")
        .bind(id)
        .first<{ ref_code: string }>();
      if (!target) {
        return Response.json({ error: "No live registrant with that id." }, { status: 404 });
      }
      await db.batch([
        db.prepare("DELETE FROM submissions WHERE registrant_id = ?").bind(id),
        db.prepare("DELETE FROM captains WHERE registrant_id = ?").bind(id),
        db.prepare("DELETE FROM events WHERE ref_code = ?").bind(target.ref_code),
        db.prepare("UPDATE registrants SET referred_by = NULL WHERE referred_by = ?").bind(target.ref_code),
        db.prepare("DELETE FROM registrants WHERE id = ? AND is_demo = 0").bind(id),
        db.prepare("DELETE FROM colleges WHERE id NOT IN (SELECT DISTINCT college_id FROM registrants)"),
      ]);
      return Response.json({ ok: true, deleted: 1 });
    } else if (action === "reset-submission") {
      // Lets an organiser clear a submission that should never have been scored
      // (placeholder text, a link back to this site). The student keeps their
      // seat and can submit again; the old score and certificate stop existing.
      const removed = await db
        .prepare(`DELETE FROM submissions WHERE registrant_id = ? AND ${activeSql(mode)}`)
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
