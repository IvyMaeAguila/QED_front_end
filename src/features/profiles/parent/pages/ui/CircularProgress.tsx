interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  label?: string;
  sublabel?: string;
  darkMode?: boolean;
}

// Reusable SVG ring — used for attendance rate on the student card today,
// and can back any other percentage metric (e.g. grade completion) later.
export default function CircularProgress({
  value,
  size = 64,
  strokeWidth = 5,
  trackColor = "#efefef",
  progressColor = "#16a34a",
  label,
  sublabel,
  darkMode = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center leading-none">
        {label && (
          <span className={`text-sm font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className={`text-[9px] font-medium uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}