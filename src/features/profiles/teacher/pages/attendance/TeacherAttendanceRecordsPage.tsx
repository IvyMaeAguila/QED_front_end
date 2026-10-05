import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useOutletContext } from "react-router-dom";
import { AttendanceCalendarSection } from "./AttendanceCalendarSection";
import { AttendanceMonthSummarySection } from "./AttendanceMonthSummarySection";
import { useSelectedAdvisorySection } from "./services/useSelectedAdvisorySection.service";
import { AdvisorySectionTabs } from "./components/AdvisorySectionTabs";

export function TeacherAttendanceRecordsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { sections, section, error, selectSection } = useSelectedAdvisorySection();
  const [viewMode, setViewMode] = useState<"month" | "summary">("month");

  const cardClasses = `overflow-hidden rounded-[12px] border shadow-sm ${panelBg} ${panelBorder}`;
  const displaySectionName = section
    ? section.sectionName?.trim() || section.gradeLevel
    : "Advisory Class";

  return (
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
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>Attendance Records</h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {displaySectionName} · Click a cell to edit — changes save immediately.
              </p>
            </div>
          </div>

          {section && (
            <div className="flex items-center gap-2">
              {sections && (
                <AdvisorySectionTabs
                  sections={sections}
                  activeClassId={section.classId}
                  onSelect={selectSection}
                  darkMode={darkMode}
                  panelBorder={panelBorder}
                  textMuted={textMuted}
                />
              )}
              <div className={`qed-segmented-control flex items-center rounded-lg p-0 ${darkMode ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"}`}>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 text-[11px] font-bold rounded-lg transition-all ${
                    viewMode === "month" ? "bg-[#800000] text-white shadow-sm" : `${textMuted} hover:${textPrimary}`
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("summary")}
                  className={`px-3 text-[11px] font-bold rounded-lg transition-all ${
                    viewMode === "summary" ? "bg-[#800000] text-white shadow-sm" : `${textMuted} hover:${textPrimary}`
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className="text-xs font-semibold text-red-500">{error}</p>
          </div>
        )}

        {!error && sections === undefined && (
          <div className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}>
            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
            <p className={`text-xs font-semibold ${textMuted}`}>Loading...</p>
          </div>
        )}

        {!error && sections === null && (
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className={`text-sm font-bold ${textPrimary}`}>No advisory class assigned</p>
          </div>
        )}

        {!error && section && (
          <>
            {viewMode === "month" ? (
              <AttendanceCalendarSection
                key={section.classId}
                sectionId={section.classId}
                roster={section.roster}
                terms={section.terms}
                darkMode={darkMode}
                panelBg={panelBg}
                panelBorder={panelBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ) : (
              <AttendanceMonthSummarySection
                key={section.classId}
                sectionId={section.classId}
                roster={section.roster}
                terms={section.terms}
                darkMode={darkMode}
                panelBg={panelBg}
                panelBorder={panelBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
