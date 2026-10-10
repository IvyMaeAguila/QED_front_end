import { useState } from "react";
import { GraduationCap, MoreVertical, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { SchoolClass } from "../types/Class";
import { formatClassName, formatTimeRange } from "../types/Class";

import { SkeletonText } from "@shared/components/SkeletonLoading";

const PALETTE = {
  gradientFrom: "var(--color-maroon)",
  gradientTo: "var(--brand-secondary)",
  white: "var(--brand-light)",
};

interface ClassCardProps {
  loading?: boolean;
  schoolClass: SchoolClass;
  adviserName: string;
  room: string;
  studentCount: number;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClassCard({
  loading = false,
  schoolClass,
  adviserName,
  room,
  studentCount,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onView,
  onEdit,
  onDelete,
}: ClassCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstPeriod = schoolClass.schedule[0];
  const lastPeriod = schoolClass.schedule[schoolClass.schedule.length - 1];
  const scheduleLabel = firstPeriod
    ? `${schoolClass.schedule.length} period${schoolClass.schedule.length === 1 ? "" : "s"} • ${formatTimeRange(firstPeriod.startTime, lastPeriod.endTime)}`
    : "No schedule set";

  const className = formatClassName(schoolClass);
  // gradeLevel may be a label like "Grade 1", so keep only the number; fall back to the class name.
  const rawGrade = (schoolClass as unknown as Record<string, unknown>).gradeLevel;
  const gradeSource = rawGrade != null ? String(rawGrade) : className;
  const gradeLevel = gradeSource.match(/\d+/)?.[0] ?? className.match(/\d+/)?.[0] ?? gradeSource.charAt(0).toUpperCase();

  const dividerColor = darkMode ? "rgba(255,255,255,0.12)" : "color-mix(in srgb, var(--brand-primary) 15%, transparent)";

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className={`shrink-0 ${textMuted}`}>{label}</span>
      <span className={`font-medium text-right truncate ${textPrimary}`} title={value} data-sk-region="classcard-span-field-1">
        {loading ? <SkeletonText width="10ch" /> : value}
      </span>
    </div>
  );

  return (
    <div
      onDoubleClick={loading ? undefined : onView}
      className={`relative flex min-h-68 rounded-2xl border transition-shadow select-none ${panelBorder} ${panelBg}`}
      style={{
        boxShadow: darkMode
          ? "0 10px 24px -8px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3)"
          : "0 12px 26px -10px color-mix(in srgb, var(--brand-primary) 28%, transparent), 0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Left: content */}
      <div className="flex-1 min-w-0 mr-14 px-4 sm:px-5 pt-5 pb-4 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              border: `1.5px solid ${darkMode ? `color-mix(in srgb, ${PALETTE.white} 53.33%, transparent)` : PALETTE.gradientFrom}`,
              color: darkMode ? PALETTE.white : PALETTE.gradientFrom,
            }}
          >
            <GraduationCap size={20} />
          </span>

          <div className="relative shrink-0" onDoubleClick={(e) => e.stopPropagation()}>
            <button
              disabled={loading}
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                darkMode ? "text-white/70 hover:bg-white/10" : "text-brand-ink/70 hover:bg-maroon-light/10"
              }`}
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                className={`absolute right-0 top-9 z-10 w-40 max-w-[calc(100vw-2rem)] rounded-xl border shadow-lg py-1 ${
                  darkMode ? "bg-[#241012] border-[#4A2226]" : "bg-white border-[#E8DFC8]"
                }`}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                    darkMode ? "text-[#D8B978] hover:bg-white/5" : "text-[#7A1420] hover:bg-[#FBF4E4]"
                  }`} data-sk-region="classcard-edit-class" data-sk-static=""
                >
                  <Pencil size={13} />
                  Edit Class
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#E08585] hover:bg-white/5 flex items-center gap-2" data-sk-region="classcard-delete-class" data-sk-static=""
                >
                  <Trash2 size={13} />
                  Delete Class
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title + divider (subject card lettering) */}
        <h3 className={`qed-type-card-title mt-4 leading-snug truncate ${textPrimary}`} title={className} data-sk-region="classcard-h3-field-2">
          {loading ? <SkeletonText width="68%" /> : className}
        </h3>
        <div className="mt-2 h-px w-full" style={{ background: dividerColor }} />
        <p className={`qed-type-metadata mt-2 ${textMuted}`} data-sk-region="classcard-p-field-3">{loading ? <SkeletonText width="6ch" /> : <>{studentCount} students</>}</p>

        {/* Details */}
        <div className="mt-auto pt-4 space-y-2.5">
          <Row label="Adviser" value={adviserName} />
          <Row label="Schedule" value={scheduleLabel} />
          <Row label="Room" value={room} />
        </div>
      </div>

      {/* Right: maroon tab */}
      <div
        className="absolute -top-px -right-px -bottom-px w-14 flex flex-col rounded-r-2xl overflow-hidden"
        style={{
          background: "var(--color-maroon)",
          boxShadow: "inset 2px 0 4px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="h-14 shrink-0 flex items-center justify-center text-2xl font-bold leading-none"
          style={{ background: "rgba(0,0,0,0.22)", color: PALETTE.white }} data-sk-region="classcard-div-field-4"
        >
          {loading ? <SkeletonText className="sk-surface-brand" width="1ch" /> : gradeLevel}
        </div>
        <div
          className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 text-lg font-extrabold leading-none tracking-normal"
          style={{ color: PALETTE.white }}
          aria-hidden="true"
        >
          {"GRADE".split("").map((letter, i) => (
            <span key={i}>{letter}</span>
          ))}
        </div>
        <button
          onClick={onView}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-label="View details"
          title="View details"
          className="group h-14 shrink-0 flex items-center justify-center text-white transition-colors hover:bg-black/30 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-white"
          style={{ background: "rgba(0,0,0,0.22)" }}
        >
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
