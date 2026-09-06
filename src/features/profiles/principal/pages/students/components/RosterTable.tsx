import type { Student } from "../data/types";
import { fullName } from "../utils/roster";

interface RosterTableProps {
  label: string;
  students: Student[];
  emptyLabel: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function RosterTable({ label, students, emptyLabel, panelBorder, textPrimary, textMuted }: RosterTableProps) {
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
              <th className={`py-2 pr-4 font-bold ${textMuted}`}>#</th>
              <th className={`py-2 pr-4 font-bold ${textMuted}`}>Student Name</th>
              <th className={`py-2 pr-4 font-bold ${textMuted}`}>Student ID</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.studentId} className={`border-b last:border-0 ${panelBorder}`}>
                <td className={`py-2.5 pr-4 ${textMuted}`}>{i + 1}</td>
                <td className={`py-2.5 pr-4 font-semibold ${textPrimary}`}>{fullName(s)}</td>
                <td className={`py-2.5 pr-4 ${textMuted}`}>{s.studentId}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className={`py-4 text-center ${textMuted}`}>
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
