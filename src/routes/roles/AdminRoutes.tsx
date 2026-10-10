import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { routeSkeletons } from "../../shared/loading/routeSkeletons";
import { RouteViewsContext } from "../../shared/loading/RouteViewsContext";
import { routeViews } from "./AdminViews";
import { useAuth } from "../../features/auth/context/authContext";
import { AdminLayout } from "../../features/profiles/admin/pages/AdminLayout";
import { StudentsProvider } from "../../features/profiles/admin/pages/studentrecords/context/StudentsContext";
import { UsersProvider } from "../../features/profiles/admin/pages/usermanagement/context/UsersContext";
import { TeachersProvider } from "../../features/profiles/admin/pages/classes/context/TeachersContext";
import { ClassesProvider } from "../../features/profiles/admin/pages/classes/context/ClassesContext";
import { SubjectsSection } from "../../features/profiles/admin/pages/subjects/SubjectSection";
function AdminSection() {
  const { logout } = useAuth();

  return (
    <StudentsProvider>
      <UsersProvider>
        <TeachersProvider>
          <ClassesProvider>
            <AdminLayout onLogout={logout} />
          </ClassesProvider>
        </TeachersProvider>
      </UsersProvider>
    </StudentsProvider>
  );
}
const AdminDashboardHome = lazy(routeSkeletons["/admin"].load);
const StudentRecordsPage = lazy(routeSkeletons["/admin/students"].load);
const StudentFormPage = lazy(routeSkeletons["/admin/students/:studentId/edit"].load);
const UserManagementPage = lazy(routeSkeletons["/admin/users"].load);
const UserFormPage = lazy(routeSkeletons["/admin/users/:role/:userId/edit"].load);
const UserViewPage = lazy(routeSkeletons["/admin/users/:role/:userId"].load);
const ClassesPage = lazy(routeSkeletons["/admin/classes"].load);
const ClassFormPage = lazy(routeSkeletons["/admin/classes/:classId/edit"].load);
const ClassViewPage = lazy(routeSkeletons["/admin/classes/:classId"].load);
const ManageSubjectsPage = lazy(routeSkeletons["/admin/subjects"].load);
const CalendarPage = lazy(routeSkeletons["/admin/calendar"].load);
const HelpSupportPage = lazy(routeSkeletons["/admin/help"].load);
const AcademicYearPage = lazy(routeSkeletons["/admin/academic-year"].load);
const AddSubjectPage = lazy(routeSkeletons["/admin/subjects/new"].load);
const AdminSubjectDetailPage = lazy(routeSkeletons["/admin/subjects/:subjectId"].load);
export default function AdminRoutes() {
 return <RouteViewsContext.Provider value={routeViews}><Routes><Route element={<AdminSection/>}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="students" element={<StudentRecordsPage />} />
          <Route path="students/new" element={<StudentFormPage />} />
          {/* <Route path="students/:studentId" element={<StudentDetailPage />} /> */}
          <Route
            path="students/:studentId/edit"
            element={<StudentFormPage />}
          />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:role/:userId" element={<UserViewPage />} />
          <Route path="users/:role/:userId/edit" element={<UserFormPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/new" element={<ClassFormPage />} />
          <Route path="classes/:classId" element={<ClassViewPage />} />
          <Route path="classes/:classId/edit" element={<ClassFormPage />} />
          <Route path="subjects" element={<SubjectsSection />}>
            <Route index element={<ManageSubjectsPage />} />
            <Route path="new" element={<AddSubjectPage />} />
            <Route path=":subjectId" element={<AdminSubjectDetailPage />} />
          </Route>
          <Route path="academic-year" element={<AcademicYearPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="help" element={<HelpSupportPage audience="ADMIN" />} />
        </Route></Routes></RouteViewsContext.Provider>;
}
