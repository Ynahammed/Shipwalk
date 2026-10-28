import { generateIdea } from "@/lib/ai";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const branch = String(body.branch ?? "").trim();
    const interest = String(body.interest ?? "").trim();

    if (!branch || branch.length > 40) {
      return Response.json({ error: "Pick a branch." }, { status: 400 });
    }
    if (!interest || interest.length > 60) {
      return Response.json({ error: "Pick an interest or type one." }, { status: 400 });
    }

    const result = await generateIdea(branch, interest);
    return Response.json(
      {
        idea: result.data,
        source: result.source,
        aiConfigured: result.source === "llm",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "The idea generator hiccuped. Try once more." },
      { status: 500 },
    );
  }
}
