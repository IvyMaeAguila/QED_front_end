import { BookOpen, Users } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import { EnrollmentOverview } from "./EnrollmentOverview";
import { Link } from "react-router-dom";
import { useLoadingOutletContext } from "@shared/loading/RoutePreview";
import { useClasses } from "../../classes/context/ClassesContext";
import { useUsers } from "../../usermanagement/context/UsersContext";
import { ROLES, ROLE_LABELS } from "../../usermanagement/types/user";
import type { AdminThemeContext } from "../../AdminLayout";

export function AdminOverview() {
  const theme = useLoadingOutletContext<AdminThemeContext>();
  const { users, loading: usersLoading, error: usersError, forbidden, refetchUsers } = useUsers();
  const { classes, loading: classesLoading, error: classesError, refreshClasses } = useClasses();
  const accounts = [
    { label: "Active accounts", value: users.filter(user => user.status === "Active").length },
    { label: "Inactive accounts", value: users.filter(user => user.status === "Inactive").length },
    ...ROLES.map(role => ({ label: ROLE_LABELS[role], value: users.filter(user => user.role === role).length })),
  ];
  const school = [
    { label: "Classes", value: classes.length },
    { label: "Grade levels with classes", value: new Set(classes.map(item => item.gradeLevelId)).size },
    { label: "Classes without an adviser", value: classes.filter(item => !(Number(item.adviserId) > 0)).length },
  ];

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
      <OverviewCard icon={Users} title="Account overview" rows={accounts} loading={usersLoading} error={usersError ?? (forbidden ? "Account data is unavailable." : null)}
        retry={refetchUsers} link={{ to: "/admin/users", label: "Manage users" }} theme={theme} />
      <OverviewCard icon={BookOpen} title="Class overview" rows={school} loading={classesLoading} error={classesError}
        retry={refreshClasses} link={{ to: "/admin/classes", label: "Manage classes" }} theme={theme} />
      </div>
      <EnrollmentOverview {...theme} />
    </>
  );
}

interface OverviewCardProps {
  icon: typeof Users;
  title: string;
  rows: { label: string; value: number }[];
  loading: boolean;
  error: string | null;
  retry: () => void | Promise<void>;
  link: { to: string; label: string };
  theme: AdminThemeContext;
}

function OverviewCard({ icon, title, rows, loading, error, retry, link, theme }: OverviewCardProps) {
  return (
    <section aria-label={title}>
      <SectionCard {...theme} compact title={title} icon={icon}
        action={<Link to={link.to} className={`qed-type-button shrink-0 rounded-lg border px-3 py-2 ${theme.panelBorder} ${theme.textPrimary} hover:bg-maroon/5`}>{link.label}</Link>}>
        {error ? (
          <div className={`text-sm ${theme.textMuted}`} role="alert">
            <p>{error}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => void retry()}>Retry</button>
          </div>
        ) : (
          <dl aria-busy={loading} className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {rows.map(({ label, value }) => (
              <div key={label} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${theme.panelBorder} ${theme.darkMode ? "bg-white/5" : "bg-brand-light"}`}>
                <dt className={`qed-type-metadata ${theme.textMuted}`}>{label}</dt>
                <dd className={`qed-type-table-body font-semibold tabular-nums ${theme.textPrimary}`}>{loading ? "—" : value.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        )}
      </SectionCard>
    </section>
  );
}
