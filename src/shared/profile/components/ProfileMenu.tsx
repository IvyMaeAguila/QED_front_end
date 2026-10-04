// src/components/ProfileMenu.tsx
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pencil, Check, X, UserRound } from "lucide-react";
import { useSettings } from "../../../features/profiles/admin/pages/settings/context/SettingsContext";
import { useAuth } from "../../../features/auth/context/authContext";
import { PROFILE_FIELD_CONFIG } from "../../profile/config/ProfileFieldConfig";
import type { UserProfile } from "../../profile/types/types";
import { getDefaultTeacherAvatarKey, getTeacherAvatar, getTeacherAvatarBorderColor, TEACHER_AVATARS } from "../../profile/utils/teacherAvatar";
import { AuthService } from "../../../features/auth/services/authentication.service";

// These are in the SAME folder as ProfileMenu.tsx (src/shared/profile/components/avatars/)
import teacherWomanImg from "./avatars/teacher_women.jpg";
import teacherManImg from "./avatars/teacher_man.jpg";
import adminHatImg from "./avatars/admin_hat.png";

const ACCENT = "#6B0000";
const APPLE_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const DEFAULT_AVATARS = {
  female: teacherWomanImg,
  male: teacherManImg,
} as const;

function getAvatarSrc(user: UserProfile & { avatarUrl?: string; gender?: string }): string | undefined {
  if (user.avatarUrl) return user.avatarUrl;
  const role = String(user.role ?? "").trim().toLocaleUpperCase();
  const gender = String(user.gender ?? "").trim().toLocaleLowerCase();
  if (role === "ADMIN") return adminHatImg;
  if (role === "TEACHER") return getTeacherAvatar(user);
  if (gender === "male") return DEFAULT_AVATARS.male;
  if (gender === "female") return DEFAULT_AVATARS.female;
  return undefined;
}

