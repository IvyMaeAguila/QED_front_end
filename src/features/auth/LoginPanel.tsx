import { useEffect, useRef, useState } from "react";
import Logo from "../../shared/images/QED_Logo.png";
import { UserIDIcon, PasswordIcon } from "./components/LoginIcon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/AuthContext";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginPanel({ open, onClose }: LoginModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const login = useAuth().login;

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleLogin = async () => {
    setError(null);

    if (!userId.trim() || !password.trim()) {
      setError("Please enter both User ID and Password.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400)); 

      const role = userId.trim().toUpperCase().startsWith("T")
        ? "TEACHER"
        : "ADMIN";

      login(
        { id: "1", email: userId, role },
        "fake-token",
      );

      navigate(role === "TEACHER" ? "/teacher" : "/admin");
    
    } catch (err) {
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(10,10,15,0.6)",
        backdropFilter: "blur(8px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-105 bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-[#550000] to-[#bb0000]" />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#9d9d9d] hover:bg-[#f4f4f4] hover:text-black transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="px-10 pt-10 pb-10 flex flex-col">
          {/* Logo + branding */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#d9d9d9] shadow-md flex items-center justify-center overflow-hidden">
              <img
                src={Logo}
                alt="QED Logo"
                className="w-[90%] h-[90%] object-cover"
              />
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-black tracking-tight leading-none"
                style={{
                  background:
                    "linear-gradient(135deg, #550000 0%, #bb0000 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                QED
              </p>
              <p className="text-[10px] font-medium text-[#aaa] tracking-[0.18em] uppercase mt-0.5">
                Quality Education
              </p>
            </div>
          </div>

          {/* Section label */}
          <div className="mb-6 text-center">
            <p className="text-[15px] font-semibold text-black">
              Institutional Login
            </p>
            <p className="text-[12px] text-[#9d9d9d] mt-0.5">
              Enter your credentials to continue
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-[#fdecec] border border-[#f5c2c2] text-[#a30000] text-[12px] font-medium text-center">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="flex flex-col gap-4">
            {/* User ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#5d5d5d] tracking-wide uppercase">
                User ID
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <UserIDIcon color="#bbb" />
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. A05-1234"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-[13px] text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  style={{ boxShadow: "none" }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(85,0,0,0.35)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(85,0,0,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#f7f7f8";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#5d5d5d] tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbb]">
                  <PasswordIcon color="#bbb" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-[13px] text-black bg-[#f7f7f8] border border-transparent outline-none transition-all placeholder:text-[#ccc]"
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(85,0,0,0.35)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(85,0,0,0.07)";
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

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-[#550000] cursor-pointer"
              />
              <span className="text-[11px] text-[#7d7d7d] group-hover:text-black transition-colors">
                Remember me
              </span>
            </label>
            <button className="text-[11px] text-[#550000] hover:text-[#bb0000] font-medium transition-colors">
              Forgot password?
            </button>
          </div>

          {/* Login button */}
          <button
            disabled={loading}
            className="mt-7 w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #550000 0%, #bb0000 100%)",
              boxShadow: "0 4px 16px rgba(85,0,0,0.3)",
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onClick={handleLogin}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Footer note */}
          <p className="text-center text-[10px] text-[#c0c0c0] mt-6 leading-relaxed">
            For authorized personnel only. Unauthorized access
            <br />
            is prohibited and subject to disciplinary action.
          </p>
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