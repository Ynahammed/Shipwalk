import type { PacePoint } from "@/lib/types";

export function PaceChart({
  pace,
  todayIndex = pace.length - 1,
}: {
  pace: PacePoint[];
  todayIndex?: number;
}) {
  const width = 660;
  const height = 260;
  const padding = { top: 18, right: 16, bottom: 34, left: 38 };
  const max = Math.max(500, ...pace.map((point) => Math.max(point.cumulative, point.target)));
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const x = (index: number) =>
    padding.left + (index * innerWidth) / Math.max(1, pace.length - 1);
  const y = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;

  const actual = pace
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.cumulative)}`)
    .join(" ");
  const target = pace
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.target)}`)
    .join(" ");
  const area = `${actual} L${x(pace.length - 1)},${padding.top + innerHeight} L${x(0)},${
    padding.top + innerHeight
  } Z`;

  const gridValues = [0, 125, 250, 375, 500];
  const dayIndex = Math.max(0, Math.min(pace.length - 1, todayIndex));
  const today = pace[dayIndex];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.1em] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-ink" /> Registrations
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t border-dashed border-accent" /> 500 plan
        </span>
        <span className="ml-auto normal-case tracking-normal text-ink-faint">
          Today: <strong className="text-ink">{today?.count ?? 0}</strong> signups
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label="Cumulative registrations against the 500 registration plan"
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(value)}
              y2={y(value)}
              stroke="#e4dfd1"
              strokeWidth="1"
            />
            <text x={padding.left - 8} y={y(value) + 3} textAnchor="end" fontSize="9" fill="#8b8b7c">
              {value}
            </text>
          </g>
        ))}

        <path d={area} fill="#ff4a00" opacity="0.08" />
        <path d={target} fill="none" stroke="#ff4a00" strokeWidth="1.5" strokeDasharray="5 5" />
        <path d={actual} fill="none" stroke="#161710" strokeWidth="2.4" strokeLinejoin="round" />

        {pace.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={x(index)}
              cy={y(point.cumulative)}
              r={index === dayIndex ? 4.5 : 2.8}
              fill={index === dayIndex ? "#ff4a00" : "#161710"}
              stroke="#fffdf7"
              strokeWidth="1.5"
            />
            <text
              x={x(index)}
              y={height - 14}
              textAnchor="middle"
              fontSize="9"
              fill="#8b8b7c"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-2.5 text-[10px] text-ink-faint">
        <span>
          {today?.cumulative ?? 0} of 500 seats · {Math.round(((today?.cumulative ?? 0) / 500) * 100)}%
        </span>
        <span>Plan target today: {today?.target ?? 500}</span>
      </div>
    </div>
  );
}
