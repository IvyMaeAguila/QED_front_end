import { lazy, Suspense, useCallback, useState, type ReactNode } from "react";
import { useAuth } from "@shared/hooks/useAuth";
import { StudentsProvider, type StudentsReader } from "../../admin/pages/studentrecords/context/StudentsContext";

const TeacherStudentQueries = lazy(() => import("./TeacherStudentQueries"));
const pendingStudents: StudentsReader = { students: [], loading: true, error: null, retry: () => {} };
// Stable lightweight facade: the lazy data driver never remounts the role shell.
export function TeacherStudentsProvider({ children,navigationKey='' }: { children: ReactNode;navigationKey?:string }) {
  const { user, sessionScope } = useAuth();
  const identity = `${sessionScope}:${user?.role}:${user?.id}`;
  const [snapshot, setSnapshot] = useState<{ identity: string; reader: StudentsReader | null } | null>(null);
  const publish = useCallback((reader: StudentsReader | null) => setSnapshot({ identity, reader }), [identity]);
  return <StudentsProvider reader={snapshot?.identity === identity ? snapshot.reader ?? pendingStudents : pendingStudents}>
    <Suspense fallback={null}><TeacherStudentQueries key={identity} onChange={publish} navigationKey={navigationKey}/></Suspense>
    {children}
  </StudentsProvider>;
}
