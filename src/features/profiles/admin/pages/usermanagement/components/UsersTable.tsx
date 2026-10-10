import { useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Eye, Pencil, Trash2, Crown, MoreVertical } from "lucide-react";
import type { UserAccount } from "../types/user";
import { formatFullName, ROLE_LABELS } from "../types/user";

import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { LoadingTable } from "@shared/loading/LoadingTable";
import { skeletonRows } from "@shared/loading/reservations";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface UsersTableProps {
  loading?: boolean; error?: unknown; retry?: () => void; view?: string;
  users: UserAccount[];
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onView: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
}

const ROLE_COLOR = "var(--color-maroon)";

const statusBadge = (status: UserAccount["status"]) =>
  status === "Active"
    ? { color: "#16834A", bg: "#EAF8F0", dot: "#34D399" }
    : { color: "#6B7280", bg: "var(--brand-light)", dot: "#9CA3AF" };

export function UsersTable({
  loading = false, error, retry, view = "admin/users",
  users,
  darkMode,
  textPrimary,
  textMuted,
  onView,
  onEdit,
  onDelete,
}: UsersTableProps) {
  function renderRow(user: UserAccount, index: number, pending = false) {
    const sBadge = statusBadge(user.status);
    return (
      <tr
        key={`${user.role}-${user.id}`}
        className={`border-t transition-colors ${
          darkMode
            ? "border-white/10 hover:bg-white/5"
            : "border-black/10 hover:bg-black/5"
        }`}
      >
        <td className={`whitespace-nowrap px-4 py-2 text-xs font-bold tabular-nums ${textMuted}`} data-sk-region="userstable-td-field-1">
          {pending ? <SkeletonText width="2ch" /> : index + 1}
        </td>
        <td className={`px-4 py-2 text-xs font-bold whitespace-nowrap ${textPrimary}`} data-sk-region="userstable-td-field-2">
          {pending ? <SkeletonText width="14ch" /> : formatFullName(user)}
        </td>
        <td className="px-4 py-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap"
            style={{ color: ROLE_COLOR }} data-sk-region="userstable-span-field-3"
          >
            {user.role === "PRINCIPAL" && <Crown size={11} />}
            {pending ? <SkeletonText width="7ch" /> : ROLE_LABELS[user.role]}
          </span>
        </td>
        <td className={`px-4 py-2 text-xs font-medium ${textMuted}`} data-sk-region="userstable-td-field-4">{pending ? <><SkeletonText width="92%" /><SkeletonText width="64%" /></> : user.email}</td>
        <td className={`px-4 py-2 text-xs font-medium whitespace-nowrap ${textMuted}`} data-sk-region="userstable-td-field-5">
          {pending ? <SkeletonText width="11ch" /> : user.contactNumber}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
              style={{ background: darkMode ? `color-mix(in srgb, ${sBadge.color} 14.51%, transparent)` : sBadge.bg, color: sBadge.color }} data-sk-region="userstable-span-field-6"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sBadge.dot }} />
              {pending ? <SkeletonText width="6ch" /> : user.status}
            </span>
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
  }

  const userColumns = [
    {label:"No.", typical:"10"}, {label:"Full Name",typical:"Dela Cruz, Maria"}, {label:"Role",typical:"Principal"},
    {label:"Email Address",typical:"name@example.com"}, {label:"Contact Number",typical:"09123456789"}, {label:"Status",typical:"Active"},
  ];
  const placeholders: UserAccount[] = Array.from({length:skeletonRows(view)}, (_, index) => ({id:String(index), lastName:"",firstName:"",middleName:"",role:"TEACHER",email:"",contactNumber:"",status:"Active",lastLogin:null}));
  function renderMobile(pending: boolean) {
    const items = pending ? placeholders : users;
    return (<div className="md:hidden divide-y divide-[#E5E7EB]" data-sk-region="userstable-div-field-7">
        {items.map((user) => {
          const sBadge = statusBadge(user.status);
          return (
            <div key={`${user.role}-${user.id}`} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-extrabold text-base ${textPrimary}`} data-sk-region="userstable-p-field-8">{pending ? <><SkeletonText width="14ch" /><SkeletonText width="10ch" /></> : formatFullName(user)}</p>
                  <p className={`text-xs font-bold tabular-nums mt-0.5 ${textMuted}`} data-sk-region="userstable-p-field-9">{pending ? <SkeletonText width="4ch" /> : user.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold"
                    style={{ color: ROLE_COLOR }} data-sk-region="userstable-span-field-10"
                  >
                    {user.role === "PRINCIPAL" && <Crown size={11} />}
                    {pending ? <SkeletonText width="7ch" /> : ROLE_LABELS[user.role]}
                  </span>
                  <RowActionsMenu
                    darkMode={darkMode}
                    onView={() => onView(user)}
                    onEdit={() => onEdit(user)}
                    onDelete={() => onDelete(user)}
                  />
                </div>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`} data-sk-region="userstable-p-field-11">{pending ? <><SkeletonText width="92%" /><SkeletonText width="64%" /></> : user.email}</p>
              <p className={`text-xs font-semibold ${textMuted}`} data-sk-region="userstable-p-field-12">{pending ? <SkeletonText width="11ch" /> : user.contactNumber}</p>

              <div className="pt-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: darkMode ? `color-mix(in srgb, ${sBadge.color} 14.51%, transparent)` : sBadge.bg, color: sBadge.color }} data-sk-region="userstable-span-field-13"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sBadge.dot }} />
                  {pending ? <SkeletonText width="6ch" /> : user.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>);
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <LoadingTable loading={loading} error={error} retry={retry} view={view} count={users.length} className="teacher-user-table w-full text-sm"
          columns={userColumns} header={<thead>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              {userColumns.map((h) => (
                <th
                  key={h.label}
                  className={`whitespace-nowrap px-4 py-2 text-xs font-black uppercase tracking-wider ${h.label === "No." ? "w-14 text-left" : "text-left"} ${textMuted}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>}
          skeleton={placeholders.map((user, i) => renderRow(user, i, true))}>
          {users.length ? users.map((user, i) => renderRow(user, i)) : <tr><td colSpan={6} className={`py-16 text-center text-sm font-semibold ${textMuted}`}>No users match the current filters.</td></tr>}
        </LoadingTable>
      </div>

      <div className="md:hidden"><LoadingRegion loading={loading} error={error} retry={retry} variable skeleton={renderMobile(true)}>{renderMobile(false)}</LoadingRegion></div>
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
    : "text-[#374151] hover:bg-brand-light";
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
            : "text-[#64748B] hover:bg-brand-light"
        }`}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-9 z-20 w-36 rounded-xl border shadow-lg overflow-hidden ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-border-subtle"
          }`}
        >
          <button
            role="menuitem"
            onClick={() => runAndClose(onView)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors ${itemClasses}`} data-sk-region="userstable-view" data-sk-static=""
          >
            <Eye size={14} />
            View
          </button>
          <button
            role="menuitem"
            onClick={() => runAndClose(onEdit)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors ${itemClasses}`} data-sk-region="userstable-edit" data-sk-static=""
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            role="menuitem"
            onClick={() => runAndClose(onDelete)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors border-t ${dangerItemClasses} ${
              darkMode ? "border-[#374151]" : "border-border-subtle"
            }`} data-sk-region="userstable-delete" data-sk-static=""
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}