import { createContext, useContext, useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import Modal from "../../../shared/components/modal";
import type { UserProfile } from "../../../shared/profile/types/types";
import { AuthService } from "../services/authentication.service"; // adjust path

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (user: UserProfile, token: string, mustChangePassword: boolean) => void;
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

  // Isang beses lang tatakbo ito, pag na-mount ang AuthProvider (dapat sa root ng app)
  useEffect(() => {
    async function rehydrate() {
      const me = await AuthService.getMe();
      if (me) {
        setUser(me);
        setMustChangePassword(me.mustChangePassword);
      }
      setIsLoading(false);
    }
    rehydrate();
  }, []);

  function login(user: UserProfile, token: string, mustChangePassword: boolean) {
    localStorage.setItem("token", token);
    setUser(user);
    setMustChangePassword(mustChangePassword);
  }

  function logout() {
    setLogoutModalOpen(true);
  }

  function confirmLogout() {
    setLogoutModalOpen(false);
    localStorage.removeItem("token");
    setUser(null);
    setMustChangePassword(false);
  }

  function clearMustChangePassword() {
    setMustChangePassword(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, mustChangePassword, login, logout, setUser, clearMustChangePassword }}
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