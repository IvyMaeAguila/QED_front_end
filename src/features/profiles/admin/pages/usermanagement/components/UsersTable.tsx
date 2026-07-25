import { useEffect, useRef, useState } from "react";
import { Eye, Pencil, Trash2, Crown, MoreVertical } from "lucide-react";
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
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        darkMode={darkMode}
                        onView={() => onView(user)}
                        onEdit={() => onEdit(user)}
                        onDelete={() => onDelete(user)}
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
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ background: darkMode ? `${rBadge.color}25` : rBadge.bg, color: rBadge.color }}
                  >
                    {user.role === "PRINCIPAL" && <Crown size={11} />}
                    {ROLE_LABELS[user.role]}
                  </span>
                  <RowActionsMenu
                    darkMode={darkMode}
                    onView={() => onView(user)}
                    onEdit={() => onEdit(user)}
                    onDelete={() => onDelete(user)}
                  />
                </div>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`}>{user.email}</p>
              <p className={`text-xs font-semibold ${textMuted}`}>{user.contactNumber}</p>

              <div className="pt-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: darkMode ? `${sBadge.color}25` : sBadge.bg, color: sBadge.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sBadge.dot }} />
                  {user.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActionsMenu({
  darkMode,
  onView,
  onEdit,
  onDelete,
}: {
  darkMode: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function runAndClose(action: () => void) {
    action();
    setOpen(false);
  }

  const itemClasses = darkMode
    ? "text-[#D1D5DB] hover:bg-white/10"
    : "text-[#374151] hover:bg-[#F6F7FB]";
  const dangerItemClasses = darkMode
    ? "text-[#F87171] hover:bg-[#7F1D1D]/20"
    : "text-[#B91C1C] hover:bg-[#FEE2E2]";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          darkMode
            ? "text-[#D1D5DB] hover:bg-white/10"
            : "text-[#64748B] hover:bg-[#F6F7FB]"
        }`}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-9 z-20 w-36 rounded-xl border shadow-lg overflow-hidden ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          <button
            role="menuitem"
            onClick={() => runAndClose(onView)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors ${itemClasses}`}
          >
            <Eye size={14} />
            View
          </button>
          <button
            role="menuitem"
            onClick={() => runAndClose(onEdit)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors ${itemClasses}`}
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            role="menuitem"
            onClick={() => runAndClose(onDelete)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors border-t ${dangerItemClasses} ${
              darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
            }`}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}