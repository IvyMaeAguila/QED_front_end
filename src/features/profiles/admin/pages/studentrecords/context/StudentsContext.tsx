import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { ReactNode } from "react";
import type { Student } from "../types/Students";
// import { seedStudents } from "../data/studentData";
import { studentService } from "../services/student-record.service";
import {fetchGradeLevels,fetchSectionByGrade} from '../services/grade-section.service';

export interface StudentsContextValue {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStudent: (id: string) => Student | undefined;
  addStudent: (student: Student) => Student;
  addStudents: (students: Student[]) => void;
  updateStudent: (dbId: number, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (dbId: number) => Promise<void>;
  createRecord:(payload:Record<string,unknown>)=>Promise<{id?:number;data?:{id?:number}}>;
  fetchGrades:typeof fetchGradeLevels;
  fetchSections:typeof fetchSectionByGrade;
  activateQueries:()=>void;
  serverUpdatedAt:number;
}
export type StudentOperations=Pick<StudentsContextValue,'refetch'|'addStudent'|'addStudents'|'updateStudent'|'deleteStudent'|'createRecord'|'fetchGrades'|'fetchSections'>;
const noop=()=>{};

const StudentsContext = createContext<StudentsContextValue | undefined>(
  undefined,
);

export interface StudentsReader {
  students: Student[]; loading: boolean; error: string | null; retry: () => void;
}
export function StudentsProvider({ children, reader,operations,activateQueries=noop,bootstrapEnabled=true }: { children: ReactNode; reader?: StudentsReader;operations?:StudentOperations;activateQueries?:()=>void;bootstrapEnabled?:boolean }) {
  const [localStudents, setStudents] = useState<Student[]>([]);
  const [localLoading, setLoading] = useState(true);
  const [localError, setError] = useState<string | null>(null);
  const [serverUpdatedAt,setServerUpdatedAt]=useState(0);
  const request=useRef<AbortController|null>(null);
  const queryActivated=useRef(false);
  const activate=useCallback(()=>{queryActivated.current=true;activateQueries();},[activateQueries]);
  const students = reader?.students ?? localStudents;
  const loading = reader?.loading ?? localLoading;
  const error = reader ? reader.error : localError;
  const external = !!reader;

  const fetchStudents = useCallback(async () => {
    if (reader) { reader.retry(); return; }
    // A child may activate the lazy driver before this bootstrap effect runs.
    // Retire synchronously so the outgoing effect cannot start a second read.
    if(queryActivated.current||!bootstrapEnabled)return;
    request.current?.abort();const controller=new AbortController();request.current=controller;
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAllStudents({signal:controller.signal});
      if(controller.signal.aborted)return;
      setStudents(data);
      setServerUpdatedAt(Date.now());
    } catch (err) {
      if(!controller.signal.aborted)setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      if(!controller.signal.aborted)setLoading(false);
    }
  }, [reader,bootstrapEnabled]);

  useEffect(() => {
    if (!external) void fetchStudents();
    else setStudents(previous=>previous.length?[]:previous);
    return()=>request.current?.abort();
  }, [external, fetchStudents]);

  function sortStudents(list: Student[]): Student[] {
    return [...list].sort((a, b) => { 
      if (a.gradeLevelId !== b.gradeLevelId) {
        return a.gradeLevelId - b.gradeLevelId;
      }
      return (a.section ?? "").localeCompare(b.section ?? "");
    });
  }

  const value = useMemo<StudentsContextValue>(
    () => ({
      students,
      loading,
      error,
      activateQueries:activate,serverUpdatedAt,
      createRecord:studentService.addNewStudent,
      fetchGrades:fetchGradeLevels,fetchSections:fetchSectionByGrade,
      refetch: fetchStudents,
      getStudent: (id) => students.find((s) => s.id === id),
      addStudent: (student) => {
        setStudents((prev) => sortStudents([...prev, student]));
        return student;
      },
      addStudents: (newStudents) => {
        setStudents((prev) => sortStudents([...prev, ...newStudents]));
      },

      updateStudent: async (dbId: number, updates: Partial<Student>) => {
        await studentService.updateStudent(dbId, updates);
        await fetchStudents();
      },
      deleteStudent: async (dbId: number) => {
        await studentService.softDeleteStudent(dbId);
        await fetchStudents();
      },
      ...operations,
    }),
    [students, loading, error, fetchStudents,operations,activate,serverUpdatedAt],
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error("useStudents must be used within a StudentsProvider");
  return ctx;
}
