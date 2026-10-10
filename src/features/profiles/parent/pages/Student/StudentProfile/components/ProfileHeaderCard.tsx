import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { SkeletonAvatar } from "@shared/components/SkeletonLoading";
// components/ProfileHeaderCard.tsx
import { useState } from "react";
import type { ReactNode } from "react";
import { Pencil, Save } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { StudentProfileData, PersonalInformation } from "../types/types";

interface ProfileHeaderCardProps {
  student: StudentProfileData;
  loading?: boolean;
  personalInformation?: PersonalInformation | null;
  darkMode: boolean;
  panelBorder: string;
  onSave?: (updates: { dateOfBirth: string; residentialAddress: string }) => void | Promise<void>;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

// Compact information tile with a simple label and value hierarchy.
function InfoTile({
  label,
  darkMode,
  editing = false,
  children,
}: {
  label: string;
  darkMode: boolean;
  editing?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center rounded-xl2 p-4 shadow-sm transition ${
        darkMode ? "bg-[#1F2937]" : "bg-white"
      } ${editing ? "ring-2 ring-white/70" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${darkMode ? "text-white/50" : "text-[#6B7280]"}`}>{label}</p>
        <div className={`mt-0.5 text-sm font-bold leading-snug ${darkMode ? "text-white" : "text-[#111827]"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function EditInput({
  type,
  value,
  onChange,
  darkMode,
}: {
  type: "date" | "text";
  value: string;
  onChange: (v: string) => void;
  darkMode: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`mt-1 w-full rounded-lg border px-2.5 py-1.5 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-[#7A1212]/40 ${
        darkMode ? "border-white/10 bg-white/5 text-white" : "border-maroon/20 bg-white text-[#111827]"
      }`}
    />
  );
}

export function ProfileHeaderCard({
  loading = false,
  student,
  personalInformation: personalInformationProp,
  darkMode,
  panelBorder,
  onSave,
}: ProfileHeaderCardProps) {
  const fullDisplayName = `${student.lastName}, ${student.firstName}${
    student.middleInitial ? ` ${student.middleInitial}` : ""
  }`;
  const personalInformation: Partial<PersonalInformation> = personalInformationProp ?? {};

  const hasSection = Boolean(student.section && String(student.section).trim());
  const subtitle = `${student.gradeLevel}${hasSection ? ` \u2022 Section ${student.section}` : ""}`;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(personalInformation.dateOfBirth ?? "");
  const [residentialAddress, setResidentialAddress] = useState(personalInformation.residentialAddress ?? "");

  function startEdit() {
    setDateOfBirth(personalInformation.dateOfBirth ?? "");
    setResidentialAddress(personalInformation.residentialAddress ?? "");
    setIsEditing(true);
  }

  async function handleSave() {
    if (!onSave) return setIsEditing(false);
    try {
      setIsSaving(true);
      await onSave({ dateOfBirth, residentialAddress });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  const orNotSpecified = (v?: string | null) =>
    v && v.trim() ? v : <span className="font-medium text-[#9CA3AF]">Not specified</span>;

  const base = darkMode ? "var(--color-maroon)" : "var(--color-maroon)";

  return (
    <div
      className={`overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-8 ${panelBorder}`}
      style={{
        backgroundColor: base,
      }}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(240px,300px)_1fr] lg:gap-10">
        {/* Left: identity */}
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:justify-center lg:text-left">
          <div data-sk-region="parent-profile-avatar" className="sk-surface-profile-avatar h-36 w-36 overflow-hidden rounded-full bg-white/90 ring-4 ring-white/25 sm:h-40 sm:w-40">
            {loading && !student.gender ? <SkeletonAvatar className="h-full w-full" /> : <StudentAvatar
              gender={student.gender}
              name={fullDisplayName}
              className="h-full w-full rounded-full object-cover"
            />}
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{fullDisplayName}</h2>
            <p className="mt-1 text-base font-medium text-white/80">{subtitle}</p>
          </div>

        </div>

        {/* Right: controls + tiles */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white/80">Student information</p>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink transition hover:bg-white/90 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          <div className="grid flex-1 grid-cols-1 auto-rows-fr gap-3 sm:grid-cols-2">
            <InfoTile label="Student ID" darkMode={darkMode}>
              {loading ? <SkeletonParagraph field="parent-profile-studentId" typical={2} width="100%" /> : orNotSpecified(student.studentId)}
            </InfoTile>
            <InfoTile label="LRN" darkMode={darkMode}>
              {loading ? <SkeletonParagraph field="parent-profile-lrn" typical={2} width="100%" /> : orNotSpecified(student.lrn)}
            </InfoTile>
            <InfoTile label="Gender" darkMode={darkMode}>
              {loading ? <SkeletonParagraph field="parent-profile-gender" typical={2} width="100%" /> : orNotSpecified(student.gender)}
            </InfoTile>
            <InfoTile label="Current class" darkMode={darkMode}>
              {orNotSpecified(personalInformation.currentClass ?? subtitle)}
            </InfoTile>
            <InfoTile label="Date of birth" darkMode={darkMode} editing={isEditing}>
              {isEditing ? (
                <EditInput type="date" value={dateOfBirth} onChange={setDateOfBirth} darkMode={darkMode} />
              ) : (
                loading ? <SkeletonParagraph field="parent-profile-date" typical={2} width="100%" /> : orNotSpecified(formatDate(personalInformation.dateOfBirth))
              )}
            </InfoTile>
            <InfoTile label="Residential address" darkMode={darkMode} editing={isEditing}>
              {isEditing ? (
                <EditInput type="text" value={residentialAddress} onChange={setResidentialAddress} darkMode={darkMode} />
              ) : (
                loading ? <SkeletonParagraph field="parent-profile-address" typical={2} width="100%" /> : <span data-sk-field="parent-profile-address">{orNotSpecified(personalInformation.residentialAddress)}</span>
              )}
            </InfoTile>
          </div>
        </div>
      </div>
    </div>
  );
}
