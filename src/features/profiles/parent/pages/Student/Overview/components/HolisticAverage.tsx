import { Clock, Lock, Sparkles } from "lucide-react";
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

// Display labels for the domain rating cards.
const DOMAIN_AXIS_LABEL: Record<StudentDomainKey, string> = {
  cognitive: "Cognitive",
  emotional: "Emotional",
  behavioral: "Behavioral",
  social: "Social",
};

const BANDS = [
  { from: 4.5, to: 5.01, label: "Excellent", color: "#22C55E" },
  { from: 3.5, to: 4.5, label: "Good", color: "#34D399" },
  { from: 2.5, to: 3.5, label: "Average", color: "#F59E0B" },
  { from: 1.5, to: 2.5, label: "Needs Improvement", color: "#FB923C" },
  { from: 1.0, to: 1.5, label: "Critical", color: "#EF4444" },
];

function bandFor(value: number) {
  return BANDS.find((b) => value >= b.from && value < b.to) ?? BANDS[2];
}

const DOMAIN_INTERPRETATIONS: Record<StudentDomainKey, Record<1 | 2 | 3 | 4 | 5, string>> = {
  cognitive: {
    5: "Understands and applies concepts independently",
    4: "Understands most concepts with minimal guidance",
    3: "Understands basic concepts but needs support",
    2: "Struggles to understand lessons",
    1: "Cannot yet demonstrate understanding",
  },
  emotional: {
    5: "Highly motivated and confident",
    4: "Generally positive and engaged",
    3: "Sometimes disengaged or unsure",
    2: "Frequently unmotivated",
    1: "Shows a negative attitude toward learning",
  },
  behavioral: {
    5: "Consistently follows rules and stays focused",
    4: "Generally disciplined with minor issues",
    3: "Sometimes distracted",
    2: "Frequently disruptive",
    1: "Behavior regularly needs support",
  },
  social: {
    5: "Actively collaborates and leads",
    4: "Works well with peers",
    3: "Participates occasionally",
    2: "Rarely interacts with peers",
    1: "Needs support participating with others",
  },
};

function interpretationFor(domain: StudentDomainKey, score: number) {
  const rounded = Math.min(5, Math.max(1, Math.round(score))) as 1 | 2 | 3 | 4 | 5;
  return DOMAIN_INTERPRETATIONS[domain][rounded];
}

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
    >
      <StudentNarrativeSnapshotContent
        student={student}
        theme={theme}
      />
    </StudentNarrativeSnapshotProvider>
  );
}

function StudentNarrativeSnapshotContent({
  student,
  theme,
}: StudentNarrativeSnapshotProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const { snapshot, loading } = useStudentNarrativeSnapshot();

  const accentColor = darkMode ? "#F87171" : ACCENT;

  return (
    <div
      className={`flex min-h-[340px] flex-col rounded-xl2 shadow-sm ${panelBg}`}
    >
      <SectionHeader
        title="Term Snapshot"
        subtitle="Current holistic evaluation across development domains."
        about={`A live summary of ${student.firstName}'s cognitive, emotional, behavioral, and social evaluations for the active term.`}
        theme={theme}
      />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {loading ? (
          <p
            className={`py-6 text-center text-sm font-medium ${textMuted}`}
          >
            Loading…
          </p>
        ) : !snapshot ? (
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

            return withScores.length > 0 ? (
              <div className="grid w-full flex-1 gap-4 sm:grid-cols-[minmax(190px,0.75fr)_minmax(0,1.25fr)]">
                <div
                  className={`flex min-h-[220px] flex-col items-center justify-center rounded-xl2 border px-4 py-5 text-center ${darkMode ? "border-[#374151] bg-[#111827]" : "border-gray-200 bg-gray-50"}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
                    Overall holistic rating
                  </p>
                  {compositeScore !== null && (
                    <p className="mt-4 text-3xl font-bold" style={{ color: ACCENT }}>
                      {bandFor(compositeScore).label}
                    </p>
                  )}
                  <p className={`mt-1 text-xs ${textMuted}`}>
                    Across {withScores.length} development {withScores.length === 1 ? "domain" : "domains"}
                  </p>
                </div>

                <div className="flex min-w-0 flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {withScores.map((d) => {
                      const domain = STUDENT_DOMAIN_META[d.domain];
                      const score = d.score as number;
                      const band = bandFor(score);
                      return (
                        <div
                          key={d.domain}
                          className={`flex min-w-0 flex-col gap-2 rounded-xl2 border p-3 ${darkMode ? "border-[#374151] bg-[#111827]" : "border-gray-200 bg-white"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold" style={{ color: domain.color }}>
                              {DOMAIN_AXIS_LABEL[d.domain]}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                              style={{
                                color: band.color,
                                backgroundColor: `${band.color}18`,
                              }}
                            >
                              {band.label}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${textMuted}`}>
                            {interpretationFor(d.domain, score)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`border-t pt-3 ${panelBorder}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                      {snapshot.termLabel} snapshot
                    </p>
                    <p className={`mt-1 text-sm font-medium leading-relaxed ${textPrimary}`}>
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
                        `${student.firstName}'s development ratings are holding steady this term.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className={`py-6 text-center text-sm font-medium ${textMuted}`}>
                No domain scores available yet.
              </p>
            );          })()
        )}
      </div>
    </div>
  );
}
