/**
 * Review-only signals for the organiser. None of this blocks a submission or
 * changes a score; it just points at text that does not read like one student
 * shipping a project in three evenings.
 */
export function submissionFlags(input: {
  title: string;
  description: string;
  url: string;
}): string[] {
  const description = input.description.replace(/\s+/g, " ").trim();
  const lower = description.toLowerCase();
  const words = description ? description.split(" ").filter((word) => word.length > 1) : [];
  const flags: string[] = [];

  if (words.length < 40) {
    flags.push(`Only ${words.length} words of description.`);
  }

  const longTimeline =
    /\b(\d+\s*[-–to]{0,3}\s*(months?|quarters?|years?)|half a year|over a semester|academic year)\b/i.test(
      description,
    );
  if (longTimeline) {
    flags.push("Describes a timeline longer than the 3-day sprint.");
  }

  const team =
    /\b(team of|ui\/ux|ux designer|qa engineer|scrum master|product owner|stakeholders?|my team|our team|the team)\b/i.test(
      description,
    );
  if (team) {
    flags.push("Describes a team rather than one student.");
  }

  const corporate =
    /\b(jira|microsoft project|gantt|confluence|asana|enterprise rollout|sprint velocity)\b/i.test(
      description,
    );
  if (corporate) {
    flags.push("Corporate tooling and process language.");
  }

  if (/\bwe\b/i.test(lower) && !/\bi\b/i.test(lower)) {
    flags.push("Written as “we” with no solo voice.");
  }

  const concrete =
    /\b(map|search|queue|score|button|form|list|upload|notify|alert|chart|calendar|login|api|database|d1|next\.js|workers|track|dashboard|filter|export|match|rank|schedule|slot|vote|claim|request|photo|payment|ticket|eta|link)\b/i.test(
      description,
    ) || /\d/.test(description);
  if (!concrete) {
    flags.push("No specific feature described.");
  }

  return flags;
}
