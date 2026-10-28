import { recommendNextMove } from "@/lib/ai";
import { isAdmin } from "@/lib/auth";
import { workshop } from "@/lib/config";
import { getAdminOverview } from "@/lib/data";

export async function POST() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const overview = await getAdminOverview();
    const today = overview.pace[overview.pace.length - 1];
    const yesterday = overview.pace[overview.pace.length - 2];
    const dailyTarget = Math.max(1, (today?.target ?? workshop.seats) - (yesterday?.target ?? 0));
    const daysLeft = Math.max(
      0,
      Math.ceil(
        (new Date(workshop.campaignEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );
    const bestSource =
      overview.sources.find((s) => s.verified > 0)?.source ?? null;
    const bestCollege = overview.colleges.find((c) => c.verified > 0)?.name ?? null;

    const result = await recommendNextMove({
      total: overview.totals.total,
      verified: overview.totals.verified,
      todayCount: today?.count ?? 0,
      targetToday: dailyTarget,
      signups: overview.totals.total,
      ideas: overview.funnel.ideas,
      visits: overview.funnel.visits,
      shares: overview.funnel.shares,
      unverified: overview.totals.unverified,
      bestSource,
      bestCollege,
      daysLeft,
    });

    return Response.json(
      {
        move: result.data,
        source: result.source,
        model: result.model,
        createdAt: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Copilot failed. Try again." }, { status: 500 });
  }
}
