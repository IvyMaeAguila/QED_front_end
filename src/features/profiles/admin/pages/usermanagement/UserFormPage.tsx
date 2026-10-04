import { API_CONFIG } from "../../../../../config/api.config";
import { useState, useRef, type FormEvent } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { useUsers } from "./context/UsersContext";
import { principalConflict } from "./context/UsersContext";
import {
  ROLES,
  ROLE_LABELS,
  STATUSES,
  type Role,
  type UserStatus,
} from "./types/user";
import { formatFullName } from "./types/user";

import {
  generateUsername,
  generateRandomPassword,
} from "./../../../../auth/utils/credentials";
import { AuthService } from "./../../../../auth/services/authentication.service";

// Self-contained modal built for the admin theme — see AdminFeedbackModal.tsx.
// TODO: palitan ng tamang relative path papunta sa file mo
import AdminFeedbackModal from "../../modal/adminFeedbackModal";

import type { AdminThemeContext } from "./../AdminLayout";
import { WorkflowStepper } from "../../../shared/components/WorkflowStepper";

const ACCENT = "#8B0D0D";
const USER_FORM_STEPS = [
  { name: "Profile", desc: "Enter the user's name and role" },
  { name: "Contact", desc: "Add email and account status" },
  { name: "Review", desc: "Confirm the account details" },
] as const;

interface FormState {
  lastName: string;
  firstName: string;
  middleName: string;
  role: Role;
  email: string;
  contactNumber: string;
  status: UserStatus;
  gender: "Male" | "Female" | "";
}

// Payload sent to /addUser and /editUser. userName/generatedPassword are only
// included on create (see handleSubmit) so the backend knows to send the
// credentials email — they're never sent, or persisted, on edit.
interface AddUserPayload {
  userId?: string;
  lastName: string;
  firstName: string;
  middleName: string;
  role: Role;
  email: string;
  contactNumber: string;
  status: UserStatus;
  gender?: "Male" | "Female" | "";
  userName?: string;
  generatedPassword?: string;
}

const emptyForm: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  role: "TEACHER",
  email: "",
  contactNumber: "",
  status: "Active",
  gender: "",
};

