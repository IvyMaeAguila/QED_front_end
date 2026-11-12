import { BarChart3, BookOpen } from "lucide-react";
import { ProgressBar, SectionCard } from "../../../../shared/components/DashboardUI";
import { Link } from "react-router-dom";
import { useClasses } from "../../classes/context/ClassesContext";
import type { AdminThemeContext } from "../../AdminLayout";

export function EnrollmentOverview(theme: AdminThemeContext) {
  const { darkMode, panelBorder, textPrimary, textMuted } = theme;
  const { serverRows: classes, loading, error, refreshClasses } = useClasses();
  const grades = new Map<number, { label: string; students: number }>();
  for (const item of classes) {
    const grade = grades.get(item.gradeLevelId) ?? { label: item.gradeLevel, students: 0 };
    grade.students += Number(item.studentCount) || 0;
    grades.set(item.gradeLevelId, grade);
  }
  const enrollment = [...grades.entries()].sort(([a], [b]) => a - b).map(([, grade]) => grade);
  const peak = Math.max(1, ...enrollment.map(grade => grade.students));
  if (loading || error || !classes.length) return (
    <SectionCard {...theme} compact title="Class enrollment" icon={BarChart3}>
      {error ? <div role="alert" className={`mt-2 text-sm ${textMuted}`}>
        <p>{error}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={refreshClasses}>Retry</button>
      </div> : <p role={loading ? "status" : undefined} className={`mt-2 text-sm ${textMuted}`}>
        {loading ? "Loading class enrollment…" : "No classes are available for this school year."}
      </p>}
    </SectionCard>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label="Class enrollment by grade" className="min-w-0">
        <SectionCard {...theme} compact title="Class enrollment by grade" icon={BarChart3}>
        <p className={`qed-type-metadata mb-4 ${textMuted}`}>Students on class rosters</p>
        <ul className="space-y-4">
          {enrollment.map(grade => <li key={grade.label} className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
            <span className={textMuted}>{grade.label}</span>
            <div aria-hidden="true">
              <ProgressBar value={grade.students / peak * 100} darkMode={darkMode} />
            </div>
            <span className="text-right font-semibold tabular-nums">{grade.students.toLocaleString()}</span>
          </li>)}
        </ul>
        </SectionCard>
      </section>
      <section aria-label="Class rosters" className="min-w-0">
        <SectionCard {...theme} compact title="Class rosters" icon={BookOpen}
          action={<Link to="/admin/classes" className={`qed-type-button shrink-0 rounded-lg border px-3 py-2 ${panelBorder} ${textPrimary} hover:bg-maroon/5`}>View classes</Link>}>
        <div className={`overflow-x-auto rounded-lg border ${panelBorder}`}>
          <table className={`teacher-user-table w-full text-left text-sm ${textPrimary}`}>
            <thead className={`${darkMode ? "bg-white/5" : "bg-brand-light"} ${textMuted}`}>
              <tr>
                <th scope="col" className="qed-type-table-header px-5 py-2.5">Class</th>
                <th scope="col" className="qed-type-table-header px-3 py-2.5">Adviser</th>
                <th scope="col" className="qed-type-table-header px-5 py-2.5 text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(item => <tr key={item.id} className={`border-t ${panelBorder} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/[0.02]"}`}>
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
        </SectionCard>
      </section>
    </div>
  );
}
