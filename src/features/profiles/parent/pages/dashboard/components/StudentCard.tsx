import { useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, User } from "lucide-react";
import type { AttendanceStatus, CardViewMode, Student } from "../types/student";
import CircularProgress from "../../ui/CircularProgress";

interface StudentCardProps {
  student: Student;
  view: CardViewMode;
  onView?: (student: Student) => void;
  darkMode?: boolean;
}

const STATUS_STYLES: Record<
  AttendanceStatus,
  { ring: string; badgeBg: string; badgeText: string; label: string }
> = {
  present: {
    ring: "#16a34a",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    label: "Present today",
  },
  late: {
    ring: "#d97706",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    label: "Late today",
  },
  absent: {
    ring: "#dc2626",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    label: "Absent today",
  },
  pending: {
    ring: "#9ca3af",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
    label: "Awaiting update",
  },
};

function StatusBadge({
  status,
  darkMode = false,
}: {
  status: AttendanceStatus;
  darkMode?: boolean;
}) {
  const safeStatus: AttendanceStatus = STATUS_STYLES[status] ? status : "pending";
  const style = STATUS_STYLES[safeStatus];

  const darkBadgeBg: Record<AttendanceStatus, string> = {
    present: "bg-green-900/30",
    late: "bg-amber-900/30",
    absent: "bg-red-900/30",
    pending: "bg-gray-800",
  };
  const darkBadgeText: Record<AttendanceStatus, string> = {
    present: "text-green-400",
    late: "text-amber-400",
    absent: "text-red-400",
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

function AttendanceRing({
  student,
  darkMode,
}: {
  student: Student;
  darkMode?: boolean;
}) {
  const safeStatus: AttendanceStatus = student.attendanceStatus ?? "pending";
  const style = STATUS_STYLES[safeStatus];

  if (student.attendanceRate === null || student.attendanceRate === undefined) {
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
      value={student.attendanceRate}
      progressColor={style.ring}
      size={56}
      strokeWidth={4}
      label={`${student.attendanceRate}%`}
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
            status={student.attendanceStatus ?? "pending"}
            darkMode={darkMode}
          />
        </div>

        <AttendanceRing student={student} darkMode={darkMode} />

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
              status={student.attendanceStatus ?? "pending"}
              darkMode={darkMode}
            />
          </div>
        </div>
        <AttendanceRing student={student} darkMode={darkMode} />
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