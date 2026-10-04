import { memo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { CardViewMode, PerformanceStatus, Student } from "../types/student";

interface StudentCardProps {
  student: Student;
  view: CardViewMode;
  onView?: (student: Student) => void;
  darkMode?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Theme — same light/dark surface strings the rest of the dashboard uses     */
/* -------------------------------------------------------------------------- */

function getTheme(darkMode: boolean) {
  return {
    panelBg: darkMode ? "bg-[#111827]" : "bg-white",
    panelBorder: darkMode ? "border-white/10" : "border-black/10",
    textPrimary: darkMode ? "text-white" : "text-[#111827]",
    textMuted: darkMode ? "text-white/60" : "text-black/50",
    avatarRing: darkMode ? "ring-[#111827]" : "ring-white",
    ringOffset: darkMode
      ? "focus-visible:ring-offset-[#111827]"
      : "focus-visible:ring-offset-white",
    barTrack: darkMode ? "bg-white/10" : "bg-black/10",
  };
}

/* -------------------------------------------------------------------------- */
/* Status tokens — mapped onto the design-system palette                      */
/*   excellent -> green · good -> maroon · fair -> gold · needs help -> red   */
/* -------------------------------------------------------------------------- */

interface StatusStyle {
  label: string;
  accent: string; // CSS color for the dot + progress fill
  light: { bg: string; text: string };
  dark: { bg: string; text: string };
}

const STATUS_STYLES: Record<PerformanceStatus, StatusStyle> = {
  excellent: {
    label: "Excellent",
    accent: "var(--color-green)",
    light: { bg: "bg-green-soft", text: "text-green" },
    dark: { bg: "bg-white/10", text: "text-green" },
  },
  good: {
    label: "Good",
    accent: "var(--color-maroon)",
    light: { bg: "bg-maroon-soft", text: "text-maroon" },
    dark: { bg: "bg-white/10", text: "text-white/90" },
  },
  fair: {
    label: "Fair",
    accent: "var(--color-gold)",
    light: { bg: "bg-gold-soft", text: "text-gold-dark" },
    dark: { bg: "bg-white/10", text: "text-gold" },
  },
  needsImprovement: {
    label: "Needs Improvement",
    accent: "var(--color-red)",
    light: { bg: "bg-red-soft", text: "text-red" },
    dark: { bg: "bg-white/10", text: "text-red" },
  },
  pending: {
    label: "No Data Yet",
    accent: "rgba(128,128,128,0.5)",
    light: { bg: "bg-black/5", text: "text-black/50" },
    dark: { bg: "bg-white/10", text: "text-white/60" },
  },
};

function resolveStatus(status?: PerformanceStatus | null): PerformanceStatus {
  return status && STATUS_STYLES[status] ? status : "pending";
}

/** 0-100 integer, or null when the student has no score yet. */
function getScore(student: Student): number | null {
  const raw = student.overallScore;
  if (raw === null || raw === undefined) return null;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

const StatusBadge = memo(function StatusBadge({
  status,
  darkMode = false,
}: {
  status: PerformanceStatus;
  darkMode?: boolean;
}) {
  const style = STATUS_STYLES[resolveStatus(status)];
  const theme = darkMode ? style.dark : style.light;

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${theme.bg} ${theme.text}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.accent }}
      />
      {style.label}
    </span>
  );
});

function ScoreBar({
  score,
  accent,
  trackClass,
  className = "",
}: {
  score: number | null;
  accent: string;
  trackClass: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        score === null ? "No score yet" : `Overall score ${score} percent`
      }
      className={`h-1.5 w-full overflow-hidden rounded-full ${trackClass} ${className}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${score ?? 0}%`, backgroundColor: accent }}
      />
    </div>
  );
}

