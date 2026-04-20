interface Point {
  x: number;
  y: number;
  label: string;
}

interface Props {
  points: Point[];
  maxY: number;
  thresholds?: { value: number; tone: "sage" | "ocean" | "accent" }[];
  height?: number;
  color?: string;
}

const TONE_STROKE: Record<string, string> = {
  sage: "#5b6f4a",
  ocean: "#3a5a6e",
  accent: "#b94e2b",
};

export function TrendChart({
  points,
  maxY,
  thresholds = [],
  height = 120,
  color = "#b94e2b",
}: Props) {
  if (points.length === 0) return null;
  const w = 320;
  const h = height;
  const pad = { top: 8, right: 8, bottom: 20, left: 28 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const xs = points.map((_, i) => (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW));
  const ys = points.map((p) => innerH - (Math.min(p.y, maxY) / maxY) * innerH);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x + pad.left} ${ys[i] + pad.top}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Verlauf">
      {thresholds.map((t, i) => {
        const y = innerH - (t.value / maxY) * innerH + pad.top;
        return (
          <line
            key={i}
            x1={pad.left}
            x2={w - pad.right}
            y1={y}
            y2={y}
            stroke={TONE_STROKE[t.tone]}
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
        );
      })}

      <line
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={innerH + pad.top}
        stroke="#c9bda5"
        strokeWidth={1}
      />
      <line
        x1={pad.left}
        x2={w - pad.right}
        y1={innerH + pad.top}
        y2={innerH + pad.top}
        stroke="#c9bda5"
        strokeWidth={1}
      />

      <text x={4} y={pad.top + 4} fontSize="9" fill="#8a7f73">{maxY}</text>
      <text x={4} y={innerH + pad.top + 2} fontSize="9" fill="#8a7f73">0</text>

      {points.length > 1 && (
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      )}

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs[i] + pad.left} cy={ys[i] + pad.top} r={3} fill={color} />
          <text
            x={xs[i] + pad.left}
            y={h - 6}
            fontSize="9"
            textAnchor="middle"
            fill="#8a7f73"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
