import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader, type ModalSize } from "./modal";

export type ConfirmationVariant = "default" | "warning" | "danger";

interface ConfirmationModalProps {
  title: string;
  description: ReactNode;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  darkMode?: boolean;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  zIndexClass?: string;
  panelClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: ReactNode;
  icon?: ReactNode;
  iconClassName?: string;
  size?: ModalSize;
  bodyClassName?: string;
  footerClassName?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  confirmLeading?: ReactNode;
  cancelDisabled?: boolean;
  allowBackdropCloseWhileLoading?: boolean;
}

/** Shared action-confirmation pattern; callbacks and feature logic stay outside. */
export function ConfirmationModal({
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  darkMode = false,
  loading = false,
  disabled = false,
  loadingLabel = "Working…",
  zIndexClass = "z-50",
  panelClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  children,
  icon,
  iconClassName = "",
  size = "sm",
  bodyClassName = "px-0 pb-5 pt-0",
  footerClassName = "",
  confirmButtonClassName = "",
  cancelButtonClassName = "",
  confirmLeading,
  cancelDisabled = false,
  allowBackdropCloseWhileLoading = false,
}: ConfirmationModalProps) {
  const destructive = variant === "danger";
  const iconTone = destructive || variant === "warning" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#F8EDEE] text-[#800000]";

  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      onClose={onClose}
      size={size}
      zIndexClass={zIndexClass}
      role="alertdialog"
      ariaLabel={title}
      closeOnBackdrop={allowBackdropCloseWhileLoading || !loading}
      className={panelClassName}
    >
      <ModalHeader
        title={title}
        subtitle={description}
        closeDarkMode={darkMode}
        titleClassName={`${darkMode ? "text-white" : "text-[#111827]"} ${titleClassName}`}
        subtitleClassName={`${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} ${descriptionClassName}`}
        leading={
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClassName || iconTone}`}>
            {icon ?? <AlertTriangle size={18} aria-hidden="true" />}
          </span>
        }
        className="gap-4 border-b-0 px-6 pb-3 pt-6"
      />
      {children && <ModalBody className={bodyClassName}>{children}</ModalBody>}
      <ModalFooter className={`border-t-0 pt-0 ${footerClassName} ${darkMode ? "border-[#374151]" : "border-[#E5E7EB]"}`}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading || cancelDisabled}
          className={`h-10 rounded-lg border px-4 qed-type-button disabled:opacity-50 ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F8FAFC]"} ${cancelButtonClassName}`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || loading}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 qed-type-button text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "bg-[#B91C1C]" : "bg-[#800000]"} ${confirmButtonClassName}`}
        >
          {confirmLeading}
          {loading ? loadingLabel : confirmLabel}
        </button>
      </ModalFooter>
    </ModalFrame>
  );
}
