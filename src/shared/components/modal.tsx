import { X } from "lucide-react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useId, useRef } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "narrow" | "compact" | "md" | "lg" | "wide" | "xl" | "full";
export type ModalShellVariant = "standard" | "dark" | "specialized";

const modalSizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  narrow: "max-w-md",
  compact: "max-w-[26.25rem]",
  md: "max-w-lg",
  lg: "max-w-2xl",
  wide: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[calc(100vw-2rem)]",
};

let openModalCount = 0;
let bodyOverflowBeforeModal = "";
const modalStack: string[] = [];

interface ModalFrameProps {
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
  backdropClassName?: string;
  backdropStyle?: CSSProperties;
  panelStyle?: CSSProperties;
  zIndexClass?: string;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  labelledBy?: string;
  describedBy?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  portal?: boolean;
  shellVariant?: ModalShellVariant;
}

/** Canonical QED dialog surface. It owns only modal presentation and mechanics. */
export function ModalFrame({
  open = true,
  onClose,
  children,
  size = "md",
  className = "",
  backdropClassName = "",
  backdropStyle,
  panelStyle,
  zIndexClass = "z-50",
  role = "dialog",
  ariaLabel,
  labelledBy,
  describedBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
  portal = true,
  shellVariant = "standard",
}: ModalFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (openModalCount === 0) {
      bodyOverflowBeforeModal = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openModalCount += 1;
    modalStack.push(instanceId);
    const initialFocus = panelRef.current?.querySelector<HTMLElement>(
      "[autofocus], [data-autofocus]",
    );
    (initialFocus ?? panelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== instanceId) return;
      if (event.key === "Escape" && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const wasTopmost = modalStack[modalStack.length - 1] === instanceId;
      const stackIndex = modalStack.lastIndexOf(instanceId);
      if (stackIndex >= 0) modalStack.splice(stackIndex, 1);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.body.style.overflow = bodyOverflowBeforeModal;
      if (wasTopmost) previouslyFocused?.focus();
    };
  }, [open, closeOnEscape, instanceId]);

  if (!open) return null;

  const surface = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center overflow-y-auto p-4 modal-backdrop ${backdropClassName}`}
      style={backdropStyle}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`qed-modal-frame ${shellVariant === "specialized" ? "qed-modal-frame--specialized" : shellVariant === "dark" ? "qed-modal-frame--dark" : ""} my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl2 border border-surface bg-white shadow-panel outline-none ${modalSizeClasses[size]} ${className}`}
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  );

  return portal ? createPortal(surface, document.body) : surface;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  size?: ModalSize;
  darkMode?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = "narrow",
  darkMode = false,
}: ModalProps) {
  const titleId = useId();
  const subtitleId = useId();
  const iconBg = darkMode ? "bg-maroon/20" : "bg-maroon/10";

  return (
    <ModalFrame
      open={open}
      onClose={onClose}
      size={size}
      shellVariant={darkMode ? "dark" : "standard"}
      labelledBy={titleId}
      describedBy={subtitle ? subtitleId : undefined}
    >
      <ModalHeader
        title={title}
        subtitle={subtitle}
        titleId={titleId}
        subtitleId={subtitle ? subtitleId : undefined}
        onClose={onClose}
        closeDarkMode={darkMode}
        className="items-center"
        leading={icon ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-maroon-dark ${iconBg}`}>
            {icon}
          </span>
        ) : undefined}
      />
      <ModalBody className="px-6 py-5">{children}</ModalBody>
    </ModalFrame>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  children,
  className = "",
  titleId,
  subtitleId,
  titleClassName = "text-[#111827]",
  subtitleClassName = "text-[#6B7280]",
  leading,
  actions,
  closeDarkMode = false,
  closeDisabled = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
  titleId?: string;
  subtitleId?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  closeDarkMode?: boolean;
  closeDisabled?: boolean;
}) {
  return (
    <header className={`qed-modal-header ${closeDarkMode ? "qed-modal-header--dark" : ""} flex shrink-0 items-center justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {leading && <span className="qed-modal-leading" style={{ color: closeDarkMode ? "#ffffff" : "var(--color-maroon)" }}>{leading}</span>}
        <div className="min-w-0">
          <h2 id={titleId} style={{ color: closeDarkMode ? "#ffffff" : "#111827" }} className={`qed-type-modal-title ${titleClassName}`}>{title}</h2>
          {subtitle && <p id={subtitleId} style={{ color: closeDarkMode ? "#9CA3AF" : "#6B7280" }} className={`qed-type-modal-subtitle ${subtitleClassName}`}>{subtitle}</p>}
          {children}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        {onClose && <ModalCloseButton onClose={onClose} darkMode={closeDarkMode} disabled={closeDisabled} />}
      </div>
    </header>
  );
}

export function ModalBody({ children, className = "px-6 py-5" }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`qed-modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = "" }: HTMLAttributes<HTMLDivElement>) {
  return <footer className={`qed-modal-footer flex shrink-0 items-center justify-end gap-3 border-t border-surface px-6 py-4 ${className}`}>{children}</footer>;
}

export function ModalCloseButton({
  onClose,
  darkMode = false,
  inverse = false,
  disabled = false,
  className = "",
}: {
  onClose: () => void;
  darkMode?: boolean;
  inverse?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      disabled={disabled}
      aria-label="Close dialog"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40 disabled:cursor-not-allowed disabled:opacity-40 ${inverse ? "text-white/80 hover:bg-white/15 hover:text-white" : darkMode ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-surface hover:text-maroon-dark"} ${className}`}
    >
      <X size={18} aria-hidden="true" />
    </button>
  );
}
