import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role, UserAccount, UserStatus } from "../types/user";
import { UserService } from "../services/user-record.service"; // adjust path base sa actual location mo

export type NewUserInput = Omit<UserAccount, "id" | "lastLogin">;
export type UserUpdateInput = Omit<UserAccount, "id" | "lastLogin">;

interface UsersContextValue {
  users: UserAccount[];
  loading: boolean;
  error: string | null;
  refetchUsers: () => Promise<void>;
  getUser: (id: string) => UserAccount | undefined;
  getActivePrincipal: (excludeId?: string) => UserAccount | undefined;
  addUser: (user: NewUserInput) => Promise<UserAccount>;
  updateUser: (id: string, updates: UserUpdateInput) => Promise<void>;
  deleteUser: (id: string, role: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetchUsers();
  }, []);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      loading,
      error,
      refetchUsers,
      getUser: (id) => users.find((u) => u.id === id),
      getActivePrincipal: (excludeId) =>
        users.find((u) => u.role === "PRINCIPAL" && u.status === "Active" && u.id !== excludeId),

      addUser: async (input) => {
        const result = await UserService.addUser(input);
        await refetchUsers(); // i-refresh yung list para makuha yung totoong ID galing DB
        return result.data;
      },

      updateUser: async (id, updates) => {
        await UserService.updateUser(id, updates);
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      },

      deleteUser: async (id, role) => {
        await UserService.deleteUser(id, role);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      },
    }),
    [users, loading, error]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within a UsersProvider");
  return ctx;
}

export function principalConflict(
  role: Role,
  status: UserStatus,
  activePrincipal: UserAccount | undefined
): UserAccount | undefined {
  if (role !== "PRINCIPAL" || status !== "Active") return undefined;
  return activePrincipal;
}