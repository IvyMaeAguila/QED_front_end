import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { AttendanceCalendarSection } from "./AttendanceCalendarSection";
import { AttendanceMonthSummarySection } from "./AttendanceMonthSummarySection";
import { AdvisorySectionTabs } from "./components/AdvisorySectionTabs";
import { useSelectedAdvisorySection } from "./services/useSelectedAdvisorySection.service";

function useTeacherAttendanceRecordsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { sections, section, error, selectSection, retry } = useSelectedAdvisorySection();
  const [viewMode, setViewMode] = useState<"month" | "summary">("month");

  const cardClasses = `overflow-hidden rounded-[12px] border shadow-sm ${panelBg} ${panelBorder}`;
  const displaySectionName = section
    ? section.sectionName?.trim() || section.gradeLevel
    : "Advisory Class";

  return { content: ((
    <div className="w-full min-h-full pb-10">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => navigate("/teacher/attendance")}
              aria-label="Go back"
              className={`system-back-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${panelBg} ${panelBorder} ${textMuted} ${
                darkMode ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5 hover:text-black"
              }`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 data-sk-region="attendance-records-title" data-sk-static="" className={`qed-type-page-title ${textPrimary}`}>Attendance Records</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                <LoadingRegion as="span" loading={sections === undefined && !error} name="attendance-records-section" variable skeleton={<SkeletonParagraph field="attendance-records-section" typical={2} width="16ch" inline />}><span data-sk-field="attendance-records-section">{displaySectionName}</span></LoadingRegion> · <span data-sk-static="">Click a cell to edit — changes save immediately.</span>
              </p>
            </div>
          </div>

          {sections !== null && (
            <div className="flex items-center gap-2">
              {!error && (
                <AdvisorySectionTabs
                  sections={sections ?? []}
                  loading={sections === undefined}
                  activeClassId={section?.classId ?? ""}
                  onSelect={selectSection}
                  darkMode={darkMode}
                  panelBorder={panelBorder}
                  textMuted={textMuted}
                />
              )}
              <div className={`qed-segmented-control flex items-center rounded-lg p-0 ${darkMode ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"}`}>
                <button
                  data-sk-static="" data-sk-region="attendance-records-month-control" onClick={() => setViewMode("month")}
                  className={`px-3 text-xs font-bold rounded-lg transition-all ${
                    viewMode === "month" ? "bg-maroon text-white shadow-sm" : `${textMuted} hover:${textPrimary}`
                  }`}
                >
                  Month
                </button>
                <button
                  data-sk-static="" data-sk-region="attendance-records-summary-control" onClick={() => setViewMode("summary")}
                  className={`px-3 text-xs font-bold rounded-lg transition-all ${
                    viewMode === "summary" ? "bg-maroon text-white shadow-sm" : `${textMuted} hover:${textPrimary}`
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>
          )}
        </div>

        <LoadingRegion key={viewMode} loading={sections === undefined && !error} error={error} retry={retry} name="attendance-records-roster" variable skeleton={null} frame={pending => !pending && !section ? (
          <div className={`${cardClasses} px-5 py-14 text-center`}><p className={`text-sm font-bold ${textPrimary}`}>No advisory class assigned</p></div>
        ) : viewMode === "month" ? <AttendanceCalendarSection sectionId={section?.classId ?? ""} roster={pending ? [] : section?.roster ?? []} terms={pending ? [] : section?.terms ?? []} prerequisitesLoading={pending} darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} /> : <AttendanceMonthSummarySection sectionId={section?.classId ?? ""} roster={pending ? [] : section?.roster ?? []} terms={pending ? [] : section?.terms ?? []} prerequisitesLoading={pending} darkMode={darkMode} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} textMuted={textMuted} />}>{null}</LoadingRegion>

      </div>
    </div>
  )), scope: {  } };
}




export type TeacherAttendanceRecordsPageEffectScope = ReturnType<typeof useTeacherAttendanceRecordsPageState>["scope"];
export type TeacherAttendanceRecordsPageRouteProps = Record<string, never>;
export function TeacherAttendanceRecordsPageComposition(props: object & { effects?: (scope: TeacherAttendanceRecordsPageEffectScope) => import("react").ReactNode }) {
 const state = useTeacherAttendanceRecordsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
