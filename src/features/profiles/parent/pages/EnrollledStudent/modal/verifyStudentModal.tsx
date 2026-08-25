import { GraduationCap, ShieldCheck, User } from "lucide-react";
import type { MatchedStudentRecord } from "../../dashboard/types/student";
import Modal from "../../ui/modal";
import { useToast } from "@shared/context/ToastContext";

interface VerifyStudentModalProps {
  open: boolean;
  match: MatchedStudentRecord | null;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  darkMode?: boolean;
}

export default function VerifyStudentModal({
  open,
  match,
  onClose,
  onConfirm,
  onReject,
  darkMode = false,
}: VerifyStudentModalProps) {
  if (!match) return null;

  const rowBg = darkMode ? "bg-[#1a1a1a]" : "bg-surface";
  const cardIconBg = darkMode ? "bg-[#111827]" : "bg-white";
  const nameColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const dtColor = darkMode ? "text-gray-500" : "text-gray-400";
  const ddColor = darkMode ? "text-gray-200" : "text-gray-800";
  const borderColor = darkMode ? "border-[#1F2937]" : "border-surface";
  const rejectBtn = darkMode
    ? "flex-1 rounded-lg border border-[#1F2937] py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-[#1a1a1a]"
    : "flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-surface";

    const { showToast } = useToast();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify Student"
      subtitle="Confirm this is your child before linking the record."
      icon={<ShieldCheck size={16} />}
      darkMode={darkMode}
    >
      <div className="flex flex-col gap-4">
        <div className={`flex items-center gap-3 rounded-xl2 p-4 ${rowBg}`}>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-maroon-dark shadow-sm ${cardIconBg}`}
          >
            <User size={22} />
          </span>
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${nameColor}`}>
              {match.fullName}
            </p>
            <p className={`text-xs ${mutedColor}`}>ID: {match.idNumber}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className={`rounded-lg border p-3 ${borderColor}`}>
            <dt
              className={`mb-0.5 flex items-center gap-1 font-semibold ${dtColor}`}
            >
              <GraduationCap size={12} />
              Grade & Section
            </dt>
            <dd className={`font-medium ${ddColor}`}>
              {match.gradeLevel} - {match.section}
            </dd>
          </div>
          <div className={`rounded-lg border p-3 ${borderColor}`}>
            <dt className={`mb-0.5 font-semibold ${dtColor}`}>Adviser</dt>
            <dd className={`font-medium ${ddColor}`}>{match.adviser}</dd>
          </div>
        </dl>

        <p className={`text-xs leading-relaxed ${mutedColor}`}>
          Please confirm that the details above match your child. Once verified,
          this student will be added to your dashboard.
        </p>

        <div className="flex gap-3">
          <button onClick={onReject} className={rejectBtn}>
            Not my child
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-maroon-dark py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon"
          >
            Yes, this is correct
          </button>
        </div>
      </div>
    </Modal>
  );
}
