"use client";

import { useEffect, useState } from "react";
import { storeRef, track } from "@/lib/track";
import type { ShareMessages } from "@/lib/types";
import { ChatIcon, CopyIcon } from "./icons";
import { CopyButton } from "./CopyButton";

type Variant = keyof ShareMessages;

const LABELS: { key: Variant; label: string }[] = [
  { key: "casual", label: "Casual" },
  { key: "placement", label: "Placement angle" },
  { key: "curiosity", label: "Curiosity" },
];

export function ShareStudio({
  code,
  link,
  initialMessages,
}: {
  code: string;
  link: string;
  initialMessages: ShareMessages;
}) {
  const [messages, setMessages] = useState<ShareMessages>(initialMessages);
  const [source, setSource] = useState("fallback");
  const [variant, setVariant] = useState<Variant>("casual");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/share", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          messages?: ShareMessages;
          source?: string;
        };
        if (alive && data.messages) {
          setMessages(data.messages);
          setSource(data.source ?? "fallback");
        }
      } catch {
        // The curated copy already on screen stays usable.
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [code]);

  const message = messages[variant];
  const fullMessage = `${message}\n\n${link}`;

  function share() {
    storeRef(code);
    track("share_click", { ref: code, path: "/thank-you" });
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink bg-ink px-5 py-3 text-paper">
        <div className="flex items-center gap-2">
          <ChatIcon className="h-4 w-4 text-lime" />
          <span className="eyebrow">Share studio</span>
        </div>
        <span className="tag !border-paper/20 !bg-paper/10 !text-paper/70">
          {source === "llm" ? "AI copy" : "Curated copy"}
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5">
          {LABELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setVariant(item.key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                variant === item.key
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper-2 text-ink-soft hover:border-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4 rounded-lg rounded-tl-none border border-line bg-paper px-4 py-4">
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-soft">
            {message}
          </p>
          <p className="mt-3 break-all border-t border-line pt-2 text-[10px] text-ink-faint">
            {link}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={share} className="btn btn-lime flex-1">
            <ChatIcon /> Share on WhatsApp
          </button>
          <CopyButton
            value={fullMessage}
            label="Copy message"
            className="btn btn-ghost flex-1"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-[#fffdf7] px-3 py-2">
          <p className="mono min-w-0 flex-1 truncate text-[10.5px] text-ink-soft">{link}</p>
          <CopyButton
            value={link}
            label="Copy link"
            className="shrink-0 text-[10.5px] font-semibold text-accent hover:underline"
          />
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-faint">
          <CopyIcon className="mt-0.5 h-3 w-3 shrink-0" />
          The link is tracked. You get referral credit only when a friend signs up and
          confirms their email.
        </p>
      </div>
    </div>
  );
}
