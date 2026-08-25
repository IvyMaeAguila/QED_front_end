// src/shared/components/ResetPasswordModal.tsx
import { useState, useMemo } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { PasswordIcon } from "../../../features/auth/components/LoginIcon";
import { AuthService } from "../../../features/auth/services/authentication.service";

interface ResetPasswordModalProps {
  resetToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({ resetToken, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requirements = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const metCount = Object.values(requirements).filter(Boolean).length;
  const allRequirementsMet = metCount === 3;

  const handleSubmit = async () => {
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!allRequirementsMet) {
      setError("Please meet all password requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({ resetToken, newPassword });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(10,10,15,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="relative w-full max-w-105 bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="h-1 w-full bg-linear-to-r from-[#550000] to-[#bb0000]" />

        <div className="px-10 pt-10 pb-10 flex flex-col">
          <div className="mb-6 text-center">
            <p className="text-[15px] font-semibold text-black">Set New Password</p>
            <p className="text-[12px] text-[#9d9d9d] mt-1.5 leading-relaxed">
              Your identity has been verified.
              <br />
              Please set your new password.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#5d5d5d] tracking-wide uppercase">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <PasswordIcon color="#bbb" />
                </span>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-11 py-3 rounded-xl text-[13px] text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(85,0,0,0.35)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(85,0,0,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#f7f7f8";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#7d7d7d] transition-colors"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#5d5d5d] tracking-wide uppercase">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <PasswordIcon color="#bbb" />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Re-enter new password"
                  className="w-full pl-12 pr-11 py-3 rounded-xl text-[13px] text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(85,0,0,0.35)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(85,0,0,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#f7f7f8";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#7d7d7d] transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i < metCount ? (allRequirementsMet ? "#16a34a" : "#bb0000") : "#e5e5e5",
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-1.5 px-1">
              <RequirementRow met={requirements.minLength} label="At least 8 characters" />
              <RequirementRow met={requirements.hasLowercase} label="At least 1 lowercase letter" />
              <RequirementRow met={requirements.hasNumber} label="At least 1 number" />
            </div>
          </div>

          {error && (
            <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#fdecec] border border-[#f5c2c2] text-[#a30000] text-[12px] font-medium text-center">
              {error}
            </div>
          )}

          <button
            disabled={loading || !allRequirementsMet}
            className={`w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${error ? "mt-3" : "mt-7"}`}
            style={{
              background: "linear-gradient(135deg, #550000 0%, #bb0000 100%)",
              boxShadow: "0 4px 16px rgba(85,0,0,0.3)",
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onClick={handleSubmit}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-[12px] font-medium text-[#9d9d9d] hover:text-[#5d5d5d] transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center w-4 h-4 rounded-full transition-colors"
        style={{ backgroundColor: met ? "#16a34a" : "#e5e5e5" }}
      >
        {met && <Check size={11} color="#fff" strokeWidth={3} />}
      </span>
      <span className="text-[11px] font-medium transition-colors" style={{ color: met ? "#16a34a" : "#9d9d9d" }}>
        {label}
      </span>
    </div>
  );
}