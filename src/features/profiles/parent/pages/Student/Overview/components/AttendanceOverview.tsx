import { useMemo, useState } from "react";
import { Calendar, ChevronDown, UserCheck, UserX, Clock3 } from "lucide-react";
import { COLORS } from "../utils/constants";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout"; // adjust path as needed
import {
  AttendanceOverviewProvider,
  useAttendanceOverview,
} from "../context/AttendanceOverviewContext"; // adjust path as needed

interface AttendanceOverviewProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

type AttendanceKey = "present" | "late" | "absent";

// Public component — wraps the Provider so callers don't need to do it themselves
export default function AttendanceOverview({
  student,
  theme,
}: AttendanceOverviewProps) {
  return (
    <AttendanceOverviewProvider student={student}>
      <AttendanceOverviewContent theme={theme} />
    </AttendanceOverviewProvider>
  );
}

interface AttendanceOverviewContentProps {
  theme: AdminThemeContext;
}

interface AttendanceOverviewContextValue {
  year: string;
  month: string;
  setYear: (year: string) => void;
  setMonth: (month: string) => void;
  data?: {
    schoolDays?: number;
    statusSummary: {
      present?: number;
      absent?: number;
      late?: number;
    };
  };
  loading: boolean;
  error?: unknown;
  monthOptions: Array<{ key: string; label: string }>;
  monthsLoading: boolean;
}

function AttendanceOverviewContent({ theme }: AttendanceOverviewContentProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const {
    year,
    month,
    setYear,
    setMonth,
    data,
    loading,
    error,
    monthOptions,
    monthsLoading,
  } = useAttendanceOverview() as AttendanceOverviewContextValue;

  const [selectedKey, setSelectedKey] = useState<AttendanceKey>("present");

  const monthKey = year && month ? `${year}-${month}` : "";
  const schoolDays = data?.schoolDays ?? 0;
  const tally = {
    present: data?.statusSummary.present ?? 0,
    absent: data?.statusSummary.absent ?? 0,
    late: data?.statusSummary.late ?? 0,
  };
  const total = Math.max(1, tally.present + tally.absent + tally.late);
  const monthLabel = useMemo(
    () => monthOptions.find((m) => m.key === monthKey)?.label ?? "",
    [monthOptions, monthKey]
  );

  const handleMonthChange = (key: string) => {
    // key is "YYYY-MM"
    setYear(key.slice(0, 4));
    setMonth(key.slice(5, 7));
  };

  const groups = [
    {
      key: "present" as const,
      count: tally.present,
      label: "Present",
      Icon: UserCheck,
      solid: COLORS.present,
      soft: darkMode ? "rgba(72,187,120,0.15)" : "#EAFAF0",
      text: darkMode ? "#86D989" : "#1F5C22",
    },
    {
      key: "late" as const,
      count: tally.late,
      label: "Late",
      Icon: Clock3,
      solid: COLORS.late,
      soft: darkMode ? "rgba(237,137,54,0.15)" : "#FFF4E9",
      text: darkMode ? "#F8C97C" : "#7A4A10",
    },
    {
      key: "absent" as const,
      count: tally.absent,
      label: "Absent",
      Icon: UserX,
      solid: COLORS.absent,
      soft: darkMode ? "rgba(245,101,101,0.15)" : "#FDECEC",
      text: darkMode ? "#F7A0A0" : "#7A1010",
    },
  ];

  const selectedGroup = groups.find((g) => g.key === selectedKey) ?? groups[0];
  const selectedPct = Math.round((selectedGroup.count / total) * 100);

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
      style={{
        boxShadow:
          "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className={`px-8 py-6 border-b flex items-center justify-between gap-4 flex-wrap ${panelBorder}`}
      >
        <div className="flex items-center gap-3">
          <Calendar size={18} style={{ color: "#8B0D0D" }} />
          <div>
            <h2 className={`text-[15px] font-bold ${textPrimary}`}>
              Attendance Overview
            </h2>
            <p className={`text-[11px] font-medium ${textMuted}`}>
              {loading
                ? "Loading attendance..."
                : error
                ? "Failed to load attendance"
                : monthLabel
                ? `${schoolDays} school days in ${monthLabel}`
                : "Select a month"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month select — options galing na sa DB (grading_periods) */}
          <div className="relative">
            <select
              value={monthKey}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={monthsLoading || monthOptions.length === 0}
              className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-bold focus:outline-none disabled:opacity-60 ${panelBorder} ${panelBg} ${textPrimary}`}
            >
              {monthsLoading && <option>Loading...</option>}
              {!monthsLoading && monthOptions.length === 0 && (
                <option>No months available</option>
              )}
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`}
            />
          </div>
        </div>
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
                    style={{
                      opacity: s.key === selectedKey ? 1 : 0.25,
                      transition:
                        "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease, opacity 0.3s ease",
                    }}
                  />
                )
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-3xl font-black ${textPrimary}`}
              style={{ transition: "color 0.3s ease" }}
            >
              {loading ? "…" : `${selectedPct}%`}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
              style={{ color: darkMode ? "rgba(255,255,255,0.4)" : "#94A3B8" }}
            >
              {selectedGroup.label} rate
            </span>
          </div>
        </div>

        {/* Breakdown list */}
        <div className="flex-1 w-full flex flex-col gap-3">
          {groups.map((g) => {
            const pct = Math.round((g.count / total) * 100);
            const isSelected = g.key === selectedKey;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setSelectedKey(g.key)}
                className={`flex items-center gap-4 rounded-xl border p-3.5 text-left transition-all ${panelBorder}`}
                style={{
                  background: isSelected
                    ? g.soft
                    : darkMode
                    ? "rgba(255,255,255,0.02)"
                    : "#FBFCFD",
                  borderColor: isSelected ? g.solid : undefined,
                  boxShadow: isSelected ? `0 0 0 1px ${g.solid}` : undefined,
                }}
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
                      {loading ? "…" : String(g.count)}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}