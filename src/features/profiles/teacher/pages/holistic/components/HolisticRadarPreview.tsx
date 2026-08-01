import { HOLISTIC_AXES, getRatingLevel, type HolisticAxisKey } from "../types/Holistic";

interface HolisticRadarPreviewProps {
  scores: Record<HolisticAxisKey, number | null>;
  darkMode: boolean;
}

export function HolisticRadarPreview({ scores, darkMode }: HolisticRadarPreviewProps) {
  const size = 240;
  const center = size / 2;
  const maxRadius = 84;
  const angles = [-90, 0, 90, 180]; // cognitive, emotional, social, behavioral (top/right/bottom/left)
  const hasAnyScore = HOLISTIC_AXES.some((a) => scores[a.key] !== null);
  const fallbackFraction = 0.42;

  const pointAt = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const valuePoints = HOLISTIC_AXES.map((axis, i) => {
    const score = scores[axis.key];
    const fraction = score !== null ? score / 5 : fallbackFraction;
    return pointAt(angles[i], maxRadius * fraction);
  });
  const valuePath = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const ringFractions = [0.33, 0.66, 1];
  const gridColor = darkMode ? "#334155" : "#E2E8F0";
  const labelColor = darkMode ? "#94A3B8" : "#6B0000";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringFractions.map((f) => (
          <polygon
            key={f}
            points={angles.map((a) => {
              const p = pointAt(a, maxRadius * f);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {angles.map((a, i) => {
          const p = pointAt(a, maxRadius);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth={1} />;
        })}
        <polygon
          points={valuePath}
          fill={hasAnyScore ? "#6B0000" : "#94A3B8"}
          fillOpacity={hasAnyScore ? 0.35 : 0.25}
          stroke={hasAnyScore ? "#6B0000" : "#94A3B8"}
          strokeWidth={2}
          strokeDasharray={hasAnyScore ? undefined : "4 3"}
        />
        {valuePoints.map((p, i) => {
          const score = scores[HOLISTIC_AXES[i].key];
          const level = getRatingLevel(score);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={level ? level.color : "#94A3B8"} />;
        })}
        {HOLISTIC_AXES.map((axis, i) => {
          const p = pointAt(angles[i], maxRadius + 22);
          return (
            <text
              key={axis.key}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight={700}
              fill={labelColor}
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
      {!hasAnyScore && (
        <p className={`text-[11px] font-semibold mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Rate each axis to build the profile
        </p>
      )}
    </div>
  );
}