import { useMemo } from "react";

const COLORS = ["#f6d98a", "#fff6d8", "#e4b24a", "#c44932", "#7dcea0", "#f3d17a"];

export function Burst() {
  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: 8 + Math.random() * 84,
        delay: Math.random() * 0.18,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 80 - 40,
        drift: (Math.random() * 80 - 40).toFixed(0),
      })),
    [],
  );

  return (
    <div className="burst" aria-hidden>
      {bits.map((bit) => (
        <i
          key={bit.id}
          style={{
            left: `${bit.left}%`,
            background: bit.color,
            animationDelay: `${bit.delay}s`,
            ["--rot" as string]: `${bit.rot}deg`,
            ["--drift" as string]: `${bit.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
