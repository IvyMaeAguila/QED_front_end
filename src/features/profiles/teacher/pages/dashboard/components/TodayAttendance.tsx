import { ClipboardCheck, UserCheck, UserX, Clock3 } from "lucide-react";

interface TodayAttendanceProps {
  present: number;
  absent: number;
  late: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  darkMode: boolean;
  onViewFull?: () => void;
}

export function TodayAttendance({
  present,
  absent,
  late,
  panelBg,
  panelBorder,
  textPrimary,
  darkMode,
  onViewFull,
}: TodayAttendanceProps) {
  const total = Math.max(1, present + absent + late);
  const rate = Math.round((present / total) * 100);

  const groups = [
    {
      key: "present",
      count: present,
      label: "Present",
      Icon: UserCheck,
      solid: "#48BB78",
      soft: darkMode ? "rgba(72,187,120,0.15)" : "#EAFAF0",
      text: darkMode ? "#86D989" : "#1F5C22",
    },
    {
      key: "late",
      count: late,
      label: "Late",
      Icon: Clock3,
      solid: "#ED8936",
      soft: darkMode ? "rgba(237,137,54,0.15)" : "#FFF4E9",
      text: darkMode ? "#F8C97C" : "#7A4A10",
    },
    {
      key: "absent",
      count: absent,
      label: "Absent",
      Icon: UserX,
      solid: "#F56565",
      soft: darkMode ? "rgba(245,101,101,0.15)" : "#FDECEC",
      text: darkMode ? "#F7A0A0" : "#7A1010",
    },
  ];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;
  const segments = groups.map((g) => {
    const fraction = g.count / total;
    const dash = fraction * circumference;
    const offset = -cursor;
    cursor += dash;
    return { ...g, dash, offset };
  });

  return (
    <div
      className={`h-full flex flex-col rounded-2xl border overflow-hidden ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <div className={`px-8 py-6 border-b flex items-center justify-between ${panelBorder}`}>
        <div className="flex items-center gap-3">
          <ClipboardCheck size={18} style={{ color: "#8B0D0D" }} />
          <h2 className={`text-[15px] font-bold ${textPrimary}`}>Today&apos;s Attendance</h2>
        </div>
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs font-bold uppercase tracking-wider hover:underline"
            style={{ color: "#8B0D0D" }}
          >
            Full Report
          </button>
        )}
      </div>

      <div className="flex-1 p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Attendance ring */}
        <div className="relative shrink-0 w-42 h-42">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={darkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9"}
              strokeWidth="10"
            />
            {segments.map(
              (s) =>
                s.dash > 0 && (
                  <circle
                    key={s.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={s.solid}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                    strokeDashoffset={s.offset}
                    style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
                  />
                )
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${textPrimary}`}>{rate}%</span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
              style={{ color: darkMode ? "rgba(255,255,255,0.4)" : "#94A3B8" }}
            >
              Present rate
            </span>
          </div>
        </div>

        {/* Breakdown list */}
        <div className="flex-1 w-full flex flex-col gap-3">
          {groups.map((g) => {
            const pct = Math.round((g.count / total) * 100);
            return (
              <div
                key={g.key}
                className={`flex items-center gap-4 rounded-xl border p-3.5 transition-colors ${panelBorder}`}
                style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#FBFCFD" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: g.soft }}
                >
                  <g.Icon size={17} style={{ color: g.solid }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-[13px] font-bold ${textPrimary}`}>{g.label}</p>
                    <p className={`text-[15px] font-black shrink-0 ${textPrimary}`}>
                      {String(g.count).padStart(2, "0")}
                    </p>
                  </div>
                  <div
                    className="mt-1.5 w-full h-1 rounded-full overflow-hidden"
                    style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: g.solid, transition: "width 0.6s ease" }}
                    />
                  </div>
                </div>

                <span
                  className="text-[10.5px] font-bold shrink-0 w-9 text-right"
                  style={{ color: g.text }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}