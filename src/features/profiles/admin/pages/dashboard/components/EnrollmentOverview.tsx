import { Link } from "react-router-dom";
import { useClasses } from "../../classes/context/ClassesContext";
import type { AdminThemeContext } from "../../AdminLayout";

export function EnrollmentOverview({ panelBg, panelBorder, textPrimary, textMuted }: AdminThemeContext) {
  const { serverRows: classes, loading, error, refreshClasses } = useClasses();
  const grades = new Map<number, { label: string; students: number }>();
  for (const item of classes) {
    const grade = grades.get(item.gradeLevelId) ?? { label: item.gradeLevel, students: 0 };
    grade.students += Number(item.studentCount) || 0;
    grades.set(item.gradeLevelId, grade);
  }
  const enrollment = [...grades.entries()].sort(([a], [b]) => a - b).map(([, grade]) => grade);
  const peak = Math.max(1, ...enrollment.map(grade => grade.students));
  const panel = `min-w-0 overflow-hidden rounded-xl border shadow-sm ${panelBg} ${panelBorder} ${textPrimary}`;

  if (loading || error || !classes.length) return (
    <section className={`${panel} px-5 py-4`}>
      <h2 className="font-bold">Class enrollment</h2>
      {error ? <div role="alert" className={`mt-2 text-sm ${textMuted}`}>
        <p>{error}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={refreshClasses}>Retry</button>
      </div> : <p role={loading ? "status" : undefined} className={`mt-2 text-sm ${textMuted}`}>
        {loading ? "Loading class enrollment…" : "No classes are available for this school year."}
      </p>}
    </section>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label="Class enrollment by grade" className={panel}>
        <div className={`border-b px-5 py-4 ${panelBorder}`}>
          <h2 className="font-bold">Class enrollment by grade</h2>
          <p className={`mt-1 text-sm ${textMuted}`}>Students on class rosters</p>
        </div>
        <ul className="space-y-3 px-5 py-4">
          {enrollment.map(grade => <li key={grade.label} className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
            <span className={textMuted}>{grade.label}</span>
            <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-maroon/10 dark:bg-white/10">
              <div className="h-full rounded-full bg-maroon dark:bg-maroon-light" style={{ width: `${grade.students / peak * 100}%` }} />
            </div>
            <span className="text-right font-semibold tabular-nums">{grade.students.toLocaleString()}</span>
          </li>)}
        </ul>
      </section>
      <section aria-label="Class rosters" className={panel}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 ${panelBorder}`}>
          <h2 className="font-bold">Class rosters</h2>
          <Link to="/admin/classes" className="text-sm font-semibold underline-offset-4 hover:underline">View classes</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={textMuted}>
              <tr>
                <th scope="col" className="px-5 py-2.5">Class</th>
                <th scope="col" className="px-3 py-2.5">Adviser</th>
                <th scope="col" className="px-5 py-2.5 text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(item => <tr key={item.id} className={`border-t ${panelBorder}`}>
                <th scope="row" className="px-5 py-2.5 font-medium">
                  <Link className="underline-offset-4 hover:underline" to={`/admin/classes/${item.id}`}>
                    {[item.gradeLevel, item.section].filter(Boolean).join(" · ")}
                  </Link>
                </th>
                <td className={`px-3 py-2.5 ${textMuted}`}>{item.adviserName?.trim() || "Unassigned"}</td>
                <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{(Number(item.studentCount) || 0).toLocaleString()}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
