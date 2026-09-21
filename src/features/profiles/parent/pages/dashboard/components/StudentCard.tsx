import { useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, User } from "lucide-react";
import type { CardViewMode, PerformanceStatus, Student } from "../types/student";
import CircularProgress from "../../ui/CircularProgress";

interface StudentCardProps {
  student: Student;
  view: CardViewMode;
  onView?: (student: Student) => void;
  darkMode?: boolean;
}

const STATUS_STYLES: Record<
  PerformanceStatus,
  { ring: string; badgeBg: string; badgeText: string; label: string }
> = {
  excellent: {
    ring: "#16a34a",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    label: "Excellent",
  },
  good: {
    ring: "#2563eb",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    label: "Good",
  },
  fair: {
    ring: "#d97706",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    label: "Fair",
  },
  needsImprovement: {
    ring: "#dc2626",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    label: "Needs Improvement",
  },
  pending: {
    ring: "#9ca3af",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
    label: "No Data Yet",
  },
};

function StatusBadge({
  status,
  darkMode = false,
}: {
  status: PerformanceStatus;
  darkMode?: boolean;
}) {
  const safeStatus: PerformanceStatus = STATUS_STYLES[status]
    ? status
    : "pending";
  const style = STATUS_STYLES[safeStatus];

  const darkBadgeBg: Record<PerformanceStatus, string> = {
    excellent: "bg-green-900/30",
    good: "bg-blue-900/30",
    fair: "bg-amber-900/30",
    needsImprovement: "bg-red-900/30",
    pending: "bg-gray-800",
  };
  const darkBadgeText: Record<PerformanceStatus, string> = {
    excellent: "text-green-400",
    good: "text-blue-400",
    fair: "text-amber-400",
    needsImprovement: "text-red-400",
    pending: "text-gray-400",
  };
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        darkMode ? darkBadgeBg[safeStatus] : style.badgeBg
      } ${darkMode ? darkBadgeText[safeStatus] : style.badgeText}`}
    >
      {style.label}
    </span>
  );
}

function PerformanceRing({
  student,
  darkMode,
}: {
  student: Student;
  darkMode?: boolean;
}) {
  const safeStatus: PerformanceStatus = student.performanceStatus ?? "pending";
  const style = STATUS_STYLES[safeStatus];

  if (student.overallScore === null || student.overallScore === undefined) {
    return (
      <CircularProgress
        value={0}
        trackColor={style.ring}
        progressColor={style.ring}
        size={56}
        strokeWidth={4}
        darkMode={darkMode}
      />
    );
  }

  return (
    <CircularProgress
      value={student.overallScore}
      progressColor={style.ring}
      size={56}
      strokeWidth={4}
      label={`${student.overallScore}%`}
      darkMode={darkMode}
    />
  );
}

export default function StudentCard({
  student,
  view,
  onView,
  darkMode = false,
}: StudentCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const cardBg = darkMode ? "bg-[#111827]" : "bg-white";
  const nameColor = darkMode ? "text-gray-100" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";

  // Notifies the parent (e.g. for analytics/state updates) if it passed an
  // onView handler, then redirects to that student's overview page.
  // Derives the role prefix (admin | teacher | parent) from the current
  // path so this card works correctly no matter which section renders it.
  const handleView = () => {
    onView?.(student);
    const rolePrefix = location.pathname.split("/")[1];
    navigate(`/${rolePrefix}/students/${student.id}`);
  };

  if (view === "list") {
    return (
      <div
        className={`flex items-center gap-4 rounded-xl2 ${cardBg} p-4 shadow-card transition-shadow hover:shadow-panel`}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${nameColor}`}>
            {student.fullName}
          </p>
          <p
            className={`flex items-center gap-1 truncate text-xs ${mutedColor}`}
          >
            <GraduationCap size={12} />
            {student.gradeLevel} - {student.section}
          </p>
          <p
            className={`flex items-center gap-1 truncate text-xs ${mutedColor}`}
          >
            <User size={12} />
            {student.adviser}
          </p>
        </div>

        <div className="hidden sm:block">
          <StatusBadge
            status={student.performanceStatus ?? "pending"}
            darkMode={darkMode}
          />
        </div>

        <PerformanceRing student={student} darkMode={darkMode} />

        <button
          onClick={handleView}
          className="shrink-0 rounded-lg bg-maroon-dark px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-maroon"
        >
          View
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-tl-xl2 rounded-tr-xl2 border-t-4 border-maroon-dark ${cardBg} shadow-card transition-shadow hover:shadow-panel`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${nameColor}`}>
            {student.fullName}
          </p>
          <p
            className={`mt-0.5 flex items-center gap-1 truncate text-xs ${mutedColor}`}
          >
            <GraduationCap size={12} />
            {student.gradeLevel} - {student.section}
          </p>
          <p
            className={`flex items-center gap-1 truncate text-xs ${mutedColor}`}
          >
            <User size={12} />
            {student.adviser}
          </p>
          <div className="mt-2">
            <StatusBadge
              status={student.performanceStatus ?? "pending"}
              darkMode={darkMode}
            />
          </div>
        </div>
        <PerformanceRing student={student} darkMode={darkMode} />
      </div>

      <div>
        <button
          onClick={handleView}
          className="w-full rounded-tl-xl2 bg-maroon-dark py-2.5 text-xs font-semibold text-white transition-colors hover:bg-maroon"
        >
          View
        </button>
      </div>
    </div>
  );
}