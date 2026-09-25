import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useOutletContext } from "react-router-dom";
import { AttendanceCalendarSection } from "./AttendanceCalendarSection";
import { AttendanceMonthSummarySection } from "./AttendanceMonthSummarySection";
import { useSelectedAdvisorySection } from "./services/useSelectedAdvisorySection.service";
import { AdvisorySectionTabs } from "./components/AdvisorySectionTabs";

const ACCENT = "#6B0000";

export function TeacherAttendanceRecordsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { sections, section, error, selectSection } = useSelectedAdvisorySection();
  const [viewMode, setViewMode] = useState<"month" | "summary">("month");

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const displaySectionName = section
    ? section.sectionName?.trim() || section.gradeLevel
    : "Advisory Class";

  return (
    <div className="w-full min-h-full pb-10">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <button onClick={() => navigate("/teacher/attendance")} aria-label="Go back" className={`mt-1 shrink-0 ${textMuted} hover:${textPrimary}`}>
              <ChevronLeft size={22} />
            </button>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                {displaySectionName}
              </p>
              <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>Attendance Records</h1>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>Click a cell to edit — changes save immediately.</p>
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
              <div className={`flex items-center p-0.5 rounded-lg border ${panelBorder} bg-black/5 dark:bg-white/5`}>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    viewMode === "month" ? "bg-[#800000] text-white shadow-sm" : `${textMuted} hover:${textPrimary}`
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("summary")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
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