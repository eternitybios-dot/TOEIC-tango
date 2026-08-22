export function ProgressBar({ value, max = 100, tone = "gold" }: { value: number; max?: number; tone?: "gold" | "green" }) {
  const pct = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className={`bar tone-${tone}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
