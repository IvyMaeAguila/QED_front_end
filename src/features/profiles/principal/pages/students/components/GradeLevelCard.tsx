import { ArrowRight, GraduationCap } from "lucide-react";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardProps {
  gradeLevel: GradeLevelSummary;
  onViewClassList: (gradeLevel: GradeLevelSummary) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

const PALETTE = {
  gradientFrom: "#550000",
  gradientTo: "#9D0000",
  white: "#F2F4F7",
};

export function GradeLevelCard({
  gradeLevel,
  onViewClassList,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeLevelCardProps) {
  const title = gradeLevel.grade && gradeLevel.section
    ? `${gradeLevel.grade} - ${gradeLevel.section}`
    : gradeLevel.grade || gradeLevel.section || "Grade level";
  const gradeNumber = gradeLevel.grade.match(/\d+/)?.[0] ?? "•";
  const count = gradeLevel.totalStudents;
  const rowClass = "flex items-baseline justify-between gap-4 text-xs";

  return (
    <article
      className={`relative flex min-h-68 select-none rounded-2xl border transition-shadow ${panelBorder} ${panelBg}`}
      style={{
        boxShadow: darkMode
          ? "0 10px 24px -8px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3)"
          : "0 12px 26px -10px rgba(85,0,0,0.28), 0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <div className="mr-14 flex min-w-0 flex-1 flex-col px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{
              border: `1.5px solid ${darkMode ? `${PALETTE.white}88` : PALETTE.gradientFrom}`,
              color: darkMode ? PALETTE.white : PALETTE.gradientFrom,
            }}
          >
            <GraduationCap size={20} />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${darkMode ? "bg-white/10 text-white/80" : "bg-[#F8FAFC] text-[#6B7280]"}`}>
            {gradeLevel.classId !== null ? "Class assigned" : "Grade roster"}
          </span>
        </div>

        <h2 className={`mt-4 truncate text-base font-semibold leading-snug ${textPrimary}`} title={title}>{title}</h2>
        <div className={`mt-2 h-px w-full ${darkMode ? "bg-white/10" : "bg-[#EADADA]"}`} />
        <p className={`mt-2 text-xs ${textMuted}`}>{count} student{count === 1 ? "" : "s"}</p>

        <div className="mt-auto space-y-2.5 pt-4">
          <div className={rowClass}>
            <span className={`shrink-0 ${textMuted}`}>Grade level</span>
            <span className={`truncate text-right font-medium ${textPrimary}`}>{gradeLevel.grade || "Not assigned"}</span>
          </div>
          <div className={rowClass}>
            <span className={`shrink-0 ${textMuted}`}>Section</span>
            <span className={`truncate text-right font-medium ${textPrimary}`}>{gradeLevel.section || "Unassigned"}</span>
          </div>
          <div className={rowClass}>
            <span className={`shrink-0 ${textMuted}`}>Student records</span>
            <span className={`truncate text-right font-medium ${textPrimary}`}>{count} enrolled</span>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-px -top-px -bottom-px flex w-14 flex-col overflow-hidden rounded-r-2xl"
        style={{
          background: `linear-gradient(180deg, ${PALETTE.gradientFrom} 0%, ${PALETTE.gradientTo} 100%)`,
          boxShadow: "inset 2px 0 4px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex h-14 shrink-0 items-center justify-center text-2xl font-bold leading-none" style={{ background: "rgba(0,0,0,0.22)", color: PALETTE.white }}>
          {gradeNumber}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-4 text-lg font-extrabold leading-none" style={{ color: PALETTE.white }} aria-hidden="true">
          {"GRADE".split("").map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
        </div>
        <button
          type="button"
          onClick={() => onViewClassList(gradeLevel)}
          aria-label={`View class list for ${title}`}
          title="View class list"
          className="group flex h-14 shrink-0 items-center justify-center text-white transition-colors hover:bg-black/30 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-white"
          style={{ background: "rgba(0,0,0,0.22)" }}
        >
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}
