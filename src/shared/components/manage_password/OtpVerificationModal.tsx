// src/shared/components/OtpVerificationModal.tsx
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthService } from "../../../features/auth/services/authentication.service";

interface OtpVerificationModalProps {
  userName: string;
  email: string;
  onClose: () => void;
  onVerified: (resetToken: string) => void;
  onResend: () => void;
}

export function OtpVerificationModal({
  userName,
  email,
  onClose,
  onVerified,
  onResend,
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { resetToken } = await AuthService.verifyOtp({ userName, otp });
      onVerified(resetToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid or expired OTP. Please try again.",
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
            <p className="text-[15px] font-semibold text-black">Enter Verification Code</p>
            <p className="text-[12px] text-[#9d9d9d] mt-1.5 leading-relaxed">
              We sent a 6-digit code to
              <br />
              <span className="font-semibold text-[#5d5d5d]">{email}</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#5d5d5d] tracking-wide uppercase">
              OTP Code
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                <KeyRound size={16} />
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={handleKeyDown}
                placeholder="000000"
                className="w-full pl-12 pr-11 py-3 rounded-xl text-[13px] text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc] tracking-[0.3em]"
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
            </div>
          </div>

          {error && (
            <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#fdecec] border border-[#f5c2c2] text-[#a30000] text-[12px] font-medium text-center">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${error ? "mt-3" : "mt-7"}`}
            style={{
              background: "linear-gradient(135deg, #550000 0%, #bb0000 100%)",
              boxShadow: "0 4px 16px rgba(85,0,0,0.3)",
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onClick={handleSubmit}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onResend}
              className="text-[12px] font-medium text-[#9d9d9d] hover:text-[#5d5d5d] transition-colors"
            >
              Resend code
            </button>
            <span className="text-[#e5e5e5]">|</span>
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] font-medium text-[#9d9d9d] hover:text-[#5d5d5d] transition-colors"
            >
              Back to login
            </button>
          </div>
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