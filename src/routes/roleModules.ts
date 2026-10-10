import { useSyncExternalStore } from "react";
import type { ComponentType } from "react";
export type Role = "ADMIN" | "TEACHER" | "PRINCIPAL" | "PARENT";
const imports = {
  ADMIN: () => import("./roles/AdminRoutes"),
  TEACHER: () => import("./roles/TeacherRoutes"),
  PRINCIPAL: () => import("./roles/PrincipalRoutes"),
  PARENT: () => import("./roles/ParentRoutes"),
};
type State = { View?: ComponentType; error?: unknown; pending?: Promise<void> };
const idle: State = {};
const states = new Map<Role, State>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
export function preloadRole(value: string | undefined) {
  const role = value?.toUpperCase() as Role;
  if (!(role in imports) || states.has(role)) return;
  const pending = imports[role]().then(
    module => { states.set(role, { View: module.default }); notify(); },
    error => { states.set(role, { error }); notify(); },
  );
  states.set(role, { pending });
  notify();
}
export function retryRole(role: Role) { states.delete(role); preloadRole(role); }
export function useRoleModule(role: Role | undefined) {
  return useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => role ? states.get(role) ?? idle : idle,
  );
}
