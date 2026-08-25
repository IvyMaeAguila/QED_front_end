// src/shared/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
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
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}