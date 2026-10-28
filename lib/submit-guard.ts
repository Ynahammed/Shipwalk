export type SubmissionGuardResult = { ok: true } | { ok: false; error: string };

const MIN_DESCRIPTION_CHARS = 60;
const MIN_DESCRIPTION_WORDS = 10;

/**
 * Cheap checks that run before the model. The evaluator only ever sees text,
 * so a submission that does not describe a project must never reach it and
 * must never produce a certificate.
 */
export function checkSubmission(input: {
  title: string;
  url: string;
  description: string;
  requestUrl: string;
}): SubmissionGuardResult {
  const title = input.title.trim();
  if (title.length < 3) {
    return { ok: false, error: "Give your project a real name (at least 3 characters)." };
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(input.url.trim());
  } catch {
    parsed = null;
  }
  if (!parsed || !/^https?:$/.test(parsed.protocol)) {
    return { ok: false, error: "Paste the full link to your deployed project, starting with https://." };
  }

  let ownHost = "";
  try {
    ownHost = new URL(input.requestUrl).host;
  } catch {
    ownHost = "";
  }
  if (ownHost && parsed.host === ownHost) {
    return {
      ok: false,
      error:
        "That link points back to ShipWeek itself. Paste the URL of your own deployed project.",
    };
  }

  if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
    return { ok: false, error: "Paste the full link to your deployed project, starting with https://." };
  }

  const description = input.description.replace(/\s+/g, " ").trim();
  const words = description ? description.split(" ").filter((word) => word.length > 1) : [];
  const substantial = words.filter((word) => word.replace(/[^a-z0-9]/gi, "").length >= 4).length;

  if (
    description.length < MIN_DESCRIPTION_CHARS ||
    words.length < MIN_DESCRIPTION_WORDS ||
    substantial < 3
  ) {
    return {
      ok: false,
      error:
        "Describe the project in at least a couple of sentences: what it does, who uses it, and what works right now.",
    };
  }

  return { ok: true };
}

// Anything the reviewer could not actually judge stays below the certificate line.
export const MIN_SCORE_FOR_CERTIFICATE = 25;
