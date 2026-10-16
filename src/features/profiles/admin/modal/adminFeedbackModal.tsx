import type { ReactNode } from "react";
import { ModalBody, ModalFrame, ModalHeader } from "@shared/components/modal";

interface AdminFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: ReactNode;
  darkMode?: boolean;
  children?: ReactNode;
}

// Admin feedback content keeps its role-specific message and actions while
// sharing QED's common dialog surface and accessibility mechanics.
export default function AdminFeedbackModal({
  open,
  onClose,
  title,
  message,
  icon,
  darkMode = false,
  children,
}: AdminFeedbackModalProps) {
  if (!open) return null;

  const messageColor = darkMode ? "text-[#D1D5DB]" : "text-[#374151]";
  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} open={open} onClose={onClose} size="sm" ariaLabel={title}>
        <ModalHeader
          title={title}
          onClose={onClose}
          closeDarkMode={darkMode}
          leading={icon ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon/10 text-brand-ink">{icon}</span> : undefined}
          className="items-center"
        />
        <ModalBody className="px-5 py-4">
          <p className={`qed-type-body leading-relaxed ${messageColor}`}>
            {message}
          </p>
          {children && <div className="mt-4">{children}</div>}
        </ModalBody>
    </ModalFrame>
  );
}
