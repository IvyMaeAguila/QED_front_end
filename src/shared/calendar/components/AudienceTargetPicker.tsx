<<<<<<< Updated upstream:src/shared/calendar/components/AudienceTargetPicker.tsx
import { ACCENT, POSTABLE_ROLES_BY_POSTER, ROLE_LABELS, type Role, type AnnouncementAudience } from "../types/Calendar";
import { GRADE_LEVELS, type GradeLevel } from "../../../features/profiles/admin/pages/studentrecords/types/Students";
=======
import { ACCENT, POSTABLE_ROLES_BY_POSTER, ROLE_LABELS, type Role, type AudienceRole, type AnnouncementAudience } from "../types/Calendar";
import { GRADE_LEVELS, type GradeLevel } from "../../studentrecords/types/Students";
>>>>>>> Stashed changes:src/features/profiles/admin/pages/calendar/components/AudienceTargetPicker.tsx

interface AudienceTargetPickerProps {
  posterRole: Role;
  audience: AnnouncementAudience;
  onChange: (audience: AnnouncementAudience) => void;
  availableSections: string[];
  darkMode: boolean;
  textMuted: string;
  textPrimary: string;
  lockedGradeLevel?: GradeLevel;
  lockedSection?: string;
}

export function AudienceTargetPicker({
  posterRole,
  audience,
  onChange,
  availableSections,
  darkMode,
  textMuted,
  textPrimary,
  lockedGradeLevel,
  lockedSection,
}: AudienceTargetPickerProps) {
  const postableRoles = POSTABLE_ROLES_BY_POSTER[posterRole];
  const isTeacher = posterRole === "teacher";

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function toggleRole(role: AudienceRole) {
    const roles = audience.roles.includes(role)
      ? audience.roles.filter((r) => r !== role)
      : [...audience.roles, role];
    onChange({ ...audience, roles });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>Send To</label>
        <div className="flex flex-wrap gap-2">
          {postableRoles.map((role) => {
            const isChecked = audience.roles.includes(role);
            return (
              <button
                type="button"
                key={role}
                onClick={() => toggleRole(role)}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold border transition-colors ${
                  isChecked
                    ? "text-white"
                    : darkMode
                    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                    : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
                }`}
                style={isChecked ? { background: ACCENT, borderColor: ACCENT } : undefined}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      </div>

      {isTeacher ? (
        <p className={`text-xs font-semibold ${textMuted}`}>
          Scoped to your class:{" "}
          <span className={`font-bold ${textPrimary}`}>
            {lockedGradeLevel} - {lockedSection}
          </span>
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Grade Level</label>
            <select
              className={inputClasses}
              value={audience.gradeLevel ?? ""}
              onChange={(e) =>
                onChange({
                  ...audience,
                  gradeLevel: (e.target.value || undefined) as GradeLevel | undefined,
                  section: undefined,
                })
              }
            >
              <option value="">All Grade Levels</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Section</label>
            <select
              className={inputClasses}
              value={audience.section ?? ""}
              disabled={!audience.gradeLevel}
              onChange={(e) => onChange({ ...audience, section: e.target.value || undefined })}
            >
              <option value="">All Sections</option>
              {availableSections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}