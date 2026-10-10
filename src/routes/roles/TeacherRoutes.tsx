import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { routeSkeletons } from "../../shared/loading/routeSkeletons";
import { RouteViewsContext } from "../../shared/loading/RouteViewsContext";
import { routeViews } from "./TeacherViews";
import { TeacherSection } from "../TeacherSection";
const StudentDetailPage = lazy(routeSkeletons["/teacher/students/:studentId"].load);
const HelpSupportPage = lazy(routeSkeletons["/admin/help"].load);
const TeacherDashboardHome = lazy(routeSkeletons["/teacher"].load);
const AdvisoryRosterPage = lazy(routeSkeletons["/teacher/advisory"].load);
const GradesPage = lazy(routeSkeletons["/teacher/grades"].load);
const SubjectsPage = lazy(routeSkeletons["/teacher/subjects"].load);
const CalendarPageView = lazy(routeSkeletons["/teacher/calendar"].load);
const SubjectDetailPage = lazy(routeSkeletons["/teacher/subjects/:subjectId"].load);
const SubjectRecordsPage = lazy(routeSkeletons["/teacher/subjects/:subjectId/records"].load);
const HolisticOverviewPage = lazy(routeSkeletons["/teacher/holistic"].load);
const StudentHolisticProfilePage = lazy(routeSkeletons["/teacher/holistic/:studentId"].load);
const HolisticDomainTrendsPage = lazy(routeSkeletons["/teacher/holistic/domain-trends"].load);
const SubjectClassListPage = lazy(routeSkeletons["/teacher/subjects/:subjectSectionId/students"].load);
const TeacherAttendancePage = lazy(routeSkeletons["/teacher/attendance"].load);
const TeacherAttendanceRecordsPage = lazy(routeSkeletons["/teacher/attendance/records"].load);
export default function TeacherRoutes() {
 return <RouteViewsContext.Provider value={routeViews}><Routes><Route element={<TeacherSection/>}>
          <Route index element={<TeacherDashboardHome />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route
            path="attendance/records"
            element={<TeacherAttendanceRecordsPage />}
          />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route
            path="subjects/:subjectId/records"
            element={<SubjectRecordsPage />}
          />
          <Route
            path="subjects/:subjectSectionId/students"
            element={<SubjectClassListPage />}
          />
          <Route path="grades" element={<GradesPage />} />
          <Route path="holistic" element={<HolisticOverviewPage />} />
          <Route
            path="holistic/:studentId"
            element={<StudentHolisticProfilePage />}
          />
          <Route
            path="holistic/domain-trends"
            element={<HolisticDomainTrendsPage />}
          />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="advisory" element={<AdvisoryRosterPage />} />
          <Route path="calendar" element={<CalendarPageView />} />
          <Route path="help" element={<HelpSupportPage audience="TEACHER" />} />
        </Route></Routes></RouteViewsContext.Provider>;
}
