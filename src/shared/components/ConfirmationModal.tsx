import './ConfirmationModal.css';
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader, type ModalSize } from "./modal";

export type ConfirmationVariant = "default" | "warning" | "danger";

interface ConfirmationModalProps {
  layout?: "compact" | "standard";
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
  layout = "compact",
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
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const busy = useRef(false);
  const working = loading || pending;
  async function confirm() {
    if (busy.current || loading || disabled) return;
    busy.current = true;
    setPending(true);
    setActionError(null);
    try { await onConfirm(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'The action could not finish. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  const destructive = variant === "danger";
  const iconTone = destructive || variant === "warning" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-brand-soft text-brand-ink";

  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      onClose={() => { if (!working) onClose(); }}
      size={size}
      zIndexClass={zIndexClass}
      role="alertdialog"
      ariaLabel={title}
      closeOnBackdrop={allowBackdropCloseWhileLoading || !working}
      closeOnEscape={!working}
      className={`${layout === "compact" ? "qed-confirmation-compact" : ""} ${panelClassName}`}
    >
      <ModalHeader
        title={title}
        subtitle={layout === "compact" ? description : undefined}
        onClose={layout === "standard" ? onClose : undefined}
        closeDisabled={working}
        closeDarkMode={darkMode}
        titleClassName={`${darkMode ? "text-white" : "text-[#111827]"} ${titleClassName}`}
        subtitleClassName={`${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"} ${descriptionClassName}`}
        leading={
          <span className={layout === "standard" ? "inline-flex shrink-0 items-center justify-center text-brand-ink" : `flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClassName || iconTone}`}>
            {icon ?? <AlertTriangle size={18} aria-hidden="true" />}
          </span>
        }
        className="gap-4 border-b-0 px-6 pb-3 pt-6"
      />
      {layout === "standard" ? <ModalBody className="px-6 py-5"><div className={`space-y-3 text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{description}{children}</div></ModalBody> : children && <ModalBody className={bodyClassName}>{children}</ModalBody>}
      {actionError && <p role="alert" className="px-6 pb-4 text-sm text-red-600">{actionError}</p>}
      <ModalFooter className={`${layout === "standard" ? "px-6 py-4" : "border-t-0 pt-0"} ${footerClassName} ${darkMode ? "border-[#374151]" : "border-border-subtle"}`}>
        <button
          type="button"
          onClick={onClose}
          disabled={working || cancelDisabled}
          className={`h-10 rounded-lg border px-4 qed-type-button disabled:opacity-50 ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5" : "border-border-subtle text-[#374151] hover:bg-brand-light"} ${cancelButtonClassName}`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={disabled || working}
          aria-busy={working}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 qed-type-button text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "bg-[#B91C1C]" : "bg-maroon"} ${layout === "standard" ? "min-w-32" : ""} ${confirmButtonClassName}`}
        >
          {confirmLeading}
          {working ? loadingLabel : confirmLabel}
        </button>
      </ModalFooter>
    </ModalFrame>
  );
}