export function ProfileMenu() {
  const { darkMode } = useSettings();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draft, setDraft] = useState<UserProfile | null>(user);
  const ref = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(user), [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = ref.current?.contains(target);
      const clickedDrawer = drawerRef.current?.contains(target);
      if (!clickedTrigger && !clickedDrawer) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  function closeDrawer() {
    setOpen(false);
    setEditing(false);
  }

  if (!user || !draft) return null;

  const currentUser = user;
  const fields = PROFILE_FIELD_CONFIG[user.role];
  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const textPrimary = darkMode ? "text-white" : "text-[#111827]";
  const borderColor = darkMode ? "border-[#1F2937]" : "border-[#EEF0F3]";
  const labelClasses = `text-[10.5px] font-semibold uppercase tracking-wider ${mutedText}`;
  const avatarBorderColor = user.role === "TEACHER" ? getTeacherAvatarBorderColor(user.gender) : "#D1D5DB";
  const inputClasses = `w-full h-10 px-3 rounded-lg border text-[13px] font-medium outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#2A3441] text-white focus:border-[#8A1F1F]"
      : "bg-[#FAFBFC] border-[#E3E6EA] text-[#111827] focus:border-[#6B0000]"
  }`;

  function startEdit() {
    setDraft(currentUser.role === "TEACHER"
      ? { ...currentUser, avatarKey: currentUser.avatarKey ?? getDefaultTeacherAvatarKey(currentUser.gender) }
      : currentUser);
    setSaveError("");
    setEditing(true);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setSaveError("");
    try {
      const teacherDraft = currentUser.role === "TEACHER"
        ? draft as Extract<UserProfile, { role: "TEACHER" }>
        : null;
      if (teacherDraft && !teacherDraft.avatarKey) throw new Error("Choose a profile illustration before saving.");
      const updated = await AuthService.updateProfile({
        email: draft.email,
        phone: "phone" in draft ? draft.phone : undefined,
        address: "address" in draft ? draft.address : undefined,
        avatarKey: teacherDraft?.avatarKey,
      });
      setUser({ ...draft, ...updated } as UserProfile);
      setEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(currentUser);
    setEditing(false);
  }

  const avatarSrc = getAvatarSrc((editing ? draft : user) as any);

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        aria-hidden={!open}
        className={`fixed inset-0 z-90 modal-backdrop transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        data-drawer-panel="true"
        className={`fixed inset-y-0 right-0 z-100 w-104 max-w-[90vw] h-full flex flex-col shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.35)] transition-transform duration-500 ${APPLE_EASE} ${
          darkMode ? "bg-[#0F172A]" : "bg-white"
        } ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className={`relative shrink-0 border-b ${borderColor}`}>
          <div className="h-28 bg-maroon-gradient-vertical" />
          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="absolute right-5 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={16} />
          </button>

          <div className="-mt-10 flex flex-col items-center px-6 pb-5 text-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white shadow-lg"
            style={{ borderColor: avatarBorderColor }}
          >
            {avatarSrc ? <img src={avatarSrc} alt={`${user.name}'s profile`} className="w-full h-full object-cover" /> : <UserRound className="h-9 w-9 text-gray-400" aria-label="Profile image unavailable" />}
          </div>

          <p
            className={`mt-3.5 text-[16px] font-semibold truncate max-w-full ${
              darkMode ? "text-white" : "text-[#111827]"
            }`}
          >
            {user.name}
          </p>

          <span
            className={`inline-block mt-1.5 text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              darkMode
                ? "bg-white/10 text-white/70"
                : "bg-[#F3E9E9] text-[#6B0000]"
            }`}
          >
            {user.role}
          </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editing ? (
            <>
              {user.role === "TEACHER" && (
                <div className="mb-6">
                  <p className={`${labelClasses} mb-1`}>Profile illustration</p>
                  <p className={`mb-3 text-xs ${mutedText}`}>Choose an avatar. Male and female defaults use light blue and red accents.</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {TEACHER_AVATARS.map((avatar) => {
                      const selectedKey = (draft as Extract<UserProfile, { role: "TEACHER" }>).avatarKey;
                      const selected = selectedKey === avatar.key;
                      const genderAccent = avatar.gender === "male" ? "#B8DDF0" : "#D9343E";
                      return (
                        <button
                          key={avatar.key}
                          type="button"
                          onClick={() => setDraft({ ...draft, avatarKey: avatar.key } as UserProfile)}
                          aria-label={`Choose ${avatar.label} avatar`}
                          aria-pressed={selected}
                          className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors ${selected ? "border-maroon bg-maroon/5" : `${borderColor} hover:border-maroon/50`}`}
                        >
                          <span className="h-14 w-14 overflow-hidden rounded-full border-2 bg-white" style={{ borderColor: genderAccent }}>
                            <img src={avatar.src} alt="" className="h-full w-full object-cover" />
                          </span>
                          <span className={`w-full truncate text-center text-[10px] font-medium ${textPrimary}`}>{avatar.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className={`${labelClasses} mb-4`}>Edit details</p>
              <div className="space-y-4">
                {fields
                  .filter((f) => f.editable)
                  .map((f) => (
                    <div key={f.key}>
                      <label className={`${labelClasses} block mb-1.5`}>
                        {f.label}
                      </label>
                      <input
                        value={(draft as any)[f.key] ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [f.key]: e.target.value,
                          } as UserProfile)
                        }
                        className={inputClasses}
                      />
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <>
              <p className={`${labelClasses} mb-1`}>Account details</p>
              <div className={`mt-3 overflow-hidden rounded-xl border ${borderColor}`}>
                {fields
                  .filter((f) => f.showInSummary)
                  .map((f, index, summaryFields) => {
                    const Icon = f.icon;
                    const rawValue = (user as any)[f.key];
                    const value = f.key === "gender" && rawValue
                      ? String(rawValue).charAt(0).toUpperCase() + String(rawValue).slice(1).toLowerCase()
                      : rawValue;
                    return (
                      <div
                        key={f.key}
                        className={`flex min-h-[64px] items-center gap-3 px-3.5 py-2.5 ${index < summaryFields.length - 1 ? `border-b ${borderColor}` : ""}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            darkMode ? "bg-white/5" : "bg-[#F6F7F9]"
                          }`}
                        >
                          <Icon size={14} className={mutedText} />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                          <p className={`${labelClasses} leading-none shrink-0`}>
                            {f.label}
                          </p>
                          <p
                            className={`text-[13px] font-medium text-right break-words ${
                              value ? (darkMode ? "text-[#E5E7EB]" : "text-[#1F2937]") : mutedText
                            }`}
                          >
                            {value || "Not provided"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className={`px-6 py-5 border-t shrink-0 ${borderColor}`}>
          {editing ? (
            <>
            {saveError && <p role="alert" className="mb-3 text-xs font-medium text-red-700">{saveError}</p>}
            <div className="flex gap-2.5">
              <button
                onClick={cancel}
                disabled={saving}
                className={`flex-1 h-10 rounded-lg text-[13px] font-semibold border transition-colors ${
                  darkMode
                    ? "border-[#2A3441] text-[#D1D5DB] hover:bg-white/5"
                    : "border-[#E3E6EA] text-[#374151] hover:bg-[#F6F7F9]"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition-opacity hover:opacity-90"
                style={{ background: ACCENT }}
              >
                <Check size={14} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="w-full h-10 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition-opacity hover:opacity-90"
              style={{ background: ACCENT }}
            >
              <Pencil size={13} />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2.5 shrink-0 rounded-xl pl-1.5 pr-2.5 py-1.5 border transition-all duration-200 ${
          open
            ? darkMode
              ? "bg-white/10 border-white/10"
              : "bg-black/4 border-black/5"
            : darkMode
              ? "border-transparent hover:bg-white/5 hover:border-white/10"
              : "border-transparent hover:bg-black/3 hover:border-black/5"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 transition-all duration-200 ${
            darkMode
              ? "bg-[#374151] group-hover:ring-[#6B0000]/40"
              : "bg-[#E5E5E5] group-hover:ring-[#6B0000]/25"
          }`}
          style={{ borderColor: avatarBorderColor }}
        >
          {avatarSrc ? <img src={avatarSrc} alt={`${user.name}'s profile`} className="w-full h-full object-cover" /> : <UserRound className="h-5 w-5 text-gray-400" aria-label="Teacher profile image unavailable" />}
        </div>

        <div className="hidden lg:block leading-tight text-left">
          <p
            className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}
          >
            {user.name}
          </p>
          <p
            className={`text-xs ${darkMode ? "text-[#D1D5DB]" : "text-[#555]"}`}
          >
            {user.role}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`hidden lg:block shrink-0 transition-transform duration-200 ${mutedText} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {createPortal(drawer, document.body)}
    </div>
  );
}
