import {
  getCollegeRank,
  getLeaderboard,
  getLeaderboardRank,
  getPublicStats,
} from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const [people, colleges, rank, stats] = await Promise.all([
    getLeaderboard(10),
    getCollegeRank(12),
    code ? getLeaderboardRank(code) : Promise.resolve(null),
    getPublicStats(),
  ]);

  return Response.json(
    { people, colleges, rank, stats, updatedAt: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
