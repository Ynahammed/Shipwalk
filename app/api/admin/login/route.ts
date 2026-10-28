import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPasscode, adminToken } from "@/lib/auth";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const submitted = String(body.passcode ?? "");
    if (!submitted || submitted !== (await adminPasscode())) {
      return Response.json({ error: "Wrong passcode." }, { status: 401 });
    }

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
