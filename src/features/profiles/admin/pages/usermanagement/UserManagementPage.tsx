import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { IdCard, Crown, UserPlus, ArrowRight } from "lucide-react";
import { useUsers } from "./context/UsersContext";
import { UsersFilterBar } from "./components/UsersFilterBar";
import { UsersTable } from "./components/UsersTable";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import type { UserAccount, UserStatus } from "./types/user";
import { formatFullName, ROLE_LABELS } from "./types/user";
import type { AdminThemeContext } from "../shared/AdminLayout";

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
        const haystack = `${u.id} ${u.lastName} ${u.firstName} ${u.middleInitial} ${u.email}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  return (
    <div className="space-y-5">
      <section
        className={`rounded-xl border shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap ${panelBg} ${panelBorder}`}
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
            style={{ background: "#8B0D0D" }}
          >
            <UserPlus size={14} />
            Assign Principal
          </button>
        )}
      </section>

      <section className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
        <div className="bg-[#8B0D0D] px-5 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold">User Management</h3>
            <p className="text-xs text-white/70 mt-1">
              {filtered.length} of {users.length} account{users.length === 1 ? "" : "s"} shown
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#C98A2B] flex items-center justify-center text-white shrink-0">
            <IdCard size={19} />
          </div>
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
      </section>
    </div>
  );
}