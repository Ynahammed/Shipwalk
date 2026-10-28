"use client";

export type TrackType = "visit" | "idea_generated" | "signup_start" | "share_click";

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem("sw_device");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("sw_device", id);
    return id;
  } catch {
    return "";
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem("sw_session");
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem("sw_session", id);
    return id;
  } catch {
    return "";
  }
}

export function storeRef(ref: string): void {
  try {
    localStorage.setItem("sw_ref", ref);
    document.cookie = `sw_ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } catch {
    // Cookies or storage can be unavailable in private modes.
  }
}

export function readRef(): string {
  try {
    return localStorage.getItem("sw_ref") ?? "";
  } catch {
    return "";
  }
}

export function track(
  type: TrackType,
  options: { ref?: string; path?: string } = {},
): void {
  try {
    const payload = JSON.stringify({
      type,
      ref: options.ref || readRef() || undefined,
      path: options.path || window.location.pathname,
      sessionId: getSessionId(),
      deviceId: getDeviceId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Never let analytics break the UI.
  }
}
