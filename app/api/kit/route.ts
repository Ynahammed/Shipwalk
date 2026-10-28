import { writeCaptainKit } from "@/lib/ai";
import { cleanName, readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const college = cleanName(String(body.college ?? "")).slice(0, 80);
    const branchMix = cleanName(String(body.branchMix ?? "")).slice(0, 120);

    if (college.length < 2) {
      return Response.json({ error: "Enter a college." }, { status: 400 });
    }

    const result = await writeCaptainKit(college, branchMix || "CSE, IT, ECE");
    return Response.json(
      { kit: result.data, source: result.source, aiConfigured: result.source === "llm" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Could not build the kit." }, { status: 500 });
  }
}
