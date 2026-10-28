import { evaluateProject } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { getRegistrant } from "@/lib/data";
import { checkSubmission, MIN_SCORE_FOR_CERTIFICATE } from "@/lib/submit-guard";
import { formatProbe, probeProjectUrl } from "@/lib/url-probe";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const code = String(body.code ?? "").trim().toLowerCase();
    const title = String(body.title ?? "").trim().slice(0, 100);
    const url = String(body.url ?? "").trim().slice(0, 300);
    const description = String(body.description ?? "").trim().slice(0, 1400);

    // Reject placeholders, keyboard mash and self-referential links before any
    // model call, so a non-submission can never earn a score or a certificate.
    const guard = checkSubmission({
      title,
      url,
      description,
      requestUrl: request.url,
    });
    if (!guard.ok) {
      return Response.json({ error: guard.error }, { status: 422 });
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

    const probe = await probeProjectUrl(url);
    const evaluation = await evaluateProject({
      name: registrant.name,
      college: registrant.college,
      title,
      url,
      description,
      linkCheck: formatProbe(probe),
    });

    if (evaluation.data.score < MIN_SCORE_FOR_CERTIFICATE) {
      return Response.json(
        {
          error:
            "The reviewer could not find a project to score. Add what it does, who uses it, and the one thing that works today, then submit again.",
          evaluation: evaluation.data,
          source: evaluation.source,
        },
        { status: 422 },
      );
    }

    const certificateId = `SW-26-${String(registrant.id).padStart(4, "0")}`;
    await db
      .prepare(
        `INSERT INTO submissions
          (registrant_id, project_title, project_url, description, score, feedback_json, certificate_id,
           url_status, url_checked_at, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        registrant.id,
        title,
        url,
        description || null,
        evaluation.data.score,
        JSON.stringify(evaluation.data),
        certificateId,
        formatProbe(probe),
        probe.checkedAt,
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
        linkCheck: formatProbe(probe),
        certificateId,
        reviewStatus: "pending" as const,
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Submission failed. Try again." }, { status: 500 });
  }
}
