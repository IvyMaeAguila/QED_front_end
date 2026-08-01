import { useState, useEffect } from "react";
import { GraduationCap, Users, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { SchoolClass } from "../types/Class";
import { formatClassName, formatTimeRange } from "../types/Class";

const PALETTE = {
  gradientFrom: "#550000", 
  gradientTo: "#9D0000",   
  white: "#F2F4F7",
  goldMuted: "#9C8248",
  gray: "#9CA3AF"
};

interface ClassCardProps {
  schoolClass: SchoolClass;
  adviserName: string;
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
  schoolClass,
  adviserName,
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

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${panelBorder}`}>
      <div
        className="px-4 sm:px-5 pt-5 pb-6 relative"
        style={{ background: `linear-gradient(160deg, ${PALETTE.gradientFrom} 0%, ${PALETTE.gradientTo} 100%)` }}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1.5px solid ${PALETTE.white}66`,
              color: PALETTE.white,
            }}
          >
            <GraduationCap size={22} />
          </span>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
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
                  }`}
                >
                  <Pencil size={13} />
                  Edit Class
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#E08585] hover:bg-white/5 flex items-center gap-2"
                >
                  <Trash2 size={13} />
                  Delete Class
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-white leading-tight truncate" title={formatClassName(schoolClass)}>
          {formatClassName(schoolClass)}
        </h3>

        <div className="mt-5 flex items-center gap-1.5 text-white/85 min-w-0">
          <Users size={14} className="shrink-0" />
          <span className="text-sm truncate">{studentCount} students</span>
        </div>
      </div>

      <div className={`px-4 sm:px-5 py-4 space-y-3 ${panelBg}`}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className={`shrink-0 ${textMuted}`}>Adviser</span>
          <span className={`font-semibold text-right truncate ${textPrimary}`} title={adviserName}>
            {adviserName}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className={`inline-flex items-center gap-1.5 shrink-0 ${textMuted}`}>
            <Clock size={13} />
            Schedule
          </span>
          <span className={`font-semibold text-right truncate ${textPrimary}`} title={scheduleLabel}>
            {scheduleLabel}
          </span>
        </div>

        <button
          onClick={onView}
          className="w-full mt-2 h-11 rounded-xl text-sm font-normal border inline-flex items-center justify-center gap-2 transition-colors"
          style={{
            borderColor: darkMode ? PALETTE.gray : "#9CA3AF",
            color: darkMode ? "#F2F4F7" : "#650000",
            background: darkMode ? "#650000" : "#F8FAFC",
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}