import { Lock } from "lucide-react";
import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "@shared/components/modal";

interface ProgressReportUnavailableModalProps {
  open: boolean;
  onClose: () => void;
  theme: AdminThemeContext;
  /** Has the adviser/admin toggled grade_visibility.is_visible for this student+period? */
  isVisible: boolean;
  /** Has the active grading_period ended (end_date has passed / is_active turned off)? */
  termEnded: boolean;
  approved: boolean;
}

export default function ProgressReportUnavailableModal({
  open,
  onClose,
  theme,
  isVisible,
  termEnded,
  approved,
}: ProgressReportUnavailableModalProps) {
  if (!open) return null;

  const { darkMode, textPrimary, textMuted } = theme;

  const reason = !termEnded
    ? "The selected grading period is still in progress."
    : !approved
      ? "Your child's grades are awaiting principal approval."
      : "Your child's adviser needs to enable Parent Visibility for this report.";

  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      onClose={onClose}
      size="sm"
      labelledBy="progress-report-unavailable-title"
    >
        <ModalHeader
          title="Progress report not available yet"
          titleId="progress-report-unavailable-title"
          titleClassName={textPrimary}
          onClose={onClose}
          closeDarkMode={darkMode}
          leading={<span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            darkMode ? "bg-white/10" : "bg-maroon/10"
          }`}
        >
          <Lock size={18} className={darkMode ? textPrimary : "text-brand-ink"} />
        </span>}
          className="items-center border-b border-surface px-6 py-5"
        />

        <ModalBody className="space-y-2 px-6 py-5">
          <p className={`text-sm leading-relaxed ${textMuted}`}>{reason}</p>

        {(!termEnded || !approved || !isVisible) && (
          <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>
            You can view the report after the term ends, the principal approves the grades, and the adviser enables Parent Visibility.
          </p>
        )}
        </ModalBody>

        <ModalFooter className="border-t-0 px-6 pb-6 pt-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-maroon px-3 py-2 qed-type-button text-white hover:opacity-90"
        >
          Got it
        </button>
        </ModalFooter>
    </ModalFrame>
  );
}
