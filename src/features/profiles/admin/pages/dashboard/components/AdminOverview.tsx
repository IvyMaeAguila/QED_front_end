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
    <div className="grid gap-5 xl:grid-cols-2">
      <OverviewCard title="Account overview" rows={accounts} loading={usersLoading} error={usersError ?? (forbidden ? "Account data is unavailable." : null)}
        retry={refetchUsers} link={{ to: "/admin/users", label: "Manage users" }} theme={theme} />
      <OverviewCard title="Class overview" rows={school} loading={classesLoading} error={classesError}
        retry={refreshClasses} link={{ to: "/admin/classes", label: "Manage classes" }} theme={theme} />
    </div>
  );
}

interface OverviewCardProps {
  title: string;
  rows: { label: string; value: number }[];
  loading: boolean;
  error: string | null;
  retry: () => void | Promise<void>;
  link: { to: string; label: string };
  theme: AdminThemeContext;
}

function OverviewCard({ title, rows, loading, error, retry, link, theme }: OverviewCardProps) {
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;
  return (
    <section aria-label={title} className={`rounded-xl border shadow-sm ${panelBg} ${panelBorder} ${textPrimary}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <h2 className="font-bold">{title}</h2>
        <Link to={link.to} className="text-sm font-semibold underline-offset-4 hover:underline">{link.label}</Link>
      </div>
      {error ? (
        <div className={`px-5 py-4 text-sm ${textMuted}`} role="alert">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={() => void retry()}>Retry</button>
        </div>
      ) : (
        <dl aria-busy={loading} className="grid gap-x-6 px-5 py-2 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label} className={`flex items-center justify-between gap-3 border-b py-3 ${panelBorder}`}>
              <dt className={`text-sm ${textMuted}`}>{label}</dt>
              <dd className="font-semibold tabular-nums">{loading ? "—" : value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
