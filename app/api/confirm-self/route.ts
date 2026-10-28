import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) {
    return Response.json({ error: "Confirmation must come from this site." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const code = String(form?.get("code") ?? "");
  if (!/^[a-z0-9-]{3,40}$/i.test(code)) {
    return Response.json({ error: "Invalid confirmation request." }, { status: 400 });
  }

  const cookieName = `sw_self_confirm_${code}`;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token) {
    return Response.json(
      { error: "This browser does not have a self-confirmation pending." },
      { status: 403 },
    );
  }

  const db = await getDb();
  const update = await db
    .prepare(
      `UPDATE registrants
       SET verified = 1, confirmation_method = 'self', verify_token = NULL
       WHERE ref_code = ? AND verify_token = ? AND is_demo = 0 AND verified = 0`,
    )
    .bind(code, decodeURIComponent(token))
    .run();

  if (update.meta.changes !== 1) {
    return Response.json(
      { error: "This self-confirmation link is no longer valid." },
      { status: 400 },
    );
  }

  const response = NextResponse.redirect(new URL(`/thank-you/${code}?self=1&confirmed=1`, url.origin), 303);
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 0,
  });
  return response;
}
