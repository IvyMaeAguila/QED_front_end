// [points, darkFill, lightFill]
const POLYGONS: [string, string, string][] = [
  ["0,0 200,0 100,150", "#201311", "#FFFFFF"],
  ["200,0 400,0 250,120 100,150", "#241613", "#F9FAFB"],
  ["400,0 600,0 500,160 250,120", "#271916", "#F3F4F6"],
  ["600,0 800,0 700,130 500,160", "#201311", "#FFFFFF"],
  ["800,0 1000,0 900,170 700,130", "#241613", "#F9FAFB"],
  ["1000,0 1200,0 1200,150 900,170", "#271916", "#F3F4F6"],

  ["0,0 100,150 0,300", "#271916", "#F3F4F6"],
  ["100,150 250,120 300,280 0,300", "#1D1210", "#E5E7EB"],
  ["250,120 500,160 400,320 300,280", "#201311", "#FFFFFF"],
  ["500,160 700,130 650,290 400,320", "#241613", "#F9FAFB"],
  ["700,130 900,170 850,310 650,290", "#271916", "#F3F4F6"],
  ["900,170 1200,150 1200,350 850,310", "#1D1210", "#E5E7EB"],

  ["0,300 300,280 150,500 0,550", "#201311", "#FFFFFF"],
  ["300,280 400,320 450,480 150,500", "#241613", "#F9FAFB"],
  ["400,320 650,290 600,520 450,480", "#271916", "#F3F4F6"],
  ["650,290 850,310 800,490 600,520", "#201311", "#FFFFFF"],
  ["850,310 1200,350 1200,550 800,490", "#241613", "#F9FAFB"],

  ["0,550 150,500 300,680 0,800", "#1D1210", "#E5E7EB"],
  ["150,500 450,480 500,700 300,680", "#201311", "#FFFFFF"],
  ["450,480 600,520 700,660 500,700", "#241613", "#F9FAFB"],
  ["600,520 800,490 900,680 700,660", "#271916", "#F3F4F6"],
  ["800,490 1200,550 1200,800 900,680", "#1D1210", "#E5E7EB"],
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
      <div className={`absolute inset-0 ${darkMode ? "bg-[#1A1110]" : "bg-[#F3F4F6]"}`} />

      <div className="absolute inset-0 opacity-55">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          <g stroke={darkMode ? "#452C27" : "#D1D5DB"} strokeWidth="1" opacity="0.86">
            {POLYGONS.map(([points, dark, light]) => (
              <polygon key={points} points={points} fill={darkMode ? dark : light} />
            ))}
          </g>
        </svg>
      </div>

      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-linear-to-tr from-[#1A1110]/55 via-transparent to-[#1A1110]/55"
            : "bg-linear-to-tr from-[#F3F4F6]/45 via-transparent to-[#F3F4F6]/45"
        }`}
      />
    </div>
  );
}
