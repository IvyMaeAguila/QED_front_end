import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { routeSkeletons } from "../../shared/loading/routeSkeletons";
import { RouteViewsContext } from "../../shared/loading/RouteViewsContext";
import { routeViews } from "./PrincipalViews";
import { PrincipalSection } from "../PrincipalSection";
const CalendarPage = lazy(routeSkeletons["/admin/calendar"].load);
const HelpSupportPage = lazy(routeSkeletons["/admin/help"].load);
const PrincipalDashboardHome = lazy(routeSkeletons["/principal"].load);
const PrincipalStudentsPage = lazy(routeSkeletons["/principal/students"].load);
const ClassListPage = lazy(routeSkeletons["/principal/students/class/:classId"].load);
const PrincipalTeachersPage = lazy(routeSkeletons["/principal/teachers"].load);
const TeacherSchedulePage = lazy(routeSkeletons["/principal/teachers/:teacherId"].load);
const AnalyticsPage = lazy(routeSkeletons["/principal/reports"].load);
const PrincipalGradebooksPage = lazy(routeSkeletons["/principal/gradebooks"].load);
const PrincipalGradeSheetPage = lazy(routeSkeletons["/principal/gradebooks/:grade"].load);
const HolisticPerformanceAnalyticsPage = lazy(routeSkeletons["/principal/holistic-performance-analytics"].load);
export default function PrincipalRoutes() {
 return <RouteViewsContext.Provider value={routeViews}><Routes><Route element={<PrincipalSection/>}>
          <Route index element={<PrincipalDashboardHome />} />
          <Route path="students" element={<PrincipalStudentsPage />} />
          <Route path="students/class/:classId" element={<ClassListPage />} />
          <Route path="students/grade/:gradeId" element={<ClassListPage />} />
          <Route path="teachers" element={<PrincipalTeachersPage />} />
          <Route path="teachers/:teacherId" element={<TeacherSchedulePage />} />
          <Route path="reports" element={<AnalyticsPage />} />
          <Route
            path="holistic-performance-analytics"
            element={<HolisticPerformanceAnalyticsPage />}
          />
          <Route path="gradebooks" element={<PrincipalGradebooksPage />} />
          <Route
            path="gradebooks/:grade"
            element={<PrincipalGradeSheetPage />}
          />
          <Route path="calendar" element={<CalendarPage viewerRole="PRINCIPAL" />} />
          <Route path="help" element={<HelpSupportPage audience="PRINCIPAL" />} />
        </Route></Routes></RouteViewsContext.Provider>;
}
