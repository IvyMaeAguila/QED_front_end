import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Teacher } from "../types/types";
import { fetchTeachers, type TeacherRow } from "../services/teacher.service";

interface TeachersContextValue {
  teachers: Teacher[];
  loading: boolean;

  getTeacher: (id: string) => Teacher | undefined;

  getTeacherByUserId: (
    userId: string
  ) => Teacher | undefined;

  reloadTeachers: () => Promise<void>;
}

const TeachersContext = createContext<
  TeachersContextValue | undefined
>(undefined);

function mapTeacherRow(row: TeacherRow): Teacher {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    email: row.email_address,
    contactNumber: row.contact_number,
  };
}

export function TeachersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      setLoading(true);

      const rows = await fetchTeachers();

      setTeachers(rows.map(mapTeacherRow));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const value: TeachersContextValue = {
    teachers,
    loading,

    getTeacher: (id) => {
      return teachers.find((teacher) => teacher.id === id);
    },

    getTeacherByUserId: (userId) => {
      return teachers.find(
        (teacher) => teacher.userId === userId
      );
    },

    reloadTeachers: loadTeachers,
  };

  return (
    <TeachersContext.Provider value={value}>
      {children}
    </TeachersContext.Provider>
  );
}

export function useTeachers() {
  const context = useContext(TeachersContext);

  if (!context) {
    throw new Error(
      "useTeachers must be used inside TeachersProvider"
    );
  }

  return context;
}