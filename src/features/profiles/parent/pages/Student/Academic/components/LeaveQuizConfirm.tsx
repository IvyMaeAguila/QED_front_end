import { AlertTriangle } from "lucide-react";

export default function LeaveQuizConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle size={24} className="text-amber-500" />
        </div>
        <p className="text-base font-extrabold text-gray-800">Leave this round?</p>
        <p className="mt-1.5 text-sm text-gray-500">
          Your progress on this round hasn't been saved yet. If you leave now, you'll need to start it over.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-sm font-bold text-gray-600 active:bg-gray-200"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-sm font-bold text-white active:bg-rose-600"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
// Confirmation modal shown when the student tries to back out of an
// in-progress quiz round. Nothing is submitted to the server until a round
// finishes, so leaving early means losing whatever's been answered so far.