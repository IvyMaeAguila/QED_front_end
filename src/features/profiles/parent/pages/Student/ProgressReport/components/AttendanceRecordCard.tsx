import { Calendar } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import type { AttendanceQuarterEntry } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";


interface AttendanceRecordCardProps {
  record: AttendanceQuarterEntry | undefined;
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function AttendanceRecordCard({ record, theme, student }: AttendanceRecordCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const months = record?.months ?? [];

  const totals = months.reduce(
    (acc, m) => ({
      schoolDays: acc.schoolDays + m.schoolDays,
      present: acc.present + m.present,
      absent: acc.absent + m.absent,
      tardy: acc.tardy + m.tardy,
    }),
    { schoolDays: 0, present: 0, absent: 0, tardy: 0 },
  );

  const attendanceRate = totals.schoolDays > 0 ? Math.round((totals.present / totals.schoolDays) * 100) : 0;

  return (
    <div className={`rounded-2xl border ${panelBorder} ${panelBg} pb-5 px-5`}>
      <SectionHeader
        icon={Calendar}
        title="Summary of Attendance"
        about={`Provides a quick overview of ${student.firstName}'s attendance records, highlighting total present, absent, tardy, and excused days to help monitor consistency and participation.`}
        theme={theme}
      />


      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="flex-[2] overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/5" : "bg-[#F6F7FB]"}>
                <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase ${textMuted}`}>Month</th>
                <th className={`px-3 py-2 text-right text-[11px] font-semibold uppercase ${textMuted}`}>School Days</th>
                <th className={`px-3 py-2 text-right text-[11px] font-semibold uppercase ${textMuted}`}>Present</th>
                <th className={`px-3 py-2 text-right text-[11px] font-semibold uppercase ${textMuted}`}>Absent</th>
                <th className={`px-3 py-2 text-right text-[11px] font-semibold uppercase ${textMuted}`}>Tardy</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className={`border-t ${panelBorder}`}>
                  <td className={`px-3 py-2.5 font-semibold ${textPrimary}`}>{m.month}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{m.schoolDays}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{m.present}</td>
                  <td className={`px-3 py-2.5 text-right ${m.absent > 0 ? "text-red-500" : textPrimary}`}>{m.absent}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{m.tardy}</td>
                </tr>
              ))}
              <tr className="border-t border-[#8B0D0D]/30 bg-[#8B0D0D]/5 font-bold">
                <td className="px-3 py-2.5 text-[#8B0D0D]">Total</td>
                <td className="px-3 py-2.5 text-right text-[#8B0D0D]">{totals.schoolDays}</td>
                <td className="px-3 py-2.5 text-right text-[#8B0D0D]">{totals.present}</td>
                <td className="px-3 py-2.5 text-right text-[#8B0D0D]">{totals.absent}</td>
                <td className="px-3 py-2.5 text-right text-[#8B0D0D]">{totals.tardy}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className={`rounded-xl border ${panelBorder} p-4`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${textMuted}`}>Attendance Rate</p>
            <p className="mt-1 text-2xl font-bold text-[#8B0D0D]">{attendanceRate}%</p>
            <div className={`mt-2 h-2 w-full rounded-full ${darkMode ? "bg-white/10" : "bg-[#F1F2F4]"}`}>
              <div className="h-2 rounded-full bg-[#8B0D0D]" style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-[10px] font-semibold uppercase ${textMuted}`}>Absences</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{totals.absent}</p>
            </div>
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-[10px] font-semibold uppercase ${textMuted}`}>Tardiness</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{totals.tardy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}