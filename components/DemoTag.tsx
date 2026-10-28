export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`tag tag-demo !px-1.5 !py-0.5 !text-[9px] ${className}`}
      title="Seeded demo record, not a real registration"
    >
      DEMO
    </span>
  );
}
