import { getDb } from "@/lib/db";
import { isValidEmail, normalizePhone, readJson } from "@/lib/utils";

/**
 * Students lose the thank-you URL: it carries their ref code, the confirmation
 * email does not, and the email sender is not guaranteed to be working. This
 * endpoint trades the exact email + mobile pair they signed up with for that
 * code, so status is reachable without bookmarking anything.
 *
 * Demo and simulation rows are excluded — they are not real students.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!isValidEmail(email) || !phone) {
      return Response.json(
        { error: "Enter the email and 10-digit mobile number you signed up with." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const row = await db
      .prepare(
        `SELECT ref_code FROM registrants
         WHERE email = ? AND phone = ? AND is_demo = 0
         LIMIT 1`,
      )
      .bind(email, phone)
      .first<{ ref_code: string }>();

    if (!row) {
      // Same answer for "no such seat" and "wrong phone", so this cannot be
      // used to test whether an address is registered.
      return Response.json(
        { error: "No seat matches that email and mobile number. Check them, or ask the organiser." },
        { status: 404 },
      );
    }

    return Response.json({ code: row.ref_code }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Seat lookup failed. Try again." }, { status: 500 });
  }
}
