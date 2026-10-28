import { headers } from "next/headers";

/**
 * True only when the current request is being served from this machine.
 *
 * Demo conveniences (the published fallback passcode, auto-seeding) must never
 * depend on an environment variable alone: `next build` bakes local `.env`
 * values into the worker bundle, so a flag can look "set" on a deployed worker.
 */
export async function isLoopbackHost(): Promise<boolean> {
  try {
    const headerList = await headers();
    const host = (
      headerList.get("x-forwarded-host") ??
      headerList.get("host") ??
      ""
    )
      .split(",")[0]
      .trim()
      .toLowerCase();
    const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    // No request scope (for example during a static prerender).
    return false;
  }
}
