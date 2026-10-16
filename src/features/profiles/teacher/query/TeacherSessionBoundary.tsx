import { Fragment, type ReactNode } from "react";
import { useAuth } from "@shared/hooks/useAuth";

// Views with legacy local projections must never retain another session's rows.
// Keep the central QueryClient stable; reset only this page's local projection.
export function TeacherSessionBoundary({ children, resource='' }: { children: ReactNode;resource?:string }) {
  const { sessionScope, user } = useAuth();
  return <Fragment key={`${sessionScope}:${user?.role}:${user?.id}:${resource}`}>{children}</Fragment>;
}
