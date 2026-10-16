// src/shared/components/ForgotPasswordModal.tsx
import { useState } from "react";
import { UserIcon, Mail } from "lucide-react";
import { AuthService } from "../../../features/auth/services/authentication.service";
import { ModalFrame } from "../modal";

interface ForgotPasswordModalProps {
  onClose: () => void;
  onOtpSent: (userName: string, email: string) => void;
}

export function ForgotPasswordModal({ onClose, onOtpSent }: ForgotPasswordModalProps) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!userName.trim() || !email.trim()) {
      setError("Please enter your User name and registered email address.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.requestPasswordReset({ userName: userName.trim(), email: email.trim() });
      onOtpSent(userName.trim(), email.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <ModalFrame shellVariant="specialized" onClose={onClose} size="compact" zIndexClass="z-200" ariaLabel="Forgot Password" backdropClassName="px-4" backdropStyle={{
        backgroundColor: "rgba(10,10,15,0.6)",
        backdropFilter: "blur(8px)",
      }} className="relative max-w-105 overflow-hidden rounded-2xl border-0 bg-white shadow-none" panelStyle={{
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}>
        <div className="h-1 w-full bg-maroon" />

        <div className="px-10 pt-10 pb-10 flex flex-col">
          <div className="mb-6 text-center">
            <p className="qed-type-modal-title text-black">Forgot Password</p>
            <p className="qed-type-modal-subtitle mt-1.5 leading-relaxed text-[#9d9d9d]">
              Enter your User name and registered email
              <br />
              address and we'll send you a one-time code.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* User Name */}
            <div className="flex flex-col gap-1.5">
              <label className="qed-type-label text-[#5d5d5d] uppercase">
                User Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <UserIcon color="#bbb" />
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. PRT_juan.delacruz"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "color-mix(in srgb, var(--brand-primary) 35%, transparent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--brand-primary) 7%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#f7f7f8";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="qed-type-label text-[#5d5d5d] uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-11 py-3 rounded-xl text-sm text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "color-mix(in srgb, var(--brand-primary) 35%, transparent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--brand-primary) 7%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#f7f7f8";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#fdecec] border border-[#f5c2c2] text-[#a30000] text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className={`w-full py-3.5 rounded-xl qed-type-button text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${error ? "mt-3" : "mt-7"}`}
            style={{
              background: "var(--color-maroon)",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--brand-primary) 30%, transparent)",
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onClick={handleSubmit}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs font-medium text-[#9d9d9d] hover:text-[#5d5d5d] transition-colors"
          >
            Back to login
          </button>
        </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </ModalFrame>
  );
}
