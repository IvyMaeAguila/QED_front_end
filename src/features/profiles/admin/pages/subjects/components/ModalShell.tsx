import { ModalBody, ModalFrame, ModalHeader, type ModalSize } from "@shared/components/modal";
import type { SubjectsTheme } from "../types/types";

interface ModalShellProps extends SubjectsTheme {
  title: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  onClose: () => void;
  children: React.ReactNode;
  closeDisabled?: boolean;
  size?: ModalSize;
}

export function ModalShell({
  title,
  icon: Icon,
  onClose,
  children,
  panelBorder,
  textPrimary,
  darkMode,
  closeDisabled = false,
  size = "narrow",
}: ModalShellProps) {
  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      onClose={onClose}
      size={size}
      portal={false}
      closeOnBackdrop={!closeDisabled}
      className="max-h-[88dvh]"
      ariaLabel={title}
    >
        <ModalHeader
          title={title}
          onClose={onClose}
          closeDisabled={closeDisabled}
          closeDarkMode={darkMode}
          titleClassName={textPrimary}
          className={`items-center gap-4 border-b px-5 py-4 sm:px-8 sm:py-5 ${panelBorder}`}
          leading={<Icon size={16} className="shrink-0 text-maroon" />}
        />

        <ModalBody className="space-y-4 p-4 sm:p-6">
          {children}
        </ModalBody>
    </ModalFrame>
  );
}
