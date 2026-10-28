import { evaluateProject } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { getRegistrant } from "@/lib/data";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const code = String(body.code ?? "").trim().toLowerCase();
    const title = String(body.title ?? "").trim().slice(0, 100);
    const url = String(body.url ?? "").trim().slice(0, 300);
    const description = String(body.description ?? "").trim().slice(0, 1400);

    if (title.length < 2) {
      return Response.json({ error: "Give your project a name." }, { status: 400 });
    }
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) {
      return Response.json(
        { error: "Paste the full link, starting with https://." },
        { status: 400 },
      );
    }

    const registrant = await getRegistrant(code);
    if (!registrant) {
      return Response.json({ error: "Registration not found." }, { status: 404 });
    }

    const db = await getDb();
    const existing = await db
      .prepare(
        "SELECT certificate_id, score FROM submissions WHERE registrant_id = ? LIMIT 1",
      )
      .bind(registrant.id)
      .first<{ certificate_id: string | null; score: number | null }>();
    if (existing) {
      return Response.json(
        {
          error: "You already submitted a project.",
          certificateId: existing.certificate_id,
          score: existing.score,
        },
        { status: 409 },
      );
    }

    const evaluation = await evaluateProject({
      name: registrant.name,
      college: registrant.college,
      title,
      url,
      description,
    });

    const certificateId = `SW-26-${String(registrant.id).padStart(4, "0")}`;
    await db
      .prepare(
        `INSERT INTO submissions
          (registrant_id, project_title, project_url, description, score, feedback_json, certificate_id, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        registrant.id,
        title,
        url,
        description || null,
        evaluation.data.score,
        JSON.stringify(evaluation.data),
        certificateId,
        new Date().toISOString(),
      )
      .run();
    await db
      .prepare("UPDATE registrants SET checked_in = 1 WHERE id = ?")
      .bind(registrant.id)
      .run();

    return Response.json(
      {
        ok: true,
        evaluation: evaluation.data,
        source: evaluation.source,
        aiConfigured: evaluation.source === "llm",
        certificateId,
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Submission failed. Try again." }, { status: 500 });
  }
}
