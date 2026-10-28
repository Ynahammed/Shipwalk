import { getDataMode } from "@/lib/mode";

/**
 * Shown on every public page while simulation mode is on. The point is that the
 * numbers look real but are not: the banner is not optional, and turning the
 * mode off in the dashboard removes it immediately.
 */
export async function SimulationBanner() {
  const mode = await getDataMode();
  if (mode !== "simulation") return null;

  return (
    <div className="border-b border-[#6a4a12] bg-[#fdf3d8] text-[#6a4a12]">
      <div className="shell flex flex-wrap items-center justify-between gap-2 py-2 text-[10.5px] leading-relaxed">
        <p>
          <strong>Simulation.</strong> Every count, name and certificate on this site comes from a
          generated sample campaign. No real student is registered here.
        </p>
        <a href="/admin" className="font-semibold underline">
          Switch to live data
        </a>
      </div>
    </div>
  );
}
