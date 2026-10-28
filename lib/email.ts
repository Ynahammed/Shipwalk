function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function isEmailConfigured(env: CloudflareEnv): boolean {
  return Boolean(env.SMTP2GO_API_KEY?.trim() && env.SMTP2GO_SENDER?.trim());
}

export async function sendVerificationEmail(
  env: CloudflareEnv,
  input: { to: string; name: string; verifyUrl: string; refCode: string },
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = env.SMTP2GO_API_KEY?.trim();
  const sender = env.SMTP2GO_SENDER?.trim();
  if (!apiKey || !sender) return { sent: false, reason: "not_configured" };

  const firstName = input.name.split(" ")[0] || "there";
  const safeFirstName = escapeHtml(firstName);

  const textBody = [
    `You're in, ${firstName}.`,
    "",
    "Confirm your email to lock your seat and start earning referral credit. Only verified signups count toward the leaderboard.",
    "",
    `Confirm my seat: ${input.verifyUrl}`,
    "",
    `Your personal referral code is ${input.refCode}.`,
    "",
    "You signed up for a free 60-minute AI build session. We only collected name, email, phone, college, year and branch. Reply to this email if you want your data removed.",
  ].join("\n");

  try {
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "X-Smtp2go-Api-Key": apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [input.to],
        subject: "Your ShipWeek seat — confirm your email",
        text_body: textBody,
        html_body: `
          <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f4f0e5;color:#161710">
            <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px">ShipWeek '26</p>
            <h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.05;margin:0 0 16px">You're in, ${safeFirstName}.</h1>
            <p style="font-size:15px;line-height:1.6;color:#5e5f52;margin:0 0 24px">
              Confirm your email to lock your seat and start earning referral credit.
              Only verified signups count toward the leaderboard.
            </p>
            <p style="margin:0 0 28px">
              <a href="${input.verifyUrl}" style="background:#161710;color:#fbf8f0;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Confirm my seat</a>
            </p>
            <p style="font-size:13px;line-height:1.6;color:#5e5f52;margin:0 0 8px">
              Your personal referral code is <strong>${escapeHtml(input.refCode)}</strong>.
            </p>
            <p style="font-size:12px;line-height:1.6;color:#8b8b7c;margin:24px 0 0">
              You signed up for a free 60-minute AI build session. We only collected name, email, phone,
              college, year and branch. Reply to this email if you want your data removed.
            </p>
          </div>
        `,
      }),
    });

    type Smtp2goResponse = {
      data?: {
        succeeded?: number;
        failed?: number;
        error?: string;
        error_code?: string;
      };
    };

    const payload = (await response.json().catch(() => null)) as Smtp2goResponse | null;
    const data = payload?.data;

    // SMTP2GO answers 200 for accepted requests, but a rejected message can
    // still come back with succeeded = 0, so both have to be checked.
    if (!response.ok || data?.succeeded !== 1) {
      const reason = data?.error_code || `smtp2go_${response.status}`;
      console.error(
        "email:send_failed",
        JSON.stringify({
          provider: "smtp2go",
          status: response.status,
          reason,
          detail: data?.error ?? null,
        }),
      );
      return { sent: false, reason: String(reason).slice(0, 80) };
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "email:send_failed",
      JSON.stringify({
        provider: "smtp2go",
        reason: "network",
        detail: error instanceof Error ? error.message : null,
      }),
    );
    return { sent: false, reason: "network" };
  }
}
