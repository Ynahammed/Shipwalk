"use client";

import type { Idea } from "./types";

export const SIGNUP_EVENT = "sw:signup";

export function openSignup(idea?: Idea | null): void {
  window.dispatchEvent(new CustomEvent(SIGNUP_EVENT, { detail: { idea: idea ?? null } }));
}
