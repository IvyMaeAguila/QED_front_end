import { AlertTriangle } from "lucide-react";
import type { UserAccount } from "../types/user";
import { formatFullName } from "../types/user";

interface ConfirmDeleteUserModalProps {
  user: UserAccount;
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteUserModal({ user, darkMode, onCancel, onConfirm }: ConfirmDeleteUserModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-xl p-6 ${
          darkMode ? "bg-[#111827] border-[#1F2937]" : "bg-white border-[#E5E7EB]"
        }`}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ background: "#FEE2E2" }}>
          <AlertTriangle size={20} color="#B91C1C" />
        </div>
        <h3 className={`font-bold text-base ${darkMode ? "text-white" : "text-[#111827]"}`}>
          Remove user account?
        </h3>
        <p className={`text-sm mt-2 ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
          This will permanently remove <span className="font-semibold">{formatFullName(user)}</span> (
          {user.id}) and revoke their access. This action cannot be undone.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white transition-colors hover:bg-[#991B1B]"
            style={{ background: "#B91C1C" }}
          >
            Remove User
          </button>
        </div>
      </div>
    </div>
  );
}