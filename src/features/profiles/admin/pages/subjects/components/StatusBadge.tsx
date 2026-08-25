import type { SchoolYearStatus, TermStatus } from "../types/academicyear";

type Status = SchoolYearStatus | TermStatus;

const STATUS_STYLES: Record<Status, { bg: string; text: string }> = {
  Active: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Upcoming: { bg: "bg-amber-100", text: "text-amber-700" },
  Completed: { bg: "bg-gray-100", text: "text-gray-600" },
  Inactive: { bg: "bg-gray-100", text: "text-gray-600" },
};

const STATUS_STYLES_DARK: Record<Status, { bg: string; text: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Upcoming: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Completed: { bg: "bg-white/10", text: "text-gray-400" },
  Inactive: { bg: "bg-white/10", text: "text-gray-400" },
};

interface StatusBadgeProps {
  status: Status;
  darkMode: boolean;
}

export function StatusBadge({ status, darkMode }: StatusBadgeProps) {
  const style = darkMode ? STATUS_STYLES_DARK[status] : STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}
    >
      {status}
    </span>
  );
}