import { Eye, Pencil, Trash2, Crown } from "lucide-react";
import type { UserAccount } from "../types/user";
import { formatFullName, ROLE_LABELS } from "../types/user";

interface UsersTableProps {
  users: UserAccount[];
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onView: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
}

const roleBadge = (role: UserAccount["role"]) => {
  switch (role) {
    case "ADMIN":
      return { color: "#8B0D0D", bg: "#FDECEC" };
    case "PRINCIPAL":
      return { color: "#C98A2B", bg: "#FFF4DF" };
    case "TEACHER":
      return { color: "#1D70D6", bg: "#EAF2FF" };
    case "PARENT":
      return { color: "#7C3AED", bg: "#F3E8FF" };
  }
};

const statusBadge = (status: UserAccount["status"]) =>
  status === "Active"
    ? { color: "#16834A", bg: "#EAF8F0", dot: "#34D399" }
    : { color: "#6B7280", bg: "#F1F5F9", dot: "#9CA3AF" };

export function UsersTable({
  users,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
  onView,
  onEdit,
  onDelete,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className={`text-sm font-semibold ${textMuted}`}>No users match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={darkMode ? "bg-[#0B1120]" : "bg-[#F8FAFC]"}>
              {[
                "Employee/Parent ID",
                "Full Name",
                "Role",
                "Email Address",
                "Contact Number",
                "Status",
                "Last Login",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className={`text-left font-bold text-[11px] uppercase tracking-wider px-5 py-3 whitespace-nowrap ${textMuted}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const rBadge = roleBadge(user.role);
              const sBadge = statusBadge(user.status);
              return (
                <tr key={user.id} className={`border-t ${panelBorder} hover:bg-black/2 transition-colors`}>
                  <td className={`px-5 py-4 font-extrabold tabular-nums whitespace-nowrap ${textPrimary}`}>
                    {user.id}
                  </td>
                  <td className={`px-5 py-4 font-semibold whitespace-nowrap ${textPrimary}`}>
                    {formatFullName(user)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"
                      style={{ background: darkMode ? `${rBadge.color}25` : rBadge.bg, color: rBadge.color }}
                    >
                      {user.role === "PRINCIPAL" && <Crown size={11} />}
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-medium ${textMuted}`}>{user.email}</td>
                  <td className={`px-5 py-4 font-medium whitespace-nowrap ${textMuted}`}>{user.contactNumber}</td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"
                      style={{ background: darkMode ? `${sBadge.color}25` : sBadge.bg, color: sBadge.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sBadge.dot }} />
                      {user.status}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-medium whitespace-nowrap ${textMuted}`}>
                    {user.lastLogin ?? "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <RowActionButton icon={Eye} label="View" darkMode={darkMode} onClick={() => onView(user)} />
                      <RowActionButton icon={Pencil} label="Edit" darkMode={darkMode} onClick={() => onEdit(user)} />
                      <RowActionButton
                        icon={Trash2}
                        label="Delete"
                        darkMode={darkMode}
                        danger
                        onClick={() => onDelete(user)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[#E5E7EB]">
        {users.map((user) => {
          const rBadge = roleBadge(user.role);
          const sBadge = statusBadge(user.status);
          return (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-extrabold text-base ${textPrimary}`}>{formatFullName(user)}</p>
                  <p className={`text-xs font-bold tabular-nums mt-0.5 ${textMuted}`}>{user.id}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0"
                  style={{ background: darkMode ? `${rBadge.color}25` : rBadge.bg, color: rBadge.color }}
                >
                  {user.role === "PRINCIPAL" && <Crown size={11} />}
                  {ROLE_LABELS[user.role]}
                </span>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`}>{user.email}</p>
              <p className={`text-xs font-semibold ${textMuted}`}>{user.contactNumber}</p>

              <div className="flex items-center justify-between pt-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: darkMode ? `${sBadge.color}25` : sBadge.bg, color: sBadge.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sBadge.dot }} />
                  {user.status}
                </span>
                <span className={`text-[11px] font-semibold ${textMuted}`}>{user.lastLogin ?? "Never"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <RowActionButton icon={Eye} label="View" darkMode={darkMode} full onClick={() => onView(user)} />
                <RowActionButton icon={Pencil} label="Edit" darkMode={darkMode} full onClick={() => onEdit(user)} />
                <RowActionButton
                  icon={Trash2}
                  label="Delete"
                  darkMode={darkMode}
                  danger
                  full
                  onClick={() => onDelete(user)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActionButton({
  icon: Icon,
  label,
  darkMode,
  danger,
  full,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  darkMode: boolean;
  danger?: boolean;
  full?: boolean;
  onClick: () => void;
}) {
  const dangerClasses = darkMode
    ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20"
    : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]";
  const normalClasses = darkMode
    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
    : "border-[#E5E7EB] text-[#64748B] hover:bg-[#F6F7FB]";

  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
        danger ? dangerClasses : normalClasses
      } ${full ? "flex-1" : ""}`}
    >
      <Icon size={13} />
      {full && label}
    </button>
  );
}