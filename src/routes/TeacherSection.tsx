import { TeacherLayout } from "../features/profiles/teacher/pages/TeacherLayout";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";
import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";

export function TeacherSection() {
  return (
    <StudentsProvider>
      <TeachersProvider>
        <ClassesProvider>
          <TeacherLayout onLogout={() => console.log("Logging out...")} />
        </ClassesProvider>
      </TeachersProvider>
    </StudentsProvider>
  );
}