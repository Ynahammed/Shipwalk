"use client";

import { useEffect } from "react";
import { storeRef, track } from "@/lib/track";

export function RefCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[a-z0-9-]{2,40}$/i.test(ref)) {
      storeRef(ref.toLowerCase());
    }

    const alreadyCounted = sessionStorage.getItem("sw_visit_sent");
    if (!alreadyCounted) {
      sessionStorage.setItem("sw_visit_sent", "1");
      track("visit", {
        ref: ref ?? undefined,
        path: window.location.pathname,
      });
    }
  }, []);

  return null;
}
