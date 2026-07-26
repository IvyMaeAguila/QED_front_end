import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Users, Crown, UserPlus, ArrowRight } from "lucide-react";
import { useUsers } from "./context/UsersContext";
import { UsersFilterBar } from "./components/UsersFilterBar";
import { UsersTable } from "./components/UsersTable";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import type { UserAccount, UserStatus } from "./types/user";
import { formatFullName, ROLE_LABELS } from "./types/user";
import type { AdminThemeContext } from "../../AdminLayout";

const ACCENT = "#8B0D0D";

export function UserManagementPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { users, deleteUser, getActivePrincipal } = useUsers();

  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All Statuses">("All Statuses");
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const activePrincipal = getActivePrincipal();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "All Roles" && ROLE_LABELS[u.role] !== roleFilter) return false;
      if (statusFilter !== "All Statuses" && u.status !== statusFilter) return false;
      if (q) {
        const haystack = `${u.id} ${u.lastName} ${u.firstName} ${u.middleName} ${u.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);
  
  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  return (
    <div className="max-w-7xl mx-auto mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section
        className={`rounded-xl border shadow-xs p-5 flex items-center justify-between gap-4 flex-wrap ${panelBg} ${panelBorder}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#C98A2B] flex items-center justify-center text-white shrink-0">
            <Crown size={20} />
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>Principal Account</p>
            {activePrincipal ? (
              <>
                <p className={`text-base font-extrabold truncate ${textPrimary}`}>
                  {formatFullName(activePrincipal)}
                </p>
                <p className={`text-xs font-medium truncate ${textMuted}`}>{activePrincipal.email}</p>
              </>
            ) : (
              <p className={`text-sm font-semibold ${textMuted}`}>
                No active Principal assigned. Only one active Principal is allowed at a time.
              </p>
            )}
          </div>
        </div>

        {activePrincipal ? (
          <button
            onClick={() => navigate(`/admin/users/${activePrincipal.id}`)}
            className={`h-9 px-4 rounded-xl text-xs font-bold border inline-flex items-center gap-2 shrink-0 transition-colors ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            View Record
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            onClick={() => navigate("/admin/users/new", { state: { presetRole: "PRINCIPAL" } })}
            className="h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shrink-0 transition-colors hover:bg-[#6B0000]"
            style={{ background: ACCENT }}
          >
            <UserPlus size={14} />
            Assign Principal
          </button>
        )}
      </section>

      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses}>
            <Users size={15} style={{ color: ACCENT }} />
            User Management
          </h2>
          <span className={`text-xs font-semibold ${textMuted}`}>
            {filtered.length} of {users.length} account{users.length === 1 ? "" : "s"} shown
          </span>
        </div>

        <UsersFilterBar
          darkMode={darkMode}
          panelBorder={panelBorder}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          search={search}
          onRoleChange={setRoleFilter}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onAddNew={() => navigate("/admin/users/new")}
        />

        <UsersTable
          users={filtered}
          darkMode={darkMode}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          onView={(user) => navigate(`/admin/users/${user.id}`)}
          onEdit={(user) => navigate(`/admin/users/${user.id}/edit`)}
          onDelete={(user) => setUserToDelete(user)}
        />
      </section>

      {userToDelete && (
        <ConfirmDeleteUserModal
          user={userToDelete}
          darkMode={darkMode}
          onCancel={() => setUserToDelete(null)}
          onConfirm={() => {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
}