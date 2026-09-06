// src/features/holistic/components/HolisticAverage.tsx

import { Sparkles, Clock, Lock } from "lucide-react";
import SectionHeader from "../../../ui/SectionHeader";
import EmptyState from "../components/EmptyState";
import {
  StudentNarrativeSnapshotProvider,
  useStudentNarrativeSnapshot,
} from "../context/HolisticAverageContext";
import type { StudentDomainKey } from "../types/holisticAverageType";
import type { DetailStudent } from "../../GlobalTypes/types";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

const ACCENT = "#6B0000";

const STUDENT_DOMAIN_META: Record<StudentDomainKey, { label: string; color: string }> = {
  cognitive: { label: "cognitive", color: "#2563EB" },
  emotional: { label: "emotional", color: "#7C3AED" },
  behavioral: { label: "behavioral", color: "#B45309" },
};

const BANDS = [
  { from: 4.5, to: 5.0, label: "Excellent", color: "#22C55E" },
  { from: 3.5, to: 4.5, label: "Good", color: "#34D399" },
  { from: 2.5, to: 3.5, label: "Average", color: "#F59E0B" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", color: "#FB923C" },
  { from: 1.0, to: 1.5, label: "Critical", color: "#EF4444" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.from && value <= b.to) ?? BANDS[2];
}

// TODO: swap this for the student's actual current term number once that
// field exists on DetailStudent — hardcoded to 1 for the mockup, same as
// PerformanceAnalytics defaulting to MOCK_TERMS[MOCK_TERMS.length - 1].
const CURRENT_TERM_NUMBER = 1;

interface StudentNarrativeSnapshotProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

/**
 * Public component — wraps the actual content with its own context
 * provider so callers just do <StudentNarrativeSnapshot student={...} theme={...} />
 * without needing to also wrap a Provider themselves.
 */
export default function StudentNarrativeSnapshot({
  student,
  theme,
}: StudentNarrativeSnapshotProps) {
  return (
    <StudentNarrativeSnapshotProvider
      studentId={student.id}
      termNumber={CURRENT_TERM_NUMBER}
    >
      <StudentNarrativeSnapshotContent student={student} theme={theme} />
    </StudentNarrativeSnapshotProvider>
  );
}

function StudentNarrativeSnapshotContent({
  student,
  theme,
}: StudentNarrativeSnapshotProps) {
  const { darkMode, panelBg, textPrimary, textMuted } = theme;
  const { snapshot, loading, error } = useStudentNarrativeSnapshot();

  const accentColor = darkMode ? "#F87171" : ACCENT;

  return (
    <div className={`flex flex-1 flex-col overflow-hidden rounded-2xl shadow-sm ${panelBg}`}>
      <SectionHeader
        icon={Sparkles}
        title="Narrative Snapshot"
        about={`A plain-language read of ${student.firstName}'s holistic standing — averaged across cognitive, emotional, and behavioral ratings. This section only fills in once the quarterly report card is released.`}
        theme={theme}
      />
      <div className="flex flex-1 flex-col justify-center p-5">
        {loading ? (
          <p className={`py-6 text-center text-[13px] font-medium ${textMuted}`}>
            Loading…
          </p>
        ) : error || !snapshot ? (
          <EmptyState
            icon={Sparkles}
            message={`No holistic data available yet for ${student.firstName}.`}
            theme={theme}
          />
        ) : snapshot.reportCardStatus !== "released" ? (
          <EmptyState
            icon={snapshot.reportCardStatus === "processing" ? Clock : Lock}
            message={
              snapshot.reportCardStatus === "processing"
                ? `${student.firstName}'s report card is being finalized. The narrative snapshot will appear here once released.`
                : `${student.firstName}'s report card hasn't been released yet. The narrative snapshot will appear here once it is.`
            }
            theme={theme}
          />
        ) : (
          (() => {
            const { compositeScore, previousCompositeScore, domainScores } = snapshot;

            const withScores = domainScores.filter((d) => d.score !== null);
            const strongest = withScores.length
              ? withScores.reduce((a, b) => ((b.score as number) > (a.score as number) ? b : a))
              : null;
            const weakest = withScores.length
              ? withScores.reduce((a, b) => ((b.score as number) < (a.score as number) ? b : a))
              : null;

            const delta =
              compositeScore !== null && previousCompositeScore !== null
                ? Math.round((compositeScore - previousCompositeScore) * 10) / 10
                : null;
            const deltaColor =
              delta === null ? undefined : delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : "#9CA3AF";

            return (
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
                {compositeScore !== null && (
                  <div className="flex shrink-0 items-center gap-3">
                    <div
                      className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: `${bandFor(compositeScore).color}55`,
                        backgroundColor: `${bandFor(compositeScore).color}0F`,
                      }}
                    >
                      <span className={`text-3xl font-semibold tabular-nums ${textPrimary}`}>
                        {compositeScore.toFixed(1)}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: bandFor(compositeScore).color }}
                      >
                        {bandFor(compositeScore).label}
                      </span>
                    </div>
                  </div>
                )}

                <div className="min-w-0 flex-1 sm:ml-4">
                  <p
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    <Sparkles size={11} />
                    {snapshot.termLabel} snapshot
                  </p>
                  <p className={`mt-1 text-[13.5px] font-medium leading-relaxed ${textPrimary}`}>
                    {strongest && weakest && strongest.domain !== weakest.domain ? (
                      <>
                        {student.firstName} is showing the most strength in{" "}
                        <span style={{ color: STUDENT_DOMAIN_META[strongest.domain].color }}>
                          {STUDENT_DOMAIN_META[strongest.domain].label}
                        </span>
                        , while{" "}
                        <span style={{ color: STUDENT_DOMAIN_META[weakest.domain].color }}>
                          {STUDENT_DOMAIN_META[weakest.domain].label}
                        </span>{" "}
                        is the domain most worth a closer look this term.
                      </>
                    ) : (
                      `${student.firstName}'s domain scores are holding steady this term.`
                    )}
                  </p>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}