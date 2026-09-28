import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import { useUsers } from "./context/UsersContext";
import { Dropdown } from "./components/UsersFilterBar";
import { UserSearchInput } from "./components/UserSearchInput";
import { UsersTable } from "./components/UsersTable";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import type { UserAccount, UserStatus } from "./types/user";
import { ROLE_LABELS, ROLE_LABEL_LIST, STATUSES } from "./types/user";
import type { AdminThemeContext } from "../AdminLayout";

const ACCENT = "#8B0D0D";

export function UserManagementPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { users, loading, error, deleteUser } = useUsers();

  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All Statuses">("All Statuses");
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                User Management
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {filtered.length} of {users.length} account
                {users.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>
        </div>

        {/* One consolidated row: search + dropdowns + add button */}
        <UserSearchInput
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          value={search}
          onChange={setSearch}
        >
          <Dropdown
            label="Role filter"
            value={roleFilter}
            options={["All Roles", ...ROLE_LABEL_LIST]}
            onChange={setRoleFilter}
            darkMode={darkMode}
          />
          <Dropdown
            label="Status filter"
            value={statusFilter}
            options={["All Statuses", ...STATUSES]}
            onChange={setStatusFilter}
            darkMode={darkMode}
          />
          <button
            onClick={() => navigate("/admin/users/new")}
            className="h-8 px-3 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1.5 shrink-0 transition-colors hover:bg-[#6B0000]"
            style={{ background: ACCENT }}
          >
            <UserPlus size={13} />
            Add New User
          </button>
        </UserSearchInput>

        {/* Table card */}
        <section className={cardClasses} aria-label="User accounts">
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
                All Accounts
              </p>
            </div>
          </div>

          <UsersTable
            users={filtered}
            darkMode={darkMode}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onView={(user) => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}`)}
            onEdit={(user) => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}/edit`)}
            onDelete={(user) => setUserToDelete(user)}
          />
        </section>
      </div>

      {userToDelete && (
        <ConfirmDeleteUserModal
          user={userToDelete}
          darkMode={darkMode}
          onCancel={() => setUserToDelete(null)}
          onConfirm={() => {
            deleteUser(userToDelete.id, userToDelete.role.toLowerCase());
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
}