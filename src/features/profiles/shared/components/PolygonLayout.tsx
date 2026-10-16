// [points, darkFill, lightFill]
const POLYGONS: [string, string, string][] = [
  ["0,0 200,0 100,150", "var(--surface-card-dark)", "#FFFFFF"],
  ["200,0 400,0 250,120 100,150", "var(--surface-raised-dark)", "var(--brand-light)"],
  ["400,0 600,0 500,160 250,120", "var(--surface-raised-dark)", "var(--surface-page)"],
  ["600,0 800,0 700,130 500,160", "var(--surface-card-dark)", "#FFFFFF"],
  ["800,0 1000,0 900,170 700,130", "var(--surface-raised-dark)", "var(--brand-light)"],
  ["1000,0 1200,0 1200,150 900,170", "var(--surface-raised-dark)", "var(--surface-page)"],

  ["0,0 100,150 0,300", "var(--surface-raised-dark)", "var(--surface-page)"],
  ["100,150 250,120 300,280 0,300", "var(--surface-page-dark)", "var(--border-subtle)"],
  ["250,120 500,160 400,320 300,280", "var(--surface-card-dark)", "#FFFFFF"],
  ["500,160 700,130 650,290 400,320", "var(--surface-raised-dark)", "var(--brand-light)"],
  ["700,130 900,170 850,310 650,290", "var(--surface-raised-dark)", "var(--surface-page)"],
  ["900,170 1200,150 1200,350 850,310", "var(--surface-page-dark)", "var(--border-subtle)"],

  ["0,300 300,280 150,500 0,550", "var(--surface-card-dark)", "#FFFFFF"],
  ["300,280 400,320 450,480 150,500", "var(--surface-raised-dark)", "var(--brand-light)"],
  ["400,320 650,290 600,520 450,480", "var(--surface-raised-dark)", "var(--surface-page)"],
  ["650,290 850,310 800,490 600,520", "var(--surface-card-dark)", "#FFFFFF"],
  ["850,310 1200,350 1200,550 800,490", "var(--surface-raised-dark)", "var(--brand-light)"],

  ["0,550 150,500 300,680 0,800", "var(--surface-page-dark)", "var(--border-subtle)"],
  ["150,500 450,480 500,700 300,680", "var(--surface-card-dark)", "#FFFFFF"],
  ["450,480 600,520 700,660 500,700", "var(--surface-raised-dark)", "var(--brand-light)"],
  ["600,520 800,490 900,680 700,660", "var(--surface-raised-dark)", "var(--surface-page)"],
  ["800,490 1200,550 1200,800 900,680", "var(--surface-page-dark)", "var(--border-subtle)"],
];

interface PolygonBackdropProps {
  darkMode: boolean;
}

/**
 * Low-poly faceted backdrop. Place it inside a `relative` container,
 * and give the content above it `relative z-10`.
 */
export function PolygonBackdrop({ darkMode }: PolygonBackdropProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className={`absolute inset-0 ${darkMode ? "bg-page-dark" : "bg-surface"}`} />

      <div className="absolute inset-0 opacity-55">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          <g stroke={darkMode ? "var(--border-subtle-dark)" : "#D1D5DB"} strokeWidth="1" opacity="0.86">
            {POLYGONS.map(([points, dark, light]) => (
              <polygon key={points} points={points} fill={darkMode ? dark : light} />
            ))}
          </g>
        </svg>
      </div>

      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-page-dark/55"
            : "bg-surface/45"
        }`}
      />
    </div>
  );
}
