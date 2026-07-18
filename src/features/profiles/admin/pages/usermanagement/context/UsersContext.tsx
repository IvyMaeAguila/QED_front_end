import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Role, UserAccount, UserStatus } from "../types/user";
import { seedUsers, getNextUserId } from "../data/usersData";

export type NewUserInput = Omit<UserAccount, "id" | "lastLogin">;
export type UserUpdateInput = Omit<UserAccount, "id" | "lastLogin">;

interface UsersContextValue {
  users: UserAccount[];
  getUser: (id: string) => UserAccount | undefined;
  getActivePrincipal: (excludeId?: string) => UserAccount | undefined;
  addUser: (user: NewUserInput) => UserAccount;
  updateUser: (id: string, updates: UserUpdateInput) => void;
  deleteUser: (id: string) => void;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(seedUsers);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      getUser: (id) => users.find((u) => u.id === id),
      getActivePrincipal: (excludeId) =>
        users.find((u) => u.role === "PRINCIPAL" && u.status === "Active" && u.id !== excludeId),
      addUser: (input) => {
        const newUser: UserAccount = { ...input, id: getNextUserId(users, input.role), lastLogin: null };
        setUsers((prev) => [...prev, newUser]);
        return newUser;
      },
      updateUser: (id, updates) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      },
      deleteUser: (id) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      },
    }),
    [users]
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