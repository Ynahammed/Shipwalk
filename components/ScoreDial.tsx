export function ScoreDial({
  score,
  size = 88,
  stroke = 5,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2ddcf" strokeWidth={stroke} />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#ff4a00"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="display leading-none" style={{ fontSize: size * 0.33 }}>
          {score}
        </span>
      </span>
    </div>
  );
}
