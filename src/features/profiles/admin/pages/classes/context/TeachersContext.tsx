import { createContext, useCallback,useContext, useMemo, useRef,useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { ReactNode } from "react";
import type { Teacher } from "../types/Teacher";
import { fetchTeachers,type TeacherRow } from "../../subjects/services/teacher.service";

export interface TeachersContextValue {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  refetchTeachers: (changed?:boolean) => void;
  getTeacher: (id: string) => Teacher | undefined;
  getTeacherByUserId: (userId: string) => Teacher | undefined;
  deleteTeacher: (id: string) => void;
  activateQueries:()=>void;
  serverRows:TeacherRow[];
  serverUpdatedAt:number;
}


const TeachersContext = createContext<TeachersContextValue | undefined>(undefined);

export interface TeachersReader {data:TeacherRow[];loading:boolean;error:string|null;retry:(changed?:boolean)=>void;}
const noop=()=>{};
const allowBootstrap=()=>true;
export function TeachersProvider({ children,reader,activateQueries=noop,bootstrapEnabled=true,isBootstrapCurrent=allowBootstrap }: { children: ReactNode;reader?:TeachersReader;activateQueries?:()=>void;bootstrapEnabled?:boolean;isBootstrapCurrent?:()=>boolean }) {
const [localTeachers, setTeachers] = useState<TeacherRow[]>([]);
const [localLoading, setLoading] = useState(true);
const [localError, setError] = useState<string | null>(null);
const [attempt, setAttempt] = useState(0);
const [serverUpdatedAt,setServerUpdatedAt]=useState(0),activated=useRef(false);
const activate=useCallback(()=>{activated.current=true;activateQueries();},[activateQueries]);
const external=!!reader;
const rows=reader?.data??localTeachers;
const teachers=useMemo<Teacher[]>(()=>rows.map((row)=>({id:String(row.id),userId:String(row.user_id),firstName:row.first_name,lastName:row.last_name,middleName:row.middle_name,email:row.email_address,contactNumber:row.contact_number,gender:row.gender??undefined,avatarKey:row.avatar_key??undefined})),[rows]);
const loading=reader?.loading??localLoading;
const error=reader?reader.error:localError;
useEffect(() => {
  if(external){setTeachers(previous=>previous.length?[]:previous);return;}
  if(!bootstrapEnabled||activated.current||!isBootstrapCurrent())return;
  const controller=new AbortController();
  let active = true;
  async function loadTeachers() {
    setLoading(true); setError(null);
    try {
      const rows = await fetchTeachers({signal:controller.signal});
      if (!active) return;
      setTeachers(rows);setServerUpdatedAt(Date.now());
    } catch (error) {
      if(!controller.signal.aborted)console.error(error);
      if (active) setError(error instanceof Error ? error.message : "Failed to load teachers.");
    } finally {
      if (active) setLoading(false);
    }
  }

  loadTeachers();
  return () => { active = false;controller.abort(); };
}, [attempt,external,bootstrapEnabled,isBootstrapCurrent]);

  const value = useMemo<TeachersContextValue>(
    () => ({
      teachers,
      loading,
      error,
      activateQueries:activate,serverRows:rows,serverUpdatedAt,
      refetchTeachers: changed => {if(reader)reader.retry(changed);else setAttempt(value => value + 1);},
      getTeacher: (id) => teachers.find((t) => t.id === id),
      getTeacherByUserId: (userId) => teachers.find((t) => t.userId === userId),
      deleteTeacher: (id) => {
        setTeachers((prev) => prev.filter((t) => String(t.id) !== id));
      },
    }),
    [teachers, loading, error,reader,activate,rows,serverUpdatedAt]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers must be used within a TeachersProvider");
  return ctx;
}
