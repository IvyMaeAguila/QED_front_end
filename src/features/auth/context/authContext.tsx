// src/features/auth/context/authContext.tsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { nextQuerySession } from "@shared/query/sessionQueries";
import { LogOut } from "lucide-react";
import Modal from "../../../shared/components/modal";
import type { UserProfile } from "../../../shared/profile/types/types";
import { AuthService } from "../services/authentication.service";
import { profileService } from "@shared/profile/service/profile.service";

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  mustChangePassword: boolean;
  sessionScope: number;
  expireSession: (expectedScope: number) => void;
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
  const [user, setUserState] = useState<UserProfile | null>(null);
  const identity = useRef<string | null>(null);
  const [sessionScope, setSessionScope] = useState(nextQuerySession);
  const scopeRef = useRef(sessionScope);
  const resetSession = useCallback(() => {
    const next = nextQuerySession();
    scopeRef.current = next;
    setSessionScope(next);
    return next;
  }, []);
  const setUser = useCallback((next: UserProfile | null) => {
    const nextIdentity = next ? `${next.role}:${next.id}` : null;
    if (identity.current !== nextIdentity) resetSession();
    identity.current = nextIdentity;
    setUserState(next);
  }, [resetSession]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true muna habang chine-check
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const expireSession = useCallback((expectedScope: number) => {
    // An old request must never expire a newer login.
    if (scopeRef.current !== expectedScope) return;
    resetSession();
    setUser(null);
    setMustChangePassword(false);
  }, [resetSession, setUser]);

  useEffect(() => {
    let cancelled = false;
    const scope = scopeRef.current;
    async function rehydrate() {
      try {
        // Kung walang valid na cookie, dapat null ang ibalik ng getMe()
        const me = await AuthService.getMe();
        if (cancelled || scopeRef.current !== scope) return;
        if (me) {
          setMustChangePassword(me.mustChangePassword);
          try {
            const profile = await profileService.getMyProfile();
            if (!cancelled && scopeRef.current === scope) {
              identity.current = `${profile.role}:${profile.id}`;
              setUserState(profile);
            }
          } catch {
            if (!cancelled && scopeRef.current === scope) {
              identity.current = `${me.role}:${me.id}`;
              setUserState(me);
            }
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        if (!cancelled && scopeRef.current === scope) setIsLoading(false);
      }
    }
    rehydrate();
    return () => { cancelled = true; };
  }, []);

  async function login(
    user: UserProfile,
    _token?: string,
    mustChangePassword = false,
  ) {
    const scope = resetSession();
    identity.current = null;
    setUserState(null);
    setIsLoading(true);
    // Na-set na ng backend ang cookie sa login response, kaya walang localStorage dito
    setMustChangePassword(mustChangePassword);
    try {
      const profile = await profileService.getMyProfile();
      if (scopeRef.current === scope) {
        identity.current = `${profile.role}:${profile.id}`;
        setUserState(profile);
      }
    } catch {
      if (scopeRef.current === scope) {
        identity.current = `${user.role}:${user.id}`;
        setUserState(user);
      }
    } finally {
      if (scopeRef.current === scope) setIsLoading(false);
    }
  }

  function logout() {
    setLogoutModalOpen(true);
  }

  async function confirmLogout() {
    setLogoutModalOpen(false);
    const scope = resetSession();
    // Gate requests while the backend clears its HttpOnly cookie.
    setIsLoading(true);
    try {
      // httpOnly ang cookie, hindi ito mabubura ng JS. Backend ang dapat mag-clear.
      await AuthService.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      if (scopeRef.current === scope) {
        setUser(null);
        setMustChangePassword(false);
        setIsLoading(false);
      }
    }
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
        sessionScope,
        expireSession,
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
