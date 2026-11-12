import type { ReactNode } from "react";
import { BarChart3, BookOpen } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import { EnrollmentBars } from "./EnrollmentBars";
import { AdminOverviewColumns, EnrollmentSkeleton } from "./AdminOverviewSkeleton";
import { Link } from "react-router-dom";
import { useClasses } from "../../classes/context/ClassesContext";
import type { AdminThemeContext } from "../../AdminLayout";

export function EnrollmentOverview({ theme, account, classOverview }: { theme: AdminThemeContext; account: ReactNode; classOverview: ReactNode }) {
  const { darkMode, panelBorder, textPrimary, textMuted } = theme;
  const { serverRows: classes, loading, error, refreshClasses } = useClasses();
  if (loading) return (
    <AdminOverviewColumns account={account} classes={classOverview}
      enrollment={<EnrollmentSkeleton theme={theme} />} rosters={<EnrollmentSkeleton theme={theme} roster />} />
  );

  const grades = new Map<number, { label: string; students: number }>();
  for (const item of classes) {
    const grade = grades.get(item.gradeLevelId) ?? { label: item.gradeLevel, students: 0 };
    grade.students += Number(item.studentCount) || 0;
    grades.set(item.gradeLevelId, grade);
  }
  const enrollment = [...grades.entries()].sort(([a], [b]) => a - b).map(([, grade]) => grade);
  const total = enrollment.reduce((sum, grade) => sum + grade.students, 0);
  if (error || !classes.length) return (
    <AdminOverviewColumns account={account} classes={classOverview} enrollment={<SectionCard {...theme} compact title="Class enrollment" icon={BarChart3}>
      {error ? <div role="alert" className={`mt-2 text-sm ${textMuted}`}>
        <p>{error}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={refreshClasses}>Retry</button>
      </div> : <p className={`mt-2 text-sm ${textMuted}`}>
        No classes are available for this school year.
      </p>}
    </SectionCard>} />
  );

  return (
    <AdminOverviewColumns account={account} classes={classOverview}
      enrollment={<section aria-label="Class enrollment by grade" className="min-w-0">
        <SectionCard {...theme} compact title="Class enrollment by grade" icon={BarChart3}
          action={<span className={`text-xs ${textMuted}`}>{total.toLocaleString()} total</span>}>
          <EnrollmentBars label="Students on class rosters by grade" textMuted={textMuted}
            bars={enrollment.map(grade => ({ key: grade.label, label: grade.label, shortLabel: grade.label, value: grade.students }))} />
        </SectionCard>
      </section>}
      rosters={<section aria-label="Class rosters" className="min-w-0">
        <SectionCard {...theme} compact title="Class rosters" icon={BookOpen}
          action={<Link to="/admin/classes" className={`qed-type-button shrink-0 rounded-lg border px-3 py-1.5 text-maroon ${panelBorder} hover:bg-maroon/5`}>View classes</Link>}>
        <div className={`overflow-x-auto rounded-lg border ${panelBorder}`}>
          <table className={`teacher-user-table w-full text-left text-sm ${textPrimary}`}>
            <thead className={`${darkMode ? "bg-white/5" : "bg-brand-light"} ${textMuted}`}>
              <tr>
                <th scope="col" className="qed-type-table-header px-3 py-2.5 sm:px-4">Class</th>
                <th scope="col" className="qed-type-table-header px-3 py-2.5">Adviser</th>
                <th scope="col" className="qed-type-table-header px-3 py-2.5 sm:px-4 text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(item => <tr key={item.id} className={`border-t ${panelBorder} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/[0.02]"}`}>
                <th scope="row" className="px-3 py-2.5 font-medium sm:px-4">
                  <Link className="text-maroon normal-case underline-offset-4 hover:underline focus-visible:underline" to={`/admin/classes/${item.id}`}>
                    {[item.gradeLevel, item.section].filter(Boolean).join(" · ")}
                  </Link>
                </th>
                <td className={`px-3 py-2.5 ${textMuted}`}>{item.adviserName?.trim() || "Unassigned"}</td>
                <td className="px-3 py-2.5 sm:px-4 text-right font-semibold tabular-nums">{(Number(item.studentCount) || 0).toLocaleString()}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        </SectionCard>
      </section>}
    />
  );
}
