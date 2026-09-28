import { CalendarDays, Plus, School } from "lucide-react";

interface SubjectActionsProps {
  darkMode: boolean;
  onAcademicYear: () => void;
  onManageSections: () => void;
  onAddSubject: () => void;
}

// Header action group for the Manage Subjects page. Kept separate from
// SubjectFilters so filtering and page actions don't get mixed together.
export function SubjectActions({
  darkMode,
  onAcademicYear,
  onManageSections,
  onAddSubject,
}: SubjectActionsProps) {
  const secondary = `h-8 px-3 rounded-lg border text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] hover:bg-[#F1F5F9]"
  }`;

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <button type="button" onClick={onAcademicYear} className={secondary}>
        <CalendarDays size={13} />
        Academic Year
      </button>
      <button type="button" onClick={onManageSections} className={secondary}>
        <School size={13} />
        Manage Sections
      </button>
      <button
        type="button"
        onClick={onAddSubject}
        className="h-8 px-3 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1.5 shrink-0 transition-colors hover:bg-[#6B0000]"
        style={{ background: "#8B0D0D" }}
      >
        <Plus size={13} />
        Add Subject
      </button>
    </div>
  );
}