// Backend/DB values aren't guaranteed to come back as strings (e.g. contactNumber
// can arrive as a number, or null/undefined for older records). Coerce everything
// that goes into the form state so .trim() and friends never blow up downstream.
function toStr(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function UserFormPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, userId } = useParams<{ role: string; userId: string }>();
  const { getUser, refetchUsers, getActivePrincipal } = useUsers();

  const isEditing = Boolean(userId);
  const existing = role && userId ? getUser(role, userId) : undefined;
  const presetRole = (location.state as { presetRole?: Role } | null)
    ?.presetRole;

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
          gender: existing.gender ?? "",
        }
      : { ...emptyForm, role: presetRole ?? emptyForm.role },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ref, not state — state updates are batched/async and won't block a
  // second handleSubmit call that fires in the same tick (e.g. Enter key
  // + button click nearly simultaneously). The ref updates synchronously.
  const isSubmittingRef = useRef(false);

  // Replaces native alert() for success/error feedback. onCloseAction lets
  // the success case navigate away only after the user dismisses the modal
  // (unlike alert(), Modal doesn't block execution, so we can't navigate
  // right after calling it — that would yank the modal away before they
  // read it).
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    onCloseAction?: () => void;
  }>({ open: false, variant: "success", title: "", message: "" });

  function closeFeedbackModal() {
    const action = feedbackModal.onCloseAction;
    setFeedbackModal((prev) => ({ ...prev, open: false }));
    action?.();
  }

  // ── Shared design tokens (same as StudentFormPage) ──
  const cardClasses = `rounded-[12px] border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xl font-black tracking-tight ${textPrimary}`;

  if (isEditing && !existing) {
    return (
      <div className="w-full pb-12">
        <section
          className={`rounded-[12px] border shadow-xs p-8 text-center ${panelBg} ${panelBorder}`}
        >
          <p className={`text-sm font-semibold ${textMuted}`}>
            No user found with ID <span className="font-bold">{userId}</span>.
          </p>
          <button
            onClick={() => navigate("/admin/users")}
            className="mt-4 h-9 px-4 rounded-lg text-xs font-bold text-white inline-flex items-center gap-2"
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

  const inputClasses = `w-full h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function validate(step?: number): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    const lastName = toStr(form.lastName);
    const firstName = toStr(form.firstName);
    const email = toStr(form.email);
    const contactNumber = toStr(form.contactNumber);

    if (step === undefined || step === 0) {
      if (!lastName.trim()) next.lastName = "Last name is required.";
      if (!firstName.trim()) next.firstName = "First name is required.";
      if (form.role !== "ADMIN" && !form.gender)
        next.gender = "Select this user's gender.";
    }
    if (step === undefined || step === 1) {
      if (!email.trim()) next.email = "Email is required.";
      else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        next.email = "Enter a valid email address.";
      if (!contactNumber.trim())
        next.contactNumber = "Contact number is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isEditing && currentStep < USER_FORM_STEPS.length - 1) {
      if (validate(currentStep)) setCurrentStep((step) => step + 1);
      return;
    }
    if (!validate()) return;
    if (conflict) return;
    if (isSubmittingRef.current) return; // synchronous guard — blocks same-tick duplicate fires

    isSubmittingRef.current = true;
    setIsSubmitting(true); // drives the button's disabled/label UI
    try {
      let currentUserId = existing?.id;
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

        currentUserId = authResult.user.id; // <-- this becomes teachers_table.user_id
      }

      const payload: AddUserPayload = {
        userId: currentUserId,
        lastName: toStr(form.lastName).trim(),
        firstName: toStr(form.firstName).trim(),
        middleName: toStr(form.middleName).trim(),
        role: form.role,
        email: toStr(form.email).trim(),
        contactNumber: toStr(form.contactNumber).trim(),
        status: form.status,
        ...(form.role !== "ADMIN" ? { gender: form.gender } : {}),
        // only present on create — backend uses these to send the
        // credentials email, and should never persist the plain password
        ...(generatedPassword && userName
          ? { userName, generatedPassword }
          : {}),
      };

      const endpoint =
        isEditing && existing
          ? `${API_CONFIG.baseURL}/api/user/editUser/${existing.id}`
          : `${API_CONFIG.baseURL}/api/user/addUser`;

      const response = await fetch(endpoint, {
        method: isEditing && existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedbackModal({
          open: true,
          variant: "error",
          title: "Couldn't Save User",
          message: data.message || "Failed to save user's record.",
        });
        return;
      }

      // The raw fetch above already performed the create/update — just
      // refresh the context's local list from the server. Do NOT call
      // context's addUser/updateUser here, they'd fire a second
      // POST/PUT to the same endpoint.
      await refetchUsers();

      setFeedbackModal({
        open: true,
        variant: "success",
        title: generatedPassword && userName ? "User Added" : "User Updated",
        message:
          generatedPassword && userName
            ? `Credentials were sent to ${payload.email}.`
            : "User updated successfully!",
        onCloseAction: () => navigate("/admin/users"),
      });
    } catch (error) {
      console.error("Submission error:", error);
      // Show the backend's actual message when we have one (e.g. duplicate
      // username, duplicate email) instead of implying it's a connection
      // problem — those are two very different things for the admin to act on.
      const message =
        error instanceof Error
          ? error.message
          : "Can't connect to the server. Make sure the backend is running.";
      const isDuplicateUsername = /already taken/i.test(message);
      setFeedbackModal({
        open: true,
        variant: "error",
        title: isDuplicateUsername
          ? "Username Already Taken"
          : "Couldn't Save User",
        message,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <section className={cardClasses} aria-label="User account form">
        {/* Card header — back button + icon/title on the left, helper text on the right */}
        <div className={cardHeaderClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              aria-label="Go back"
              className={`system-back-button shrink-0 ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className={sectionTitleClasses}>
                {isEditing ? "Edit User Record" : "Add New User Account"}
              </h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {isEditing
                  ? `Updating record ${existing?.id}`
                  : "This user will be assigned the next available ID"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid w-full gap-4 p-4 sm:p-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          {!isEditing && (
            <aside className={`rounded-[12px] p-4 sm:p-5 ${darkMode ? "bg-[#0B1120]/60" : "bg-[#F8FAFC]"}`}>
              <h3 className={`mb-4 text-sm font-semibold md:mb-6 ${textPrimary}`}>Add User</h3>
              <WorkflowStepper darkMode={darkMode} current={currentStep} steps={USER_FORM_STEPS} />
            </aside>
          )}
          <div className={`min-w-0 space-y-5 rounded-[12px] border p-4 sm:p-6 ${panelBorder} ${!isEditing ? "md:col-start-2" : "md:col-span-2"}`}>
          {conflict && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-3.5 ${
                darkMode
                  ? "bg-[#7F1D1D]/15 border-[#7F1D1D]"
                  : "bg-[#FEF3C7] border-[#FCD34D]"
              }`}
            >
              <AlertTriangle
                size={18}
                className="text-[#B45309] shrink-0 mt-0.5"
              />
              <p
                className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-[#FCD34D]" : "text-[#92400E]"}`}
              >
                {formatFullName(conflict)} is already the active
                Principal. Only one active Principal is allowed — deactivate
                their account first, or edit their record directly instead of
                creating a new one.
              </p>
            </div>
          )}

          {(isEditing || currentStep === 0) && <div className="max-w-4xl space-y-5">
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Last Name</label>
              <input
                className={inputClasses}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Herrera"
              />
              {errors.lastName && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>First Name</label>
              <input
                className={inputClasses}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="Bienvenido"
              />
              {errors.firstName && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>
          </div>

          <div className="grid max-w-2xl gap-4 sm:grid-cols-[8rem_minmax(0,24rem)]">
            <div>
              <label className={labelClasses}>M.I.</label>
              <input
                className={inputClasses}
                value={form.middleName}
                maxLength={1}
                onChange={(e) =>
                  setForm({ ...form, middleName: e.target.value })
                }
                placeholder="S"
              />
              {errors.middleName && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                  {errors.middleName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Role</label>
              <select
                className={`${inputClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                value={form.role}
                disabled={isEditing}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as Role })
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.role !== "ADMIN" && (
            <div className="max-w-xs">
              <label className={labelClasses} htmlFor="user-gender">
                Gender
              </label>
              <select
                id="user-gender"
                className={inputClasses}
                value={form.gender}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gender: e.target.value as FormState["gender"],
                  })
                }
              >
                <option value="">Select gender…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                  {errors.gender}
                </p>
              )}
              {isEditing && !existing?.gender && (
                <p className={`mt-1 text-[11px] ${textMuted}`}>
                  Choose the correct value for this existing account.
                </p>
              )}
            </div>
          )}

          </div>}

          {(isEditing || currentStep === 1) && <div className="max-w-4xl space-y-5">
          <div className="max-w-lg">
            <label className={labelClasses}>Email Address</label>
            <input
              type="email"
              className={inputClasses}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@qedschool.edu"
            />
            {errors.email && (
              <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Contact Number</label>
              <input
                className={inputClasses}
                value={form.contactNumber}
                maxLength={11}
                inputMode="numeric"
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, contactNumber: numericValue });
                }}
                placeholder="0917-123-4567"
              />
              {errors.contactNumber && (
                <p className="text-[11px] font-semibold text-[#B91C1C] mt-1">
                  {errors.contactNumber}
                </p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Status</label>
              <select
                className={inputClasses}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as UserStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>}

          {!isEditing && currentStep === 2 && (
            <section className={`rounded-[12px] border p-4 sm:p-5 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-[#F8FAFC]"}`} aria-labelledby="user-review-title">
              <h3 id="user-review-title" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Review user account</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ["Name", [form.lastName, form.firstName, form.middleName].filter(Boolean).join(", ") || "—"],
                  ["Role", ROLE_LABELS[form.role]],
                  ["Gender", form.gender || "—"],
                  ["Email", form.email || "—"],
                  ["Contact number", form.contactNumber || "—"],
                  ["Status", form.status],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>{label}</dt>
                    <dd className={`mt-1 break-words text-sm font-semibold ${textPrimary}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className={`h-10 px-4 rounded-lg text-xs font-bold border transition-colors ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              Cancel
            </button>
            {!isEditing && currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className={`h-10 rounded-lg border px-4 text-xs font-bold transition-colors ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
              >
                Back
              </button>
            )}
            </div>
            <button
              type="submit"
              disabled={Boolean(conflict) || isSubmitting}
              className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-xs font-bold text-white transition-colors ${
                conflict || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#6B0000]"
              }`}
              style={{ background: ACCENT }}
            >
              {(isEditing || currentStep === USER_FORM_STEPS.length - 1) && <Save size={14} />}
              {!isEditing && currentStep < USER_FORM_STEPS.length - 1
                ? "Continue"
                : isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add User"}
            </button>
          </div>
          </div>
        </form>
      </section>

      <AdminFeedbackModal
        open={feedbackModal.open}
        onClose={closeFeedbackModal}
        title={feedbackModal.title}
        message={feedbackModal.message}
        darkMode={darkMode}
        icon={
          feedbackModal.variant === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )
        }
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closeFeedbackModal}
            className="h-9 px-4 rounded-lg text-xs font-bold text-white transition-colors hover:bg-[#6B0000]"
            style={{ background: ACCENT }}
          >
            OK
          </button>
        </div>
      </AdminFeedbackModal>
    </div>
  );
}
