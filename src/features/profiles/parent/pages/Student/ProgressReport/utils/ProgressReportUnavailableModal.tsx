import { Lock, X } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

interface ProgressReportUnavailableModalProps {
  open: boolean;
  onClose: () => void;
  theme: AdminThemeContext;
  /** Has the adviser/admin toggled grade_visibility.is_visible for this student+period? */
  isVisible: boolean;
  /** Has the active grading_period ended (end_date has passed / is_active turned off)? */
  termEnded: boolean;
}

export default function ProgressReportUnavailableModal({
  open,
  onClose,
  theme,
  isVisible,
  termEnded,
}: ProgressReportUnavailableModalProps) {
  if (!open) return null;

  const { darkMode, textPrimary, textMuted } = theme;

  const reason = !termEnded
    ? "The current grading period hasn't ended yet. Progress reports are released once the term is complete."
    : "Your child's adviser hasn't released this progress report yet. It will appear here as soon as it's made visible.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-report-unavailable-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm rounded-xl border p-6 shadow-xl ${
          darkMode
            ? "bg-[#111827] border-white/10"
            : "bg-white border-black/5"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-3 top-3 rounded-md p-1 ${textMuted} hover:opacity-70`}
        >
          <X size={16} />
        </button>

        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${
            darkMode ? "bg-white/10" : "bg-[#8B0D0D]/10"
          }`}
        >
          <Lock size={18} className={darkMode ? textPrimary : "text-[#8B0D0D]"} />
        </div>

        <h2
          id="progress-report-unavailable-title"
          className={`text-base font-bold ${textPrimary}`}
        >
          Progress report not available yet
        </h2>

        <p className={`mt-1.5 text-sm leading-relaxed ${textMuted}`}>
          {reason}
        </p>

        {!termEnded && !isVisible && (
          <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>
            Once the term ends and the report is released, you'll be able to
            view and download it here.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#8B0D0D] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}