import { writeShareMessages } from "@/lib/ai";
import { getRegistrant } from "@/lib/data";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const code = String(body.code ?? "").trim().toLowerCase();
    const registrant = await getRegistrant(code);
    if (!registrant) {
      return Response.json({ error: "Registration not found." }, { status: 404 });
    }

    let ideaTitle = "";
    if (registrant.idea_json) {
      try {
        const idea = JSON.parse(registrant.idea_json) as { title?: string };
        ideaTitle = typeof idea.title === "string" ? idea.title : "";
      } catch {
        ideaTitle = "";
      }
    }

    const result = await writeShareMessages({
      name: registrant.name,
      college: registrant.college,
      branch: registrant.branch,
      ideaTitle,
    });

    return Response.json(
      { messages: result.data, source: result.source, aiConfigured: result.source === "llm" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Could not write messages." }, { status: 500 });
  }
}
