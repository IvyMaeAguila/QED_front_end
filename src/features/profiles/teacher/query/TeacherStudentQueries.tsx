import { useEffect,useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { studentService } from "../../admin/pages/studentrecords/services/student-record.service";
import type { StudentsReader } from "../../admin/pages/studentrecords/context/StudentsContext";
import { useTeacherReader } from "./useTeacherReader";
import {useTeacherQueryScope} from './teacherQueryScope';

type Props = { onChange: (reader: StudentsReader | null) => void;navigationKey?:string };
function Driver({ onChange,navigationKey='' }: Props) {
  // The backend scopes this endpoint to verified subject/advisory assignments.
  const reader = useTeacherReader(["students", "authorized"], options => studentService.getAllStudents(options), error => error instanceof Error ? error.message : "Failed to load students");
  const { data, loading, error, retry } = reader;
  const scope=useTeacherQueryScope(),previousNavigation=useRef(navigationKey);
  const key=scope.key;
  useEffect(()=>{
    if(previousNavigation.current===navigationKey)return;
    previousNavigation.current=navigationKey;
    // The provider stays mounted across pages. Revalidate on navigation to
    // actual consumers, rather than leaving stale authorization cached forever.
    if(!/^\/teacher\/(?:students\/[^/]+|holistic\/(?!domain-trends(?:\/|$))[^/]+|grades)\/?$/.test(navigationKey))return;
    const state=queryClient.getQueryState([...key,'students','authorized']);
    if(state&&Date.now()-state.dataUpdatedAt>=30_000)retry();
  },[navigationKey,key,retry]);
  useEffect(() => {
    onChange({ students: data ?? [], loading, error, retry });
    return () => onChange(null);
  }, [data, loading, error, retry, onChange]);
  return null;
}
export default function TeacherStudentQueries(props: Props) {
  return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;
}
