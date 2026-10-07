import type { Student } from "../types/Students";
import { formatFullName } from "../types/Students";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";

interface ConfirmDeleteModalProps {
  student: Student;
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ student, darkMode, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <ConfirmationModal
      title="Remove student record?"
      description={<>This will permanently remove <span className="font-semibold">{formatFullName(student)}</span> from the student records. This action cannot be undone.</>}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Remove Student"
      variant="danger"
      darkMode={darkMode}
    />
  );
}
