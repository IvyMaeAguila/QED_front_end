// src/features/auth/context/authContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import Modal from "../../../shared/components/modal";
import type { UserProfile } from "../../../shared/profile/types/types";
import { AuthService } from "../services/authentication.service";
import { profileService } from "@shared/profile/service/profile.service";

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  mustChangePassword: boolean;
  // Cookie-based na ang auth, kaya optional na lang ang token (hindi na ito sine-save)
  login: (
    user: UserProfile,
    token?: string,
    mustChangePassword?: boolean,
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  clearMustChangePassword: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true muna habang chine-check
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    async function rehydrate() {
      try {
        // Kung walang valid na cookie, dapat null ang ibalik ng getMe()
        const me = await AuthService.getMe();
        if (me) {
          setMustChangePassword(me.mustChangePassword);
          try {
            setUser(await profileService.getMyProfile());
          } catch {
            setUser(me); // fallback kung pumalya ang /user-profile
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setIsLoading(false);
      }
    }
    rehydrate();
  }, []);

  async function login(
    user: UserProfile,
    _token?: string,
    mustChangePassword = false,
  ) {
    // Na-set na ng backend ang cookie sa login response, kaya walang localStorage dito
    setMustChangePassword(mustChangePassword);
    try {
      setUser(await profileService.getMyProfile());
    } catch {
      setUser(user); // fallback sa data galing login response
    }
  }

  function logout() {
    setLogoutModalOpen(true);
  }

  async function confirmLogout() {
    setLogoutModalOpen(false);
    try {
      // httpOnly ang cookie, hindi ito mabubura ng JS. Backend ang dapat mag-clear.
      await AuthService.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    setMustChangePassword(false);
  }

  function clearMustChangePassword() {
    setMustChangePassword(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        mustChangePassword,
        login,
        logout,
        setUser,
        clearMustChangePassword,
      }}
    >
      {children}
      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm logout"
        icon={<LogOut size={18} />}
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to log out of your account?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => setLogoutModalOpen(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmLogout}
            className="rounded-lg bg-maroon px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-maroon-dark"
          >
            Log out
          </button>
        </div>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}