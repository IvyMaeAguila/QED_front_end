import { ClipboardCheck } from "lucide-react";

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

  const groups = [
    {
      key: "present",
      count: present,
      label: "PRESENT",
      solid: "#48BB78",
      text: darkMode ? "#86D989" : "#1F5C22",
    },
    {
      key: "absent",
      count: absent,
      label: "ABSENT",
      solid: "#F56565",
      text: darkMode ? "#F7A0A0" : "#7A1010",
    },
    {
      key: "late",
      count: late,
      label: "LATE",
      solid: "#ED8936",
      text: darkMode ? "#F8C97C" : "#7A4A10",
    },
  ];

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${panelBg} ${panelBorder}`}
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

      <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {groups.map((g) => (
          <div
            key={g.key}
            className={`rounded-2xl p-6 border text-center transition-colors ${panelBorder}`}
            style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2"
              style={{ color: g.text }}
            >
              {g.label}
            </p>
            <p className={`text-4xl font-black ${textPrimary}`}>
              {String(g.count).padStart(2, "0")}
            </p>
            <div
              className="mt-3 w-full h-1 rounded-full overflow-hidden"
              style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}
            >
              <div
                className="h-full"
                style={{ width: `${Math.round((g.count / total) * 100)}%`, background: g.solid }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}