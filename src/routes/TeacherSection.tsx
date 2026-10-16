import { useAuth } from "../features/auth/context/authContext";
import { TeacherLayout } from "../features/profiles/teacher/pages/TeacherLayout";
import {TeacherScheduleProviders} from '../features/profiles/teacher/query/TeacherScheduleProviders';
import { TeacherStudentsProvider } from "../features/profiles/teacher/query/TeacherStudentsProvider";
import {useLocation} from 'react-router-dom';

export function TeacherSection() {
  const { logout } = useAuth();
  const {pathname}=useLocation();

  return (
    <TeacherStudentsProvider navigationKey={pathname}>
      <TeacherScheduleProviders>
          <TeacherLayout onLogout={logout} />
      </TeacherScheduleProviders>
    </TeacherStudentsProvider>
  );
}
