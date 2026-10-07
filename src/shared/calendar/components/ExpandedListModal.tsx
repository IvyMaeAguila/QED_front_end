import type { ReactNode } from "react";
import type { CalendarTheme } from "../types/Calendar";
import { ModalBody, ModalFrame, ModalHeader } from "../../components/modal";

interface ExpandedListModalProps extends CalendarTheme {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function ExpandedListModal({ title, icon, onClose, darkMode, children }: ExpandedListModalProps) {
  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      onClose={onClose}
      size="md"
      ariaLabel={title}
      className="max-h-[85vh]"
    >
      <ModalHeader
          title={title}
          onClose={onClose}
          closeDarkMode={darkMode}
          className="items-center"
          leading={icon}
      />
      <ModalBody className="p-5">{children}</ModalBody>
    </ModalFrame>
  );
}
