import type { AdvisorySection } from "../services/attendance.service";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { lastKnownCount, rememberRows } from "@shared/loading/reservations";

interface Props {
  sections: AdvisorySection[];
  activeClassId: string;
  onSelect: (classId: string) => void;
  darkMode: boolean;
  panelBorder: string;
  textMuted: string;
  loading?: boolean;
}

export function AdvisorySectionTabs({ sections, activeClassId, onSelect, darkMode, panelBorder, textMuted, loading }: Props) {
  const render = (pending: boolean) => {
    const choices = pending ? Array.from({length: lastKnownCount("teacher-advisory-tabs", 2)}, (_, index) => ({classId: `pending-${index}`, sectionName: "", gradeLevel: ""})) : sections;
    // The original tabs only appear for teachers with multiple advisory classes.
    if (choices.length < 2) return null;
    return <div className={`flex items-center gap-1 rounded-[12px] border p-1 ${panelBorder}`}>
      {choices.map((section, index) => {
        const label = section.sectionName?.trim() || section.gradeLevel;
        const active = section.classId === activeClassId;
        return <button key={section.classId} disabled={pending} onClick={() => onSelect(section.classId)} data-sk-region="advisory-tab"
          className={`h-8 rounded-lg px-3 text-xs font-extrabold transition-colors ${active ? "bg-maroon text-white" : `${textMuted} ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}`}>
          {pending ? <SkeletonText width={index % 2 ? "9ch" : "7ch"} /> : label}
        </button>;
      })}
    </div>;
  };
  if (loading === undefined) return render(false);
  return <LoadingRegion loading={loading} name="advisory-tabs" variable skeleton={null} frame={render} onSettled={() => rememberRows("teacher-advisory-tabs", sections.length)}>{null}</LoadingRegion>;
}
