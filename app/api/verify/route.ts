import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/?verify=invalid", url.origin));
  }

  const db = await getDb();
  const row = await db
    .prepare("SELECT id, ref_code FROM registrants WHERE verify_token = ? AND is_demo = 0 LIMIT 1")
    .bind(token)
    .first<{ id: number; ref_code: string }>();

  if (!row) {
    return NextResponse.redirect(new URL("/?verify=invalid", url.origin));
  }

  await db
    .prepare(
      "UPDATE registrants SET verified = 1, confirmation_method = 'email', email_sent = 1, verify_token = NULL WHERE id = ?",
    )
    .bind(row.id)
    .run();
  return NextResponse.redirect(
    new URL(`/thank-you/${row.ref_code}?verified=1`, url.origin),
  );
}
