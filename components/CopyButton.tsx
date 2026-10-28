"use client";

import { useState } from "react";
import { Check, CopyIcon } from "./icons";

export function CopyButton({
  value,
  label = "Copy",
  className = "btn btn-ghost",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the value is still visible to copy manually.
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? <Check /> : <CopyIcon />}
      {copied ? "Copied" : label}
    </button>
  );
}
