import type { AdminOverview } from "@/lib/types";
import { percent } from "@/lib/utils";

export function FunnelBars({
  funnel,
  simulated = false,
}: {
  funnel: AdminOverview["funnel"];
  simulated?: boolean;
}) {
  const steps = [
    { label: "Landing visits", value: funnel.visits, tone: "ink" },
    { label: "Ideas generated", value: funnel.ideas, tone: "ink" },
    { label: "Signup started", value: funnel.signupStarts, tone: "ink" },
    { label: "Seats claimed", value: funnel.signups, tone: "accent" },
    { label: "Share clicks", value: funnel.shares, tone: "ink" },
  ];

  return (
    <div>
      <div className="space-y-3.5">
        {steps.map((step) => {
          const share = percent(step.value, funnel.visits);
          return (
            <div key={step.label}>
              <div className="flex items-baseline justify-between gap-3 text-[11px]">
                <span className="font-medium">{step.label}</span>
                <span className="mono text-ink-soft">
                  {step.value.toLocaleString("en-IN")}{" "}
                  <span className="text-[9px] text-ink-faint">{share}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e9e4d6]">
                <div
                  className={`h-full rounded-full ${step.tone === "accent" ? "bg-accent" : "bg-ink"}`}
                  style={{ width: `${Math.max(2, share)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-2.5 text-[9.5px] leading-relaxed text-ink-faint">
        {simulated ? (
          <>
            The funnel above uses {funnel.liveVisits.toLocaleString("en-IN")} simulated visits from
            the generated campaign. No real visitor is included, and the public site shows the same
            banner. Percentages use simulated landing visits as their denominator.
          </>
        ) : (
          <>
            The funnel above uses {funnel.liveVisits.toLocaleString("en-IN")} live visits only.
            {funnel.demoVisits.toLocaleString("en-IN")} seeded demo visits are excluded as preview
            examples. Percentages use live landing visits as their denominator.
          </>
        )}
      </div>
    </div>
  );
}
