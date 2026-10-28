import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, isAdminConfigured, passcodeMatches } from "@/lib/auth";
import { readJson } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!(await isAdminConfigured())) {
      return Response.json(
        { error: "Admin access is disabled. Set the ADMIN_PASSCODE secret to enable it." },
        { status: 503 },
      );
    }

    const body = await readJson(request);
    const submitted = String(body.passcode ?? "");
    if (!(await passcodeMatches(submitted))) {
      return Response.json({ error: "Wrong passcode." }, { status: 401 });
    }

    const token = await adminToken();
    if (!token) {
      return Response.json(
        { error: "Admin access is disabled. Set the ADMIN_PASSCODE secret to enable it." },
        { status: 503 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, {
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