function Stat({
  value,
  label,
  textPrimary,
  textMuted,
}: {
  value: string;
  label: string;
  textPrimary: string;
  textMuted: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span
        className={`wrap-break-word text-sm font-black leading-tight tabular-nums ${textPrimary}`}
        title={value}
      >
        {value}
      </span>
      <p
        className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
      >
        {label}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

function StudentCard({
  student,
  view,
  onView,
  darkMode = false,
}: StudentCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = getTheme(darkMode);

  const status = resolveStatus(student.performanceStatus);
  const statusStyle = STATUS_STYLES[status];
  const score = getScore(student);
  const scoreText = score === null ? "–" : `${score}%`;

  const gradeSection = [student.gradeLevel, student.section]
    .filter(Boolean)
    .join(" - ");
  const viewLabel = student.fullName
    ? `View ${student.fullName}`
    : "View student";

  // Notifies the parent (e.g. for analytics/state updates) if it passed an
  // onView handler, then redirects to that student's overview page.
  // Derives the role prefix (admin | teacher | parent) from the current
  // path so this card works correctly no matter which section renders it.
  const handleView = useCallback(() => {
    onView?.(student);
    const rolePrefix = location.pathname.split("/")[1];
    navigate(`/${rolePrefix}/students/${student.id}`);
  }, [onView, student, location.pathname, navigate]);

  const focusClasses = `focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2 ${t.ringOffset}`;

  /* ------------------------------ List layout ------------------------------ */
  if (view === "list") {
    return (
      <article
        className={`flex items-center gap-3 rounded-xl2 border p-4 shadow-card transition-shadow hover:shadow-panel sm:gap-4 ${t.panelBg} ${t.panelBorder}`}
      >
        <StudentAvatar gender={student.gender} name={student.fullName ?? ""} />

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-bold ${t.textPrimary}`}
            title={student.fullName}
          >
            {student.fullName}
          </p>
          <p className={`mt-0.5 truncate text-xs ${t.textMuted}`}>
            {gradeSection}
          </p>
          {student.adviser && (
            <p className={`truncate text-xs ${t.textMuted}`}>
              {student.adviser}
            </p>
          )}
          {/* Small screens: badge + score under the details */}
          <div className="mt-1.5 flex items-center gap-2 sm:hidden">
            <StatusBadge status={status} darkMode={darkMode} />
            <span
              className={`text-xs font-black tabular-nums ${t.textPrimary}`}
            >
              {scoreText}
            </span>
          </div>
        </div>

        <div className="hidden sm:block">
          <StatusBadge status={status} darkMode={darkMode} />
        </div>

        <div className="hidden w-28 shrink-0 flex-col gap-1.5 sm:flex">
          <div className="flex items-baseline justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted}`}
            >
              Score
            </span>
            <span
              className={`text-sm font-black tabular-nums ${t.textPrimary}`}
            >
              {scoreText}
            </span>
          </div>
          <ScoreBar
            score={score}
            accent={statusStyle.accent}
            trackClass={t.barTrack}
          />
        </div>

        <button
          type="button"
          onClick={handleView}
          aria-label={viewLabel}
          className={`shrink-0 rounded-lg bg-maroon-dark px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-maroon ${focusClasses}`}
        >
          View
        </button>
      </article>
    );
  }

  /* ------------------------------ Grid layout ------------------------------ */
  return (
    <article
      className={`flex flex-col rounded-xl2 border p-3 shadow-card transition-shadow hover:shadow-panel ${t.panelBg} ${t.panelBorder}`}
    >
      {/* Banner: the system's maroon gradient with a soft highlight */}
      <div
        aria-hidden="true"
        className="relative h-24 overflow-hidden rounded-xl2 bg-maroon-gradient"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(at 85% 8%, rgba(255,255,255,.22) 0, transparent 55%), radial-gradient(at 8% 100%, rgba(0,0,0,.28) 0, transparent 60%)",
          }}
        />
      </div>

      <div className="px-2">
        <div
          className={`relative z-10 -mt-8 h-16 w-16 overflow-hidden rounded-full ring-4 ${t.avatarRing} *:h-full *:w-full`}
        >
          <StudentAvatar gender={student.gender} name={student.fullName ?? ""} />
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`truncate text-base font-bold ${t.textPrimary}`}
              title={student.fullName}
            >
              {student.fullName}
            </p>
            {student.adviser && (
              <p
                className={`truncate text-xs ${t.textMuted}`}
                title={student.adviser}
              >
                {student.adviser}
              </p>
            )}
          </div>
          <StatusBadge status={status} darkMode={darkMode} />
        </div>

        {/* Key facts */}
        <div
          className={`mt-3 grid grid-cols-3 gap-2 border-t pt-3 ${t.panelBorder}`}
        >
          <Stat
            value={scoreText}
            label="Score"
            textPrimary={t.textPrimary}
            textMuted={t.textMuted}
          />
          <Stat
            value={
              student.gradeLevel
                ? String(student.gradeLevel).replace(/^grade\s*/i, "") || "–"
                : "–"
            }
            label="Grade"
            textPrimary={t.textPrimary}
            textMuted={t.textMuted}
          />
          <Stat
            value={student.section ? String(student.section) : "–"}
            label="Section"
            textPrimary={t.textPrimary}
            textMuted={t.textMuted}
          />
        </div>

        <ScoreBar
          score={score}
          accent={statusStyle.accent}
          trackClass={t.barTrack}
          className="mt-3"
        />
      </div>

      {/* Primary action */}
      <button
        type="button"
        onClick={handleView}
        aria-label={viewLabel}
        className={`group mt-4 flex w-full items-center gap-3 rounded-lg bg-maroon-gradient p-1.5 text-white shadow-primary transition hover:brightness-110 ${focusClasses}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-maroon-dark">
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </span>
        <span className="flex-1 pr-9 text-center text-xs font-bold uppercase tracking-wide">
          View profile
        </span>
      </button>
    </article>
  );
}

export default memo(StudentCard);
