import { AdminDashboardHomeComposition } from "./AdminDashboardHome.loading-view";
import { lazy, Suspense, useState } from "react";
import { useAuth } from "@shared/hooks/useAuth";
import { useStudents } from "../studentrecords/context/StudentsContext";
import { useUsers } from "../usermanagement/context/UsersContext";
import { useTeachers } from "../classes/context/TeachersContext";
import { useClasses } from "../classes/context/ClassesContext";
export { AdminDashboardHomeComposition } from "./AdminDashboardHome.loading-view";
export type { AdminDashboardHomeEffectScope, AdminDashboardHomeRouteProps } from "./AdminDashboardHome.loading-view";

const DashboardQueries = lazy(() => import("./AdminDashboardQueries").then(module => ({ default: module.AdminDashboardQueryBoundary })));
function DashboardStartup({ activity = false }: { activity?: boolean }) {
 const students = useStudents(), users = useUsers(), teachers = useTeachers(), classes = useClasses();
 const [initialized, setInitialized] = useState(false);
 const pending = students.loading || users.loading || teachers.loading || classes.loading;
 // Keep the initial Admin shell/preview Query-free. Existing providers settle on
 // success OR error; later provider refetches must not reset dashboard drafts.
 if (!initialized && !pending) setInitialized(true);
 if (!initialized && pending) return <AdminDashboardHomeComposition activity={activity}/>;
 return <Suspense fallback={<AdminDashboardHomeComposition activity={activity}/>}><DashboardQueries activity={activity}/></Suspense>;
}
function AdminDashboardRoute({ activity = false }: { activity?: boolean }) {
 const { sessionScope, user } = useAuth();
 return <DashboardStartup activity={activity} key={`${sessionScope}:${user?.role}:${user?.id}`}/>;
}

export function AdminDashboardHome() { return <AdminDashboardRoute />; }
export function AdminAccountActivity() { return <AdminDashboardRoute activity />; }
