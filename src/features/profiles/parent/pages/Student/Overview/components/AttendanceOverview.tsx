import { useMemo, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import SectionHeader from "../../../ui/SectionHeader";
import StatBox from "../components/StatBox";
import { COLORS, SCHOOL_YEAR_MONTHS } from "../utils/constants";
import { countSchoolDays, currentMonthKey } from "../utils/utils";
import { MOCK_ATTENDANCE_BY_MONTH } from "../data/mockData";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout"; // adjust path as needed

interface AttendanceOverviewProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function AttendanceOverview({
  student,
  theme,
}: AttendanceOverviewProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const schoolDays = useMemo(() => countSchoolDays(monthKey), [monthKey]);
  const tally = MOCK_ATTENDANCE_BY_MONTH[monthKey] ?? {
    present: 0,
    absent: 0,
    late: 0,
  };
  const monthLabel = SCHOOL_YEAR_MONTHS.find((m) => m.key === monthKey)?.label;

  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm pt-2 ${panelBg}`}>
      <SectionHeader
        icon={Calendar}
        title="Attendance Overview"
        about={`Shows ${student.firstName}'s daily attendance record for the selected month, so you can see how many school days were present, late, or absent out of the total school days that month.`}
        theme={theme}
      />
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <select
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-semibold focus:outline-none ${panelBorder} ${panelBg} ${textPrimary}`}
            >
              {SCHOOL_YEAR_MONTHS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`}
            />
          </div>
          <span className={`text-[11px] font-medium ${textMuted}`}>
            {schoolDays} school days in {monthLabel}
          </span>
        </div>

        <div className="flex gap-3">
          <StatBox
            label="PRESENT"
            value={tally.present}
            color={COLORS.present}
            theme={theme}
          />
          <StatBox
            label="ABSENT"
            value={tally.absent}
            color={COLORS.absent}
            theme={theme}
          />
          <StatBox
            label="LATE"
            value={tally.late}
            color={COLORS.late}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
