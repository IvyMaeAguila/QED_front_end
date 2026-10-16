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

        {!termEnded && !isVisible && (
          <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>
            Once the term ends and the report is released, you'll be able to
            view and download it here.
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
