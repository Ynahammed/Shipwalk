import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase().slice(0, 40);

  try {
    const db = await getDb();
    const exists = await db
      .prepare("SELECT 1 AS ok FROM registrants WHERE ref_code = ? LIMIT 1")
      .bind(code)
      .first<{ ok: number }>();

    const target = new URL("/", request.url);
    if (exists) target.searchParams.set("ref", code);
    const response = NextResponse.redirect(target);
    if (exists) {
      response.cookies.set("sw_ref", code, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
