import { Clock } from "lucide-react";
import Modal from "@shared/components/modal"; // ayusin ang path

interface TermUnavailableModalProps {
  open: boolean;
  termLabel: string;
  onClose: () => void;
  darkMode?: boolean;
}

export function TermUnavailableModal({
  open,
  termLabel,
  onClose,
  darkMode = false,
}: TermUnavailableModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grades Unavailable"
      subtitle={termLabel}
      icon={<Clock size={16} />}
      darkMode={darkMode}
    >
      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
        Grades for <span className="font-semibold">{termLabel}</span> is currently unavailable.
      </p>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-maroon px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Okay
        </button>
      </div>
    </Modal>
  );
}