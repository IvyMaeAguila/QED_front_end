import { ArrowLeft,Pencil,Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { TeacherSchedulePage } from "../../../principal/pages/teachers/TeacherSchedulePage";
import type { AdminThemeContext } from "../AdminLayout";
import { useTeachers } from "../classes/context/TeachersContext";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import { useUsers } from "./context/UsersContext";
import { formatFullName,ROLE_LABELS,type Role,type UserAccount } from "./types/user";

import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";

const ACCENT = "var(--color-maroon)";

function useUserViewPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { role, userId } = useParams<{ role: string; userId: string }>();
  const { getUser, deleteUser, loading, error, refetchUsers } = useUsers();
  const { getTeacherByUserId, loading: teachersLoading, error: teachersError, refetchTeachers } = useTeachers();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const foundUser = role && userId ? getUser(role.toUpperCase(), userId) : undefined;
  const routeRole = role?.toUpperCase() as Role;
  const user: UserAccount = foundUser ?? { id: userId ?? "", role: routeRole, firstName: "", lastName: "", middleName: "", email: "", contactNumber: "", status: "Active", lastLogin: null };
  const view = `user-details:${role}:${userId}`;

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  if (!loading && !error && !foundUser) {
    return { content: ((
      <div className="max-w-7xl mx-auto pb-12">
        <section className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`} data-sk-region="userviewpage-no-user-found-with-id" data-sk-static="">
            No user found with ID <span className="font-bold">{userId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/users")}
            className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }} data-sk-region="userviewpage-back-to-user-management" data-sk-static=""
          >
            <ArrowLeft size={14} />
            Back to User Management
          </button>
        </section>
      </div>
    )), scope: {  } };
  }

  if (user.role === "TEACHER") {
    const teacher = getTeacherByUserId(user.id);
    return { content: ((
      <>
        <TeacherSchedulePage
          teacherIdOverride={teacher?.id ?? user.id}
          backPath="/admin/users"
          prerequisite={{ loading: loading || teachersLoading, error: error || teachersError, retry: () => { void refetchUsers(); refetchTeachers(); } }}
          headerActions={(
            <div className="flex shrink-0 gap-2">
              <button
                disabled={loading || teachersLoading || !!error || !!teachersError}
                onClick={() => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}/edit`)}
                className="h-9 rounded-xl px-3 text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-maroon-light"
                style={{ background: ACCENT }} data-sk-region="userviewpage-edit-user" data-sk-static=""
              >
                <Pencil size={14} /> Edit User
              </button>
              <button
                disabled={loading || teachersLoading || !!error || !!teachersError}
                onClick={() => setConfirmingDelete(true)}
                className={`h-9 rounded-xl border px-3 text-xs font-bold inline-flex items-center gap-2 transition-colors ${darkMode ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20" : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"}`} data-sk-region="userviewpage-remove" data-sk-static=""
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
        />
        {confirmingDelete && (
          <ConfirmDeleteUserModal
            user={user}
            darkMode={darkMode}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={() => {
              deleteUser(user.id, user.role);
              navigate("/admin/users");
            }}
          />
        )}
      </>
    )), scope: {  } };
  }

  const fields: { label: string; value: string }[] = [
    // { label: "Employee/Parent ID", value: user.id },
    { label: "Full Name", value: formatFullName(user) },
    { label: "Role", value: ROLE_LABELS[user.role] },
    { label: "Email Address", value: user.email },
    { label: "Contact Number", value: user.contactNumber },
    { label: "Status", value: user.status },
    { label: "Last Login", value: user.lastLogin ?? "Never" },
  ];

  const renderDetails = (pending: boolean) => (
    <div className="max-w-7xl mx-auto space-y-6 pb-12" data-sk-region="user-details-content">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={`system-back-button shrink-0 ${
                darkMode ? "border-[#374151] hover:bg-white/10 text-white" : "border-border-subtle hover:bg-brand-light text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses} data-sk-region="user-details-name" data-sk-variable=""><span data-sk-field={`${view}:name`} className="block" data-sk-region="userviewpage-span-field-1">{pending ? <SkeletonParagraph field={`${view}:name`} /> : formatFullName(user)}</span></h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {ROLE_LABELS[user.role]} account details
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-5 max-w-xl" data-sk-region="userviewpage-div-field-2">
            {fields.map((f) => (
              <div key={f.label}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>{f.label}</p>
                <p className={`text-sm font-semibold ${textPrimary}`} data-sk-region={`user-details-field-${f.label}`} data-sk-variable=""><span data-sk-field={`${view}:${f.label}`} className="block" data-sk-region="userviewpage-span-field-3">{pending && f.label !== "Role" ? <SkeletonParagraph field={`${view}:${f.label}`} typical={f.label === "Full Name" || f.label === "Email Address" ? 2 : 1} /> : f.value}</span></p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}/edit`)}
              className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-maroon-light"
              style={{ background: ACCENT }} data-sk-region="userviewpage-edit-user" data-sk-static=""
            >
              <Pencil size={14} />
              Edit User
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className={`h-10 px-4 rounded-xl text-xs font-bold border inline-flex items-center gap-2 transition-colors ${
                darkMode
                  ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20"
                  : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"
              }`} data-sk-region="userviewpage-remove-user" data-sk-static=""
            >
              <Trash2 size={14} />
              Remove User
            </button>
          </div>
        </div>

        {confirmingDelete && (
          <ConfirmDeleteUserModal
            user={user}
            darkMode={darkMode}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={() => {
              deleteUser(user.id, user.role);
              navigate("/admin/users");
            }}
          />
        )}
      </section>
    </div>
  );
  return { content: (<LoadingRegion loading={loading} error={error} retry={() => void refetchUsers()} variable name="user-account-details" skeleton={null} frame={renderDetails}>{renderDetails(false)}</LoadingRegion>), scope: {  } };
}



export type UserViewPageEffectScope = ReturnType<typeof useUserViewPageState>["scope"];
export type UserViewPageRouteProps = Record<string, never>;
export function UserViewPageComposition(props: object & { effects?: (scope: UserViewPageEffectScope) => import("react").ReactNode }) {
 const state = useUserViewPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
