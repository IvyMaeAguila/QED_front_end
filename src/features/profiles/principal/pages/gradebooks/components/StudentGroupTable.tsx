import type { Student } from "../data/types";
import { averageColorVar, computeAverage, fullName } from "../utils/gradeSheetUtils";

interface StudentGroupTableProps {
  label: string;
  students: Student[];
  subjects: string[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function StudentGroupTable({
  label,
  students,
  subjects,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: StudentGroupTableProps) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${textMuted}`}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-maroon" />
        {label} ({students.length})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left border-b ${panelBorder}`}>
              <th className={`py-2 pr-4 font-bold sticky left-0 ${panelBg} ${textMuted}`}>Student Name</th>
              {subjects.map((subj) => (
                <th key={subj} className={`py-2 px-3 font-bold text-center whitespace-nowrap ${textMuted}`}>
                  {subj}
                </th>
              ))}
              <th className={`py-2 pl-3 font-bold text-center ${textMuted}`}>Average</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const avg = computeAverage(s.grades, subjects);
              return (
                <tr key={s.studentId} className={`border-b last:border-0 ${panelBorder}`}>
                  <td className={`py-2.5 pr-4 whitespace-nowrap font-semibold sticky left-0 ${panelBg} ${textPrimary}`}>
                    {fullName(s)}
                  </td>
                  {subjects.map((subj) => (
                    <td key={subj} className={`py-2.5 px-3 text-center ${textPrimary}`}>
                      {s.grades[subj] ?? "—"}
                    </td>
                  ))}
                  <td className="py-2.5 pl-3 text-center font-black tabular-nums" style={{ color: averageColorVar(avg) }}>
                    {avg}
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={subjects.length + 2} className={`py-4 text-center ${textMuted}`}>
                  No students.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
