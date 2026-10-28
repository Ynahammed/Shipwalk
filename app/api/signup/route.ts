import { branches, years } from "@/lib/config";
import { getDb, getEnv } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import {
  cleanName,
  clientIp,
  hashValue,
  isValidEmail,
  normalizePhone,
  randomCode,
  readJson,
  refPrefix,
  slugifySource,
} from "@/lib/utils";


export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    const name = cleanName(String(body.name ?? ""));
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = normalizePhone(String(body.phone ?? ""));
    const collegeName = cleanName(String(body.college ?? "")).slice(0, 100);
    const year = String(body.year ?? "").trim();
    const branch = String(body.branch ?? "").trim();
    const interest = String(body.interest ?? "").trim().slice(0, 80);
    const rawRef = String(body.ref ?? "").trim().toLowerCase().slice(0, 40);
    const deviceId = /^[a-zA-Z0-9-]{8,64}$/.test(String(body.deviceId ?? ""))
      ? String(body.deviceId)
      : null;
    const refSource = body.source ? slugifySource(String(body.source)) : null;

    if (name.length < 2) {
      return Response.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: "That email doesn't look right." }, { status: 400 });
    }
    if (!phone) {
      return Response.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 },
      );
    }
    if (collegeName.length < 2) {
      return Response.json({ error: "Enter your college." }, { status: 400 });
    }
    if (!(years as readonly string[]).includes(year)) {
      return Response.json({ error: "Pick your year." }, { status: 400 });
    }
    if (!(branches as readonly string[]).includes(branch)) {
      return Response.json({ error: "Pick your branch." }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();
    const ipHash = await hashValue(clientIp(request));

    const duplicate = await db
      .prepare(
        "SELECT id FROM registrants WHERE email = ? OR phone = ? LIMIT 1",
      )
      .bind(email, phone)
      .first<{ id: number }>();
    if (duplicate) {
      return Response.json(
        {
          error:
            "That email or phone is already registered. Check your confirmation email or message the organiser for your personal link.",
        },
        { status: 409 },
      );
    }

    const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    const ipCount = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 0 AND ip_hash = ? AND created_at >= ?",
      )
      .bind(ipHash, hourAgo)
      .first<{ n: number }>();
    if ((ipCount?.n ?? 0) >= 10) {
      return Response.json(
        { error: "Too many signups from this network in the last hour. Try again later." },
        { status: 429 },
      );
    }
    if (deviceId) {
      const deviceCount = await db
        .prepare(
          "SELECT COUNT(*) AS n FROM registrants WHERE is_demo = 0 AND device_id = ? AND created_at >= ?",
        )
        .bind(deviceId, hourAgo)
        .first<{ n: number }>();
      if ((deviceCount?.n ?? 0) >= 4) {
        return Response.json(
          { error: "This device has hit the signup limit for the hour." },
          { status: 429 },
        );
      }
    }

    // College: reuse the canonical row, or create it once.
    let college = await db
      .prepare("SELECT id FROM colleges WHERE lower(name) = lower(?) LIMIT 1")
      .bind(collegeName)
      .first<{ id: number }>();
    if (!college) {
      try {
        await db
          .prepare("INSERT INTO colleges (name, city, created_at) VALUES (?, '', ?)")
          .bind(collegeName, nowIso)
          .run();
      } catch {
        // Another request may have created it between our select and insert.
      }
      college = await db
        .prepare("SELECT id FROM colleges WHERE lower(name) = lower(?) LIMIT 1")
        .bind(collegeName)
        .first<{ id: number }>();
    }
    if (!college) {
      return Response.json({ error: "Could not save your college." }, { status: 500 });
    }

    // Only an existing ref code can credit a referrer.
    const referrer = rawRef
      ? await db
          .prepare("SELECT ref_code FROM registrants WHERE ref_code = ? LIMIT 1")
          .bind(rawRef)
          .first<{ ref_code: string }>()
      : null;
    const referredBy = referrer?.ref_code ?? null;
    const source = referredBy ? "referral" : refSource ?? "direct";

    let ideaJson: string | null = null;
    if (body.idea && typeof body.idea === "object") {
      const idea = body.idea as Record<string, unknown>;
      if (
        typeof idea.title === "string" &&
        typeof idea.pitch === "string" &&
        Array.isArray(idea.stack) &&
        Array.isArray(idea.roadmap)
      ) {
        const encoded = JSON.stringify(idea);
        if (encoded.length < 5000) ideaJson = encoded;
      }
    }

    const verifyToken = crypto.randomUUID();
    let code = "";
    let insertedId: number | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      code = `${refPrefix(name)}-${randomCode(attempt < 4 ? 3 : 4)}`;
      try {
        const inserted = await db
          .prepare(
            `INSERT INTO registrants
              (name, email, phone, college_id, year, branch, interest, ref_code, referred_by,
               source, verified, confirmation_method, verify_token, ip_hash, device_id, idea_json, checked_in, is_demo, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?, ?, 0, 0, ?)`,
          )
          .bind(
            name,
            email,
            phone,
            college.id,
            year,
            branch,
            interest || null,
            code,
            referredBy,
            source,
            verifyToken,
            ipHash,
            deviceId,
            ideaJson,
            nowIso,
          )
          .run();
        insertedId = Number(inserted.meta.last_row_id);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("unique") && message.includes("ref_code")) continue;
        if (message.includes("unique")) {
          return Response.json(
            { error: "That email or phone is already registered." },
            { status: 409 },
          );
        }
        throw error;
      }
    }

    if (!insertedId) {
      return Response.json(
        { error: "Could not generate a unique referral link. Try again." },
        { status: 500 },
      );
    }

    const origin = new URL(request.url).origin;
    const verifyUrl = `${origin}/api/verify?token=${encodeURIComponent(verifyToken)}`;
    const env = await getEnv();
    const emailResult = await sendVerificationEmail(env, {
      to: email,
      name,
      verifyUrl,
      refCode: code,
    });

    await db
      .prepare("UPDATE registrants SET email_sent = ? WHERE id = ?")
      .bind(emailResult.sent ? 1 : 0, insertedId)
      .run();

    await db
      .prepare(
        `INSERT INTO events (type, ref_code, path, session_id, device_id, ip_hash, is_demo, created_at)
         VALUES ('signup_done', ?, '/signup', NULL, ?, ?, 0, ?)`,
      )
      .bind(code, deviceId, ipHash, nowIso)
      .run();

    const response = Response.json(
      {
        ok: true,
        code,
        seat: insertedId,
        emailSent: emailResult.sent,
        selfConfirmationAvailable: !emailResult.sent,
      },
      { status: 201 },
    );

    // If delivery is unavailable, allow this browser to self-confirm without
    // exposing the verification token in the public thank-you page or URL.
    if (!emailResult.sent) {
      const cookieName = `sw_self_confirm_${code}`;
      response.headers.append(
        "set-cookie",
        `${cookieName}=${verifyToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${origin.startsWith("https:") ? "; Secure" : ""}`,
      );
    }
    return response;
  } catch {
    return Response.json(
      { error: "Signup failed on our side. Please try again in a moment." },
      { status: 500 },
    );
  }
}

