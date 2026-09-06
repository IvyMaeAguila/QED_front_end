import { useAuth } from "../features/auth/context/authContext";
import { PrincipalLayout } from "../features/profiles/principal/pages/PrincipalLayout";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";
import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";

export function PrincipalSection() {
  const { logout } = useAuth();

  return (
    <StudentsProvider>
      <TeachersProvider>
        <ClassesProvider>
          <PrincipalLayout onLogout={logout} />
        </ClassesProvider>
      </TeachersProvider>
    </StudentsProvider>
  );
}