import { Sparkles, Clock, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
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

const STUDENT_DOMAIN_META: Record<
  StudentDomainKey,
  { label: string; color: string }
> = {
  cognitive: { label: "cognitive", color: "#2563EB" },
  emotional: { label: "emotional", color: "#7C3AED" },
  behavioral: { label: "behavioral", color: "#B45309" },
  social: { label: "social", color: "#0D9488" },
};

// Capitalized labels for the radar's angle axis — STUDENT_DOMAIN_META's
// labels are lowercase (used inline in the narrative sentence), but the
// chart reads better with Title Case.
const DOMAIN_AXIS_LABEL: Record<StudentDomainKey, string> = {
  cognitive: "Cognitive",
  emotional: "Emotional",
  behavioral: "Behavioral",
  social: "Social",
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

// DEV/QA ONLY — forces real numbers to show even before the current term
// has ended, so you can eyeball this component against real DB data while
// building. Set back to `false` before this is anywhere a parent can see it.
const PREVIEW_MODE = true;

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
      preview={PREVIEW_MODE}
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
  const gridStroke = darkMode ? "#FFFFFF14" : "#0000000C";
  const axisColor = darkMode ? "#9CA3AF" : "#8A8F98";

  return (
    <div
      className={`flex h-[340px] flex-col overflow-hidden rounded-2xl shadow-sm ${panelBg}`}
    >
      <SectionHeader
        icon={Sparkles}
        title="Term Snapshot"
        about={`A plain-language read of ${student.firstName}'s holistic standing — averaged across cognitive, emotional, behavioral, and social ratings. This section only fills in once the quarterly report card is released.`}
        theme={theme}
      />
      <div className="flex flex-1 min-h-0 flex-col items-center overflow-hidden p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        {loading ? (
          <p
            className={`py-6 text-center text-[13px] font-medium ${textMuted}`}
          >
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
            const { compositeScore, domainScores } = snapshot;

            const withScores = domainScores.filter((d) => d.score !== null);
            const strongest = withScores.length
              ? withScores.reduce((a, b) =>
                  (b.score as number) > (a.score as number) ? b : a,
                )
              : null;
            const weakest = withScores.length
              ? withScores.reduce((a, b) =>
                  (b.score as number) < (a.score as number) ? b : a,
                )
              : null;

            // Radar only plots domains that actually have a score this term —
            // a null domain would otherwise collapse that axis to the center
            // and read as "0", which is misleading rather than "no data yet".
            const radarData = withScores.map((d) => ({
              domain: DOMAIN_AXIS_LABEL[d.domain],
              score: d.score as number,
            }));

            return radarData.length > 0 ? (
              <>
                {/* CHART — left side, full height of the row */}
                <div className="relative mx-auto aspect-square h-full max-h-full w-auto shrink-0 max-w-[180px] xs:max-w-[200px] sm:mx-0 sm:max-w-[260px]">
                  <div
                    className="pointer-events-none absolute inset-0 m-auto h-1/2 w-1/2 rounded-full opacity-25 blur-3xl"
                    style={{
                      background: `radial-gradient(circle, ${ACCENT}66 0%, ${ACCENT}22 55%, transparent 75%)`,
                    }}
                  />
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      outerRadius="65%"
                      margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
                    >
                      <defs>
                        <radialGradient
                          id="narrativeHolisticFill"
                          cx="50%"
                          cy="50%"
                          r="70%"
                        >
                          <stop
                            offset="0%"
                            stopColor={ACCENT}
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor={ACCENT}
                            stopOpacity={0.1}
                          />
                        </radialGradient>
                      </defs>
                      <PolarGrid stroke={gridStroke} strokeDasharray="3 4" />
                      <PolarAngleAxis
                        dataKey="domain"
                        tick={{
                          fill: axisColor,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 5]}
                        tick={false}
                        axisLine={false}
                        tickCount={6}
                      />
                      <Radar
                        dataKey="score"
                        stroke={ACCENT}
                        fill="url(#narrativeHolisticFill)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: ACCENT,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  {compositeScore !== null && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        className={`flex h-12 w-12 flex-col items-center justify-center rounded-full shadow-md sm:h-16 sm:w-16 ${darkMode ? "bg-[#1A1A1A]" : "bg-white"}`}
                      >
                        <span
                          className={`text-sm font-black leading-none tabular-nums sm:text-base ${textPrimary}`}
                        >
                          {compositeScore.toFixed(1)}
                        </span>
                        <span
                          className="mt-0.5 text-[7px] font-bold uppercase tracking-wider sm:text-[7.5px]"
                          style={{ color: bandFor(compositeScore).color }}
                        >
                          {bandFor(compositeScore).label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN — domain grade pills pinned top, narrative
                    text pinned bottom (justify-between splits them apart) */}
                <div className="mt-4 flex min-w-0 w-full flex-1 flex-col sm:mt-0 sm:justify-between">
                  {withScores.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                      {withScores.map((d) => (
                        <span
                          key={d.domain}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: `${STUDENT_DOMAIN_META[d.domain].color}18`,
                            color: STUDENT_DOMAIN_META[d.domain].color,
                          }}
                        >
                          {DOMAIN_AXIS_LABEL[d.domain]}
                          <span className="tabular-nums opacity-70">
                            {(d.score as number).toFixed(1)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 text-center sm:mt-0 sm:text-left">
                    <p
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
                      style={{ color: accentColor }}
                    >
                      <Sparkles size={11} />
                      {snapshot.termLabel} snapshot
                    </p>
                    <p
                      className={`mt-1 text-[13.5px] font-medium leading-relaxed ${textPrimary}`}
                    >
                      {strongest &&
                      weakest &&
                      strongest.domain !== weakest.domain ? (
                        <>
                          {student.firstName} is showing the most strength in{" "}
                          <span
                            style={{
                              color:
                                STUDENT_DOMAIN_META[strongest.domain].color,
                            }}
                          >
                            {STUDENT_DOMAIN_META[strongest.domain].label}
                          </span>
                          , while{" "}
                          <span
                            style={{
                              color: STUDENT_DOMAIN_META[weakest.domain].color,
                            }}
                          >
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
              </>
            ) : (
              <p
                className={`py-6 text-center text-[13px] font-medium ${textMuted}`}
              >
                No domain scores available yet.
              </p>
            );
          })()
        )}
      </div>
    </div>
  );
}