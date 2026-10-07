import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useUsers } from "./context/UsersContext";
import { formatFullName, ROLE_LABELS } from "./types/user";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import type { AdminThemeContext } from "../AdminLayout";
import { useTeachers } from "../classes/context/TeachersContext";
import { TeacherSchedulePage } from "../../../principal/pages/teachers/TeacherSchedulePage";

const ACCENT = "#8B0D0D";

export function UserViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { role, userId } = useParams<{ role: string; userId: string }>();
  const { getUser, deleteUser } = useUsers();
  const { getTeacherByUserId } = useTeachers();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const user = role && userId ? getUser(role.toUpperCase(), userId) : undefined;

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `qed-type-page-title ${textPrimary}`;

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <section className={`rounded-xl border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>
            No user found with ID <span className="font-bold">{userId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/users")}
            className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
            style={{ background: ACCENT }}
          >
            <ArrowLeft size={14} />
            Back to User Management
          </button>
        </section>
      </div>
    );
  }

  if (user.role === "TEACHER") {
    const teacher = getTeacherByUserId(user.id);
    return (
      <>
        <TeacherSchedulePage
          teacherIdOverride={teacher?.id ?? user.id}
          backPath="/admin/users"
          headerActions={(
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}/edit`)}
                className="h-9 rounded-xl px-3 text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000]"
                style={{ background: ACCENT }}
              >
                <Pencil size={14} /> Edit User
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className={`h-9 rounded-xl border px-3 text-xs font-bold inline-flex items-center gap-2 transition-colors ${darkMode ? "border-[#7F1D1D] text-[#F87171] hover:bg-[#7F1D1D]/20" : "border-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"}`}
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
    );
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={`system-back-button shrink-0 ${
                darkMode ? "border-[#374151] hover:bg-white/10 text-white" : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses}>{formatFullName(user)}</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {ROLE_LABELS[user.role]} account details
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
            {fields.map((f) => (
              <div key={f.label}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>{f.label}</p>
                <p className={`text-sm font-semibold ${textPrimary}`}>{f.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate(`/admin/users/${user.role.toLowerCase()}/${user.id}/edit`)}
              className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000]"
              style={{ background: ACCENT }}
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
              }`}
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
}
