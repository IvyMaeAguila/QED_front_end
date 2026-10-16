import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { routeSkeletons } from "../../shared/loading/routeSkeletons";
import { RouteViewsContext } from "../../shared/loading/RouteViewsContext";
import { routeViews } from "./ParentViews";
import { ParentSection } from "../ParentSection";
const HelpSupportPage = lazy(routeSkeletons["/admin/help"].load);
const ParentDashboardHome = lazy(routeSkeletons["/parent"].load);
const EnrolledChildrenPage = lazy(routeSkeletons["/parent/enrolled-children"].load);
const ChildDetailPage = lazy(routeSkeletons["/parent/students/:studentId"].load);
const TopicSupportChoice = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/support"].load);
const CoursewareView = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/courseware"].load);
const CalendarPageView = lazy(routeSkeletons["/teacher/calendar"].load);
const PetQuizPage = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/quiz"].load);
export default function ParentRoutes() {
 return <RouteViewsContext.Provider value={routeViews}><Routes><Route element={<ParentSection/>}>
          <Route index element={<ParentDashboardHome />} />
          <Route path="enrolled-children" element={<EnrolledChildrenPage />} />
          <Route path="students/:studentId" element={<ChildDetailPage />} />
          <Route
            path="students/:studentId/topics/:topicId/support"
            element={<TopicSupportChoice />}
          />
          <Route
            path="students/:studentId/topics/:topicId/courseware"
            element={<CoursewareView />}
          />
          <Route
            path="students/:studentId/topics/:topicId/quiz"
            element={<PetQuizPage />}
          />
          <Route path="calendar" element={<CalendarPageView />} />
          <Route path="help" element={<HelpSupportPage audience="PARENT" />} />
        </Route></Routes></RouteViewsContext.Provider>;
}
