import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useLocation, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, AlertTriangle, UserPlus } from "lucide-react";
import { useUsers } from "./context/UsersContext";
import { principalConflict } from "./context/UsersContext";
import { ROLES, ROLE_LABELS, STATUSES, type Role, type UserStatus } from "./types/user";
import { formatFullName } from "./types/user";

import { generateUsername, generateRandomPassword } from "./../../../../auth/utils/credentials";
import { AuthService } from "./../../../../auth/services/authentication.service";

import type { AdminThemeContext } from "./../AdminLayout";

const ACCENT = "#8B0D0D";

interface FormState {
  lastName: string;
  firstName: string;
  middleName: string;
  role: Role;
  email: string;
  contactNumber: string;
  status: UserStatus;
}

const emptyForm: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  role: "TEACHER",
  email: "",
  contactNumber: "",
  status: "Active",
};

// Backend/DB values aren't guaranteed to come back as strings (e.g. contactNumber
// can arrive as a number, or null/undefined for older records). Coerce everything
// that goes into the form state so .trim() and friends never blow up downstream.
function toStr(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function UserFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams<{ userId: string }>();
  const { getUser, addUser, updateUser, getActivePrincipal } = useUsers();

  const isEditing = Boolean(userId);
  const existing = userId ? getUser(userId) : undefined;
  const presetRole = (location.state as { presetRole?: Role } | null)?.presetRole;

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          lastName: toStr(existing.lastName),
          firstName: toStr(existing.firstName),
          middleName: toStr(existing.middleName),
          role: existing.role,
          email: toStr(existing.email),
          contactNumber: toStr(existing.contactNumber),
          status: existing.status,
        }
      : { ...emptyForm, role: presetRole ?? emptyForm.role }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;

  if (isEditing && !existing) {
    return (
      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 pb-12">
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

  const activePrincipal = getActivePrincipal(existing?.id);
  const conflict = principalConflict(form.role, form.status, activePrincipal);

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    const lastName = toStr(form.lastName);
    const firstName = toStr(form.firstName);
    const email = toStr(form.email);
    const contactNumber = toStr(form.contactNumber);

    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!firstName.trim()) next.firstName = "First name is required.";
    // if (form.middleName && form.middleName.trim().length > 1)
    //   next.middleName = "Enter a middle name.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!contactNumber.trim()) next.contactNumber = "Contact number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (conflict) return;

    try {
      let userId = existing?.id;
      let generatedPassword: string | null = null;
      let userName: string | null = null;

      // Create auth account FIRST (only for new users) so we get an id
      if (!isEditing) {
        userName = generateUsername(form.role, form.firstName, form.lastName);
        generatedPassword = generateRandomPassword(10);

        const authResult = await AuthService.registerUser({
          userName,
          password: generatedPassword,
          role: form.role,
        });

        userId = authResult.user.id; // <-- this becomes teachers_table.user_id
      }

      const payload = {
        userId, // now actually defined
        lastName: toStr(form.lastName).trim(),
        firstName: toStr(form.firstName).trim(),
        middleName: toStr(form.middleName).trim(),
        role: form.role,
        email: toStr(form.email).trim(),
        contactNumber: toStr(form.contactNumber).trim(),
        status: form.status,
      };

      const endpoint =
        isEditing && existing
          ? `http://localhost:7400/api/user/editUser/${existing.id}`
          : "http://localhost:7400/api/user/addUser";

      const response = await fetch(endpoint, {
        method: isEditing && existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.message || "Failed to save user's record."}`);
        return;
      }

      const targetId = data.data?.id || existing?.id;

      if (isEditing && existing) {
        updateUser(existing.id, payload);
      } else {
        addUser(payload);
      }

      if (generatedPassword && userName) {
        alert(
          `User added successfully!\n\nUsername: ${userName}\nPassword: ${generatedPassword}\n\nPlease share this with the user securely.`
        );
      } else {
        alert("User updated successfully!");
      }

      navigate(`/admin/users`);
    } catch (error) {
      console.error("API Connection Error:", error);
      alert("Can't connect to the server. Make sure the backend is running.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                darkMode ? "border-[#374151] hover:bg-white/10 text-white" : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <h2 className={sectionTitleClasses}>
              <UserPlus size={15} style={{ color: ACCENT }} />
              {isEditing ? "Edit User Record" : "Add New User Account"}
            </h2>
          </div>
          <span className={`text-xs font-semibold ${textMuted}`}>
            {isEditing ? `Updating record ${existing?.id}` : "This user will be assigned the next available ID"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-xl">
          {conflict && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                darkMode ? "bg-[#7F1D1D]/15 border-[#7F1D1D]" : "bg-[#FEF3C7] border-[#FCD34D]"
              }`}
            >
              <AlertTriangle size={18} className="text-[#B45309] shrink-0 mt-0.5" />
              <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-[#FCD34D]" : "text-[#92400E]"}`}>
                {formatFullName(conflict)} ({conflict.id}) is already the active Principal. Only one active
                Principal is allowed — deactivate their account first, or edit their record directly instead of
                creating a new one.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Last Name</label>
              <input
                className={inputClasses}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Herrera"
              />
              {errors.lastName && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className={labelClasses}>First Name</label>
              <input
                className={inputClasses}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Bienvenido"
              />
              {errors.firstName && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.firstName}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-[120px_1fr] gap-4">
            <div>
              <label className={labelClasses}>M.I.</label>
              <input
                className={inputClasses}
                value={form.middleName}
                maxLength={1}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="S"
              />
              {errors.middleName && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.middleName}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Role</label>
              <select
                className={inputClasses}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Email Address</label>
            <input
              type="email"
              className={inputClasses}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@qedschool.edu"
            />
            {errors.email && <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.email}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Contact Number</label>
              <input
                className={inputClasses}
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="0917-123-4567"
              />
              {errors.contactNumber && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">{errors.contactNumber}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Status</label>
              <select
                className={inputClasses}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(conflict)}
              className={`h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors ${
                conflict ? "opacity-50 cursor-not-allowed" : "hover:bg-[#6B0000]"
              }`}
              style={{ background: ACCENT }}
            >
              <Save size={14} />
              {isEditing ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}