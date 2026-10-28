/**
 * The evaluator only reads text, so it used to reward any URL string. This
 * check adds one fact it cannot invent: whether the link actually answered.
 * Private and loopback targets are refused (SSRF guard) — the deployed Worker
 * also sets global_fetch_strictly_public.
 */
export type UrlProbe = {
  status: "ok" | "unreachable" | "blocked";
  detail: string;
  checkedAt: string;
};

const BLOCKED_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;

export async function probeProjectUrl(rawUrl: string): Promise<UrlProbe> {
  const checkedAt = new Date().toISOString();
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { status: "blocked", detail: "not a valid URL", checkedAt };
  }

  if (!/^https?:$/.test(url.protocol) || BLOCKED_HOST.test(url.hostname)) {
    return { status: "blocked", detail: "private or unsupported address", checkedAt };
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "ShipWeekReviewer/1.0 (+workshop project check)" },
      signal: AbortSignal.timeout(6000),
    });
    // The body is not needed; release it so the Worker does not hold the socket.
    await response.body?.cancel().catch(() => {});

    if (!response.ok) {
      return { status: "unreachable", detail: `HTTP ${response.status}`, checkedAt };
    }
    const type = response.headers.get("content-type") ?? "";
    if (type && !/text|html|json/i.test(type)) {
      return { status: "unreachable", detail: `unexpected ${type.split(";")[0]}`, checkedAt };
    }
    return { status: "ok", detail: `HTTP ${response.status}`, checkedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "network error";
    return { status: "unreachable", detail: message.slice(0, 80), checkedAt };
  }
}

export function formatProbe(probe: UrlProbe): string {
  return `${probe.status} ${probe.detail}`.trim();
}
