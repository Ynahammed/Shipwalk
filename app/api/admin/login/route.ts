import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminAttemptContext,
  adminFailures,
  adminPasscode,
  adminToken,
  clearAdminFailures,
  recordAdminFailure,
} from "@/lib/auth";
import { readJson, hashValue } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const submitted = String(body.passcode ?? "");
    const ipHash = await adminAttemptContext(request);

    const failures = await adminFailures(ipHash);
    if (failures.retryAfterSec > 0) {
      return Response.json(
        {
          error: `Too many failed attempts. Try again in ${Math.ceil(failures.retryAfterSec / 60)} minute(s).`,
        },
        { status: 429, headers: { "retry-after": String(failures.retryAfterSec) } },
      );
    }

    // Hash both sides so the comparison does not leak the value by length or timing.
    const match = submitted.length > 0 && (await hashValue(submitted)) === (await hashValue(await adminPasscode()));
    if (!match) {
      await recordAdminFailure(ipHash);
      const remaining = Math.max(0, 5 - (failures.count + 1));
      return Response.json(
        {
          error:
            remaining > 0
              ? `Wrong passcode. ${remaining} attempt${remaining === 1 ? "" : "s"} left before a 15-minute lock.`
              : "Wrong passcode. This address is locked for 15 minutes.",
        },
        { status: 401 },
      );
    }

    await clearAdminFailures(ipHash);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return Response.json({ error: "Login failed." }, { status: 500 });
  }
}
