import { LoadingTable } from "@shared/loading/LoadingTable";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { skeletonRows } from "@shared/loading/reservations";
import { Calendar } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import type { AttendanceTermEntry } from "../types/types";
import SectionHeader from "../../../ui/SectionHeader";
import type { DetailStudent } from "../../GlobalTypes/types";


interface AttendanceRecordCardProps {
  record: AttendanceTermEntry | undefined;
  loading?: boolean;
  theme: AdminThemeContext;
  student: DetailStudent;
}

export function AttendanceRecordCard({ record, theme, student, loading = false }: AttendanceRecordCardProps) {
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

  // const attendanceRate = totals.schoolDays > 0 ? Math.round((totals.present / totals.schoolDays) * 100) : 0;

  const view = `parent-report-attendance:${student.id}`;
  const renderRow = (m:NonNullable<AttendanceTermEntry["months"]>[number],index:number,pending:boolean) => (
                <tr key={m.month} className={`border-t ${panelBorder}`}>
                  <td className={`px-3 py-2.5 font-semibold ${textPrimary}`}>{pending ? <SkeletonParagraph field={view+":month:"+index} typical={2} width="100%" /> : <span data-sk-field={view+":month:"+index}>{m.month}</span>}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{pending ? <SkeletonText width="2ch" /> : m.schoolDays}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{pending ? <SkeletonText width="2ch" /> : m.present}</td>
                  <td className={`px-3 py-2.5 text-right ${m.absent > 0 ? "text-red-500" : textPrimary}`}>{pending ? <SkeletonText width="2ch" /> : m.absent}</td>
                  <td className={`px-3 py-2.5 text-right ${textPrimary}`}>{pending ? <SkeletonText width="2ch" /> : m.tardy}</td>
                </tr>
  );
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
          <LoadingTable name="parent-report-attendance-table" view={view} loading={loading} count={months.length} columns={['Month','School Days','Present','Absent','Tardy'].map(label=>({label,typical:label==='Month'?'September':'20'}))} className="teacher-user-table w-full min-w-[420px] border-collapse text-sm" header={<thead>
              <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${textMuted}`}>Month</th>
                <th className={`px-3 py-2 text-right text-xs font-semibold uppercase ${textMuted}`}>School Days</th>
                <th className={`px-3 py-2 text-right text-xs font-semibold uppercase ${textMuted}`}>Present</th>
                <th className={`px-3 py-2 text-right text-xs font-semibold uppercase ${textMuted}`}>Absent</th>
                <th className={`px-3 py-2 text-right text-xs font-semibold uppercase ${textMuted}`}>Tardy</th>
              </tr>
            </thead>} skeleton={Array.from({length:skeletonRows(view)},(_,i)=>renderRow({month:String(i),schoolDays:0,present:0,absent:0,tardy:0,excused:0},i,true))}>{months.map((m,i)=>renderRow(m,i,false))}</LoadingTable>   </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-xs font-semibold uppercase ${textMuted}`}>Total School Days</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{loading ? <SkeletonText width="2ch" /> : totals.schoolDays}</p>
            </div>
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-xs font-semibold uppercase ${textMuted}`}>Present</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{loading ? <SkeletonText width="2ch" /> : totals.present}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-xs font-semibold uppercase ${textMuted}`}>Absences</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{loading ? <SkeletonText width="2ch" /> : totals.absent}</p>
            </div>
            <div className={`rounded-xl border ${panelBorder} p-3 text-center`}>
              <p className={`text-xs font-semibold uppercase ${textMuted}`}>Tardiness</p>
              <p className={`mt-1 text-lg font-bold ${textPrimary}`}>{loading ? <SkeletonText width="2ch" /> : totals.tardy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}