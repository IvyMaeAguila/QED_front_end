import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { AttendanceCalendarSection } from "./AttendanceCalendarSection";
import { AttendanceMonthSummarySection } from "./AttendanceMonthSummarySection";
import { fetchAdvisorySection, type AdvisorySection } from "./services/attendance.service.ts";

const ACCENT = "#6B0000";

export function TeacherAttendanceRecordsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const [section, setSection] = useState<AdvisorySection | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"month" | "summary">("month");

  useEffect(() => {
    let cancelled = false;
    fetchAdvisorySection()
      .then((sec) => {
        if (!cancelled) setSection(sec);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load advisory section:", err);
        setError("Couldn't load your advisory class. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

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
                {section ? section.sectionName : "Advisory Class"}
              </p>
              <h1 className={`mt-1 text-xl font-black tracking-tight ${textPrimary}`}>Attendance Records</h1>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>Click a cell to edit — changes save immediately.</p>
            </div>
          </div>

          <div className={`flex items-center p-0.5 rounded-lg border ${panelBorder} bg-black/5 dark:bg-white/5 self-start sm:self-center`}>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === "month"
                  ? "bg-[#800000] text-white dark:text-white shadow-sm"
                  : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === "summary"
                  ? "bg-[#800000] text-white dark:text-white shadow-sm"
                  : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Summary
            </button>
          </div>
        </div>

        {error && (
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className="text-xs font-semibold text-red-500">{error}</p>
          </div>
        )}

        {!error && section === undefined && (
          <div className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}>
            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
            <p className={`text-xs font-semibold ${textMuted}`}>Loading...</p>
          </div>
        )}

        {!error && section === null && (
          <div className={`${cardClasses} px-5 py-14 text-center`}>
            <p className={`text-sm font-bold ${textPrimary}`}>No advisory class assigned</p>
          </div>
        )}

        {!error && section && (
          <>
            {viewMode === "month" ? (
              <AttendanceCalendarSection
                sectionId={section.sectionId}
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
                sectionId={section.sectionId}
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