import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/authentication.service"; // i-adjust path base sa totoong location

interface User {
  id: string;
  user_name: string;
  role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRoleHome(role?: string): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin";
    case "PRINCIPAL":
      return "/principal";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    default:
      return "/login";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getMe();
        setUser(currentUser);
      } catch (err) {
        console.error("Auth check failed", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (userName: string, password: string) => {
    const data = await AuthService.login({ userName, password });

    setUser({
      id: data.id,
      user_name: data.userName, // note: AuthService currently maps user_name -> "email" field, tingnan yung note sa baba
      role: data.role,
    });

    navigate(getRoleHome(data.role));
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}