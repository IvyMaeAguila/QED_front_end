import { AlertTriangle } from "lucide-react";
import { ConfirmationModal } from "@shared/components/ConfirmationModal";

export default function LeaveQuizConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmationModal
      title="Leave this round?"
      description="Your progress on this round hasn't been saved yet. If you leave now, you'll need to start it over."
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Leave"
      cancelLabel="Keep going"
      variant="warning"
      size="sm"
      panelClassName="max-w-xs rounded-3xl border-0 bg-white shadow-xl"
      icon={<AlertTriangle size={24} className="text-amber-500" />}
      iconClassName="bg-amber-100"
      bodyClassName="px-6 pb-5 pt-0"
      footerClassName="px-5 pb-5 pt-0"
      cancelButtonClassName="flex-1 rounded-2xl border-0 bg-gray-100 py-2.5 text-gray-600 hover:bg-gray-200"
      confirmButtonClassName="flex-1 rounded-2xl bg-rose-500 py-2.5 text-white hover:bg-rose-600"
    />
  );
}
// Confirmation modal shown when the student tries to back out of an
// in-progress quiz round. Nothing is submitted to the server until a round
// finishes, so leaving early means losing whatever's been answered so far.
