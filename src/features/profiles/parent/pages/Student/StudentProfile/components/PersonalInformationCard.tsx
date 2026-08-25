// components/PersonalInformationCard.tsx
// NOTE: verify this path — SectionHeader.tsx's own location relative to
// Student/ wasn't fully clear from the provided snippets. Adjust if needed.
import { useState } from "react";
import { UserRound, Pencil, ArrowLeft, Save } from "lucide-react";
import SectionHeader from "../../../ui/SectionHeader";
import type { PersonalInformation } from "../types/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

interface PersonalInformationCardProps {
  info: PersonalInformation;
  theme: AdminThemeContext;
  onSave?: (updates: { dateOfBirth: string; residentialAddress: string }) => void | Promise<void>;
}

interface DisplayFieldProps {
  label: string;
  value: string | null;
  textPrimary: string;
  textMuted: string;
}

function DisplayField({ label, value, textPrimary, textMuted }: DisplayFieldProps) {
  const hasValue = Boolean(value && value.trim().length > 0);
  return (
    <div className="py-3 first:pt-0 last:pb-0 sm:py-0">
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>{label}</p>
      <p className={`mt-1 text-sm font-bold ${hasValue ? textPrimary : textMuted}`}>
        {hasValue ? value : "Not specified"}
      </p>
    </div>
  );
}

// Read-only field used inside edit mode for the fields the admin is NOT allowed to change.
function LockedField({ label, value, darkMode }: { label: string; value: string | null; darkMode: boolean }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 sm:py-0">
      <label
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          darkMode ? "text-white/40" : "text-slate-400"
        }`}
      >
        {label}
      </label>
      <div
        className={`mt-1 w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm font-bold ${
          darkMode
            ? "border-white/5 bg-white/[0.03] text-white/40"
            : "border-slate-200 bg-slate-100 text-slate-400"
        }`}
      >
        {value && value.trim().length > 0 ? value : "—"}
      </div>
    </div>
  );
}

// Editable field used inside edit mode for Date of Birth and Residential Address only.
function UnlockedField({
  label,
  type,
  value,
  onChange,
  darkMode,
}: {
  label: string;
  type: "date" | "text";
  value: string;
  onChange: (value: string) => void;
  darkMode: boolean;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 sm:py-0">
      <label className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? "text-white/70" : "text-slate-500"}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-bold outline-none transition focus:ring-2 focus:ring-blue-500 ${
          darkMode
            ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
        }`}
      />
    </div>
  );
}

export function PersonalInformationCard({ info, theme, onSave }: PersonalInformationCardProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(info.dateOfBirth ?? "");
  const [residentialAddress, setResidentialAddress] = useState(info.residentialAddress ?? "");

  function handleStartEdit() {
    setDateOfBirth(info.dateOfBirth ?? "");
    setResidentialAddress(info.residentialAddress ?? "");
    setIsEditing(true);
  }

  function handleCancel() {
    setDateOfBirth(info.dateOfBirth ?? "");
    setResidentialAddress(info.residentialAddress ?? "");
    setIsEditing(false);
  }

  async function handleSave() {
    if (!onSave) {
      setIsEditing(false);
      return;
    }
    try {
      setIsSaving(true);
      await onSave({ dateOfBirth, residentialAddress });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  // ---------- EDIT MODE ----------
  if (isEditing) {
    return (
      <div className={`rounded-2xl border shadow-sm ${panelBorder} ${panelBg}`}>
        <div className={`flex items-center gap-3 border-b px-4 py-3 sm:px-5 sm:py-4 ${panelBorder}`}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
              darkMode ? "border-white/10 text-white/70 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            aria-label="Cancel edit"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <UserRound className={`h-5 w-5 shrink-0 ${darkMode ? "text-red-400" : "text-red-700"}`} />
          <p className={`min-w-0 truncate text-xs font-bold uppercase tracking-wide sm:text-sm ${textPrimary}`}>
            Edit Personal Information
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y px-4 py-1 sm:gap-x-6 sm:gap-y-5 sm:divide-y-0 sm:px-5 sm:py-5 sm:grid-cols-2">
          <LockedField label="Full Name" value={info.fullName} darkMode={darkMode} />
          <LockedField label="Student LRN" value={info.studentLrn} darkMode={darkMode} />
          <LockedField label="Gender" value={info.gender} darkMode={darkMode} />
          <LockedField label="Current Class" value={info.currentClass} darkMode={darkMode} />

          <UnlockedField
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            darkMode={darkMode}
          />
          <UnlockedField
            label="Residential Address"
            type="text"
            value={residentialAddress}
            onChange={setResidentialAddress}
            darkMode={darkMode}
          />
        </div>

        <div className={`flex items-center gap-3 border-t px-4 py-3 sm:px-5 sm:py-4 ${panelBorder}`}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 sm:flex-none ${
              darkMode ? "border-white/10 text-white/80 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-900 disabled:opacity-50 sm:flex-none"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- VIEW MODE ----------
  return (
    <div className={`rounded-2xl border shadow-sm ${panelBorder} ${panelBg}`}>
      <SectionHeader
        icon={UserRound}
        title="Personal Information"
        theme={theme}
        action={
          <button
            type="button"
            onClick={handleStartEdit}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              darkMode ? "border-white/10 text-white/80 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 divide-y px-4 py-1 sm:gap-x-6 sm:gap-y-5 sm:divide-y-0 sm:px-5 sm:py-5 sm:grid-cols-2">
        <DisplayField label="Full Name" value={info.fullName} textPrimary={textPrimary} textMuted={textMuted} />
        <DisplayField label="Student LRN" value={info.studentLrn} textPrimary={textPrimary} textMuted={textMuted} />
        <DisplayField label="Gender" value={info.gender} textPrimary={textPrimary} textMuted={textMuted} />
        <DisplayField label="Current Class" value={info.currentClass} textPrimary={textPrimary} textMuted={textMuted} />
        <DisplayField label="Date of Birth" value={info.dateOfBirth} textPrimary={textPrimary} textMuted={textMuted} />
        <DisplayField
          label="Residential Address"
          value={info.residentialAddress}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>
    </div>
  );
}