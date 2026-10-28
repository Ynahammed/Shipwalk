import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Full data export, admin only. Doubles as the pre-event backup: every table the
 * campaign depends on, in one JSON file. Contains personal data, so it is
 * no-store and never cached.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const [registrants, submissions, colleges, captains, events, ideas, prompts] =
      await Promise.all([
        db.prepare("SELECT * FROM registrants WHERE is_demo = 0").all(),
        db.prepare("SELECT * FROM submissions WHERE is_demo = 0").all(),
        db.prepare("SELECT * FROM colleges").all(),
        db.prepare("SELECT * FROM captains").all(),
        db.prepare("SELECT * FROM events WHERE is_demo = 0").all(),
        db.prepare("SELECT * FROM project_ideas").all(),
        db.prepare("SELECT id, component, source, model, duration_ms, created_at FROM prompt_logs").all(),
      ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      note: "Contains personal data (names, emails, phone numbers). Store securely.",
      registrants: registrants.results ?? [],
      submissions: submissions.results ?? [],
      colleges: colleges.results ?? [],
      captains: captains.results ?? [],
      events: events.results ?? [],
      projectIdeas: ideas.results ?? [],
      promptLogs: prompts.results ?? [],
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="shipweek-export-${stamp}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Export failed." }, { status: 500 });
  }
}
