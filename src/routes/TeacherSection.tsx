import { useAuth } from "../shared/AuthContext"; // ✅ idagdag ang import
import { TeacherLayout } from "../features/profiles/teacher/pages/TeacherLayout";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";
import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";

export function TeacherSection() {
  const { logout } = useAuth(); // ✅ idagdag

  return (
    <StudentsProvider>
      <TeachersProvider>
        <ClassesProvider>
          <TeacherLayout onLogout={logout} /> {/* ✅ palitan */}
        </ClassesProvider>
      </TeachersProvider>
    </StudentsProvider>
  );
}