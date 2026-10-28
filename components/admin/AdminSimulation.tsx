"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Data-mode control. Simulation is a full 300+ student campaign stored as
 * demo rows: it drives every number on the site while it is on, and one click
 * returns the dashboard to live data without deleting anything.
 */
export function AdminSimulation({
  mode,
  students,
  submissions,
  certificates,
}: {
  mode: "live" | "simulation";
  students: number;
  submissions: number;
  certificates: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function run(action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setPending(action);
    setMessage("");
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string; students?: number; removed?: number };
      if (!response.ok) throw new Error(data.error ?? "Action failed.");
      setMessage(
        action === "seed-simulation"
          ? `Loaded a ${data.students ?? 0}-student simulation.`
          : action === "clear-simulation"
            ? `Removed ${data.removed ?? 0} simulation rows.`
            : "Data mode updated.",
      );
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Action failed.");
    } finally {
      setPending(null);
    }
  }

  async function switchMode(next: "live" | "simulation") {
    setPending(`mode-${next}`);
    setMessage("");
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "set-mode", mode: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not switch mode.");
      }
      setMessage(next === "simulation" ? "Showing the simulation." : "Showing live data.");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not switch mode.");
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;
  const simReady = students > 0;

  return (
    <div
      className={`border-b ${
        mode === "simulation" ? "border-[#6a4a12] bg-[#fdf3d8]" : "border-line bg-paper-2"
      }`}
    >
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-2.5">
        <div className="min-w-0 text-[10.5px] leading-relaxed text-ink-soft">
          {mode === "simulation" ? (
            <p className="text-[#6a4a12]">
              <strong>SIMULATION MODE.</strong> Showing {students} synthetic students,{" "}
              {submissions} simulated submissions and {certificates} issued certificates. No real
              signup is included, and the public site carries the same banner.
            </p>
          ) : (
            <p>
              <strong>Data mode: live.</strong>{" "}
              {simReady
                ? `A ${students}-student simulation is loaded and can be shown without touching live data.`
                : "No simulation loaded. Generate a full 340-student campaign to exercise every screen at scale."}
            </p>
          )}
          {message && <p className="mt-0.5 text-[10px] text-[#215c37]">{message}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "simulation" ? (
            <>
              <button
                type="button"
                onClick={() => switchMode("live")}
                disabled={busy}
                className="rounded border border-ink bg-paper px-2.5 py-1 text-[10px] font-semibold text-ink disabled:opacity-50"
              >
                {pending === "mode-live" ? "Switching…" : "Back to live data"}
              </button>
              <button
                type="button"
                onClick={() => run("seed-simulation", "Rebuild the simulation from scratch?")}
                disabled={busy}
                className="rounded border border-ink px-2.5 py-1 text-[10px] font-semibold text-ink disabled:opacity-50"
              >
                {pending === "seed-simulation" ? "Rebuilding…" : "Rebuild"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => run("seed-simulation")}
                disabled={busy}
                className="rounded bg-ink px-2.5 py-1 text-[10px] font-semibold text-paper disabled:opacity-50"
              >
                {pending === "seed-simulation" ? "Generating…" : "Run 340-student simulation"}
              </button>
              {simReady && (
                <button
                  type="button"
                  onClick={() => switchMode("simulation")}
                  disabled={busy}
                  className="rounded border border-ink px-2.5 py-1 text-[10px] font-semibold text-ink disabled:opacity-50"
                >
                  {pending === "mode-simulation" ? "Switching…" : "View simulation"}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  run(
                    "clear-simulation",
                    "Delete every simulation row and return to live data? This cannot be undone.",
                  )
                }
                disabled={busy || !simReady}
                className="text-[10px] font-semibold text-[#96310f] hover:underline disabled:opacity-40"
              >
                Clear simulation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
