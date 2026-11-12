import { BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useLoadingOutletContext } from "@shared/loading/RoutePreview";
import { ProgressBar, SectionCard } from "../../../../shared/components/DashboardUI";
import { useClasses } from "../../classes/context/ClassesContext";
import { useUsers } from "../../usermanagement/context/UsersContext";
import { ROLE_LABELS } from "../../usermanagement/types/user";
import type { AdminThemeContext } from "../../AdminLayout";
import { DashboardSkeletonRows } from "./AdminOverviewSkeleton";
import { EnrollmentBars } from "./EnrollmentBars";
import { EnrollmentOverview } from "./EnrollmentOverview";

const accountRoles = [
  { role: "TEACHER", color: "var(--chart-primary)" },
  { role: "PARENT", color: "color-mix(in srgb, var(--chart-primary) 62%, transparent)" },
  { role: "ADMIN", color: "currentColor" },
  { role: "PRINCIPAL", color: "color-mix(in srgb, var(--chart-primary) 30%, transparent)" },
] as const;

export function AdminOverview() {
  const theme = useLoadingOutletContext<AdminThemeContext>();
  const { users, loading: usersLoading, error: usersError, forbidden, refetchUsers } = useUsers();
  const { serverRows: classes, loading: classesLoading, error: classesError, refreshClasses } = useClasses();
  const active = users.filter(user => user.status === "Active").length;
  const inactive = users.filter(user => user.status === "Inactive").length;
  const accounts = accountRoles.map(({ role, color }) => ({
    label: ROLE_LABELS[role], color, value: users.filter(user => user.role === role).length,
  }));
  const rosterCounts = classes.map(item => ({
    key: item.id,
    label: [item.gradeLevel, item.section].filter(Boolean).join(" · "),
    shortLabel: [item.gradeLevel.replace(/^Grade\s+/i, "G"), item.section?.trim().charAt(0)].filter(Boolean).join(" · "),
    value: Number(item.studentCount) || 0,
  }));
  const assigned = classes.filter(item => Number(item.adviserId) > 0).length;
  const coverage = classes.length ? assigned / classes.length * 100 : 0;

  return (
    <EnrollmentOverview theme={theme}
      account={<OverviewPanel theme={theme} icon={Users} title="Account overview" loading={usersLoading}
          error={usersError ?? (forbidden ? "Account data is unavailable." : null)} retry={refetchUsers}
          to="/admin/users" action="Manage users">
          <AccountBreakdown accounts={accounts} theme={theme} />
          <dl className={`mt-4 grid grid-cols-2 divide-x divide-current/20 border-t pt-3 text-sm ${theme.panelBorder} ${theme.textMuted}`}>
            <div className="pr-3">
              <dt>Active accounts</dt>
              <dd className={`mt-0.5 font-semibold tabular-nums ${theme.textPrimary}`}>{active.toLocaleString()}</dd>
            </div>
            <div className="pl-3">
              <dt>Inactive accounts</dt>
              <dd className={`mt-0.5 font-semibold tabular-nums ${theme.textPrimary}`}>{inactive.toLocaleString()}</dd>
            </div>
          </dl>
        </OverviewPanel>}
      classOverview={<OverviewPanel theme={theme} icon={BookOpen} title="Class overview" loading={classesLoading}
          error={classesError} retry={refreshClasses} to="/admin/classes" action="Manage classes">
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Classes", value: classes.length },
              { label: "Grade levels", value: new Set(classes.map(item => item.gradeLevelId)).size },
              { label: "Students on rosters", value: rosterCounts.reduce((sum, item) => sum + item.value, 0) },
            ].map(({ label, value }) => (
              <div key={label} className={`border-l pl-3 first:border-0 first:pl-0 ${theme.panelBorder}`}>
                <dd className="text-xl font-bold tabular-nums">{value.toLocaleString()}</dd>
                <dt className={`text-xs ${theme.textMuted}`}>{label}</dt>
              </div>
            ))}
          </dl>
          <div className={`my-3 rounded-lg px-3 py-2 ${theme.darkMode ? "bg-[var(--brand-soft-dark)]" : "bg-brand-soft"}`}>
            <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs">
              <span>Classes with an adviser</span>
              <strong>{assigned} of {classes.length}</strong>
            </div>
            <div aria-hidden="true"><ProgressBar value={coverage} darkMode={theme.darkMode} /></div>
          </div>
          {rosterCounts.length > 0 && (
            <>
              <h3 className={`qed-type-label mb-2 ${theme.textPrimary}`}>Students per class</h3>
              <EnrollmentBars bars={rosterCounts} label="Students per class" textMuted={theme.textMuted} />
            </>
          )}
        </OverviewPanel>}
    />
  );
}

function AccountBreakdown({ accounts, theme }: { accounts: { label: string; color: string; value: number }[]; theme: AdminThemeContext }) {
  const total = accounts.reduce((sum, item) => sum + item.value, 0);
  let start = 0;
  const stops = accounts.map(({ value, color }) => {
    const end = start + (total ? value / total * 100 : 0);
    const stop = `${color} ${start}% ${end}%`;
    start = end;
    return stop;
  });

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
      <div className="grid size-22 place-items-center rounded-full p-2.5 sm:size-26" aria-hidden="true"
        style={{ background: total ? `conic-gradient(${stops.join(", ")})` : "var(--sk-base)" }}>
        <div className={`grid size-full content-center rounded-full text-center ${theme.darkMode ? "bg-panel-dark" : "bg-white"}`}>
          <strong className="text-lg tabular-nums sm:text-2xl">{total.toLocaleString()}</strong>
          <span className={`text-xs ${theme.textMuted}`}>accounts</span>
        </div>
      </div>
      <ul aria-label="Accounts by role" className="space-y-2 text-xs sm:text-sm">
        {accounts.map(({ label, value, color }) => (
          <li key={label} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span>{label}</span>
            <strong className="tabular-nums">{value.toLocaleString()}</strong>
            <span className={`min-w-8 text-right tabular-nums ${theme.textMuted}`}>{total ? Math.round(value / total * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewPanel({ icon, title, loading, error, retry, to, action, theme, children }: {
  icon: typeof Users;
  title: string;
  loading: boolean;
  error: string | null;
  retry: () => void | Promise<void>;
  to: string;
  action: string;
  theme: AdminThemeContext;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <SectionCard {...theme} compact title={title} icon={icon}
        action={<Link to={to} className={`qed-type-button shrink-0 rounded-lg border px-3 py-1.5 text-maroon ${theme.panelBorder} hover:bg-maroon/5`}>{action}</Link>}>
        {error ? (
          <div className={`text-sm ${theme.textMuted}`} role="alert">
            <p>{error}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => void retry()}>Retry</button>
          </div>
        ) : (
          <LoadingRegion loading={loading} label={`Loading ${title.toLowerCase()}`} skeleton={<DashboardSkeletonRows count={6} paired />}>
            {children}
          </LoadingRegion>
        )}
      </SectionCard>
    </section>
  );
}
