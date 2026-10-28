import { getPublicStats } from "@/lib/data";

export async function GET() {
  const stats = await getPublicStats();
  return Response.json(stats, { headers: { "cache-control": "no-store" } });
}
