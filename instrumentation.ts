/**
 * Server error capture. Next calls this for every request that throws, so a
 * broken route shows up in the admin dashboard instead of only in the logs.
 * Logging must never throw into the request path.
 */
export async function register() {
  // No startup work needed; kept so Next treats this as the instrumentation hook.
}

type RequestInfo = { path?: string; method?: string };
type ErrorContext = { routePath?: string; routerKind?: string };

export async function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
): Promise<void> {
  try {
    const { getDb } = await import("./lib/db");
    const db = await getDb();
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    const digest =
      error && typeof error === "object" && "digest" in error
        ? String((error as { digest?: unknown }).digest ?? "")
        : "";
    const where = `${request?.method ?? ""} ${request?.path ?? context?.routePath ?? ""}`.trim();

    await db
      .prepare("INSERT INTO error_log (message, path, digest, created_at) VALUES (?, ?, ?, ?)")
      .bind(message.slice(0, 500), where.slice(0, 200), digest || null, new Date().toISOString())
      .run();
  } catch {
    // Error logging must never mask the original error.
  }
}
