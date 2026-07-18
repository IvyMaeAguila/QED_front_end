import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Crown } from "lucide-react";
import { useState } from "react";
import { useUsers } from "./context/UsersContext";
import { formatFullName, ROLE_LABELS } from "./types/user";
import { ConfirmDeleteUserModal } from "./components/ConfirmDeleteUserModal";
import type { AdminThemeContext } from "../shared/AdminLayout";

export function UserViewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { getUser, deleteUser } = useUsers();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const user = userId ? getUser(userId) : undefined;

  if (!user) {
    return (
      <section className={`rounded-xl border shadow-sm p-8 text-center ${panelBg} ${panelBorder}`}>
        <p className={`text-sm font-semibold ${textMuted}`}>
          No user found with ID <span className="font-bold">{userId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-4 h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
          style={{ background: "#8B0D0D" }}
        >
          <ArrowLeft size={14} />
          Back to User Management
        </button>
      </section>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: "Employee/Parent ID", value: user.id },
    { label: "Full Name", value: formatFullName(user) },
    { label: "Role", value: ROLE_LABELS[user.role] },
    { label: "Email Address", value: user.email },
    { label: "Contact Number", value: user.contactNumber },
    { label: "Status", value: user.status },
    { label: "Last Login", value: user.lastLogin ?? "Never" },
  ];

  return (
    <section className={`rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
      <div className="bg-[#8B0D0D] px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {user.role === "PRINCIPAL" && <Crown size={16} className="text-[#FFE9B3] shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-white font-bold truncate">{formatFullName(user)}</h3>
            <p className="text-xs text-white/70 mt-0.5">{user.id}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
          {fields.map((f) => (
            <div key={f.label}>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>{f.label}</p>
              <p className={`mt-1 text-base font-bold ${textPrimary}`}>{f.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
            className="h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors hover:bg-[#6B0000]"
            style={{ background: "#8B0D0D" }}
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
            deleteUser(user.id);
            navigate("/admin/users");
          }}
        />
      )}
    </section>
  );
}