import { createContext, useCallback,useContext, useMemo, useRef,useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { ReactNode } from "react";
import type { SchoolClass } from "../types/Class";
import { fetchClasses,createClass,updateClassApi, deleteClassApi, type ClassRecord } from "../services/classes.service";

export interface ClassesContextValue {
  classes: SchoolClass[];
  loading: boolean;
  error: string | null;
  getClass: (id: string) => SchoolClass | undefined;
  deleteClass: (id: string) => Promise<void>;
  refreshClasses: () => void;
  createClass:typeof createClass;
  updateClass:typeof updateClassApi;
  activateQueries:()=>void;
  serverRows:ClassRecord[];
  serverUpdatedAt:number;
}

const ClassesContext = createContext<ClassesContextValue | undefined>(undefined);

// day_of_week (full) -> short code na gamit ng frontend types
const DAY_SHORT_MAP: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

function mapRecordToSchoolClass(c: ClassRecord): SchoolClass & { studentCount: number } {
  return {
    id: String(c.id),
    gradeLevelId: c.gradeLevelId,
    gradeLevel: c.gradeLevel,
    sectionId: c.sectionId, 
    section: c.section,
    room: c.room,
    adviserId: String(c.adviserId),
    adviserName: c.adviserName,
    adviserEmail: c.adviserEmail,
    adviserContact: c.adviserContact,
    studentCount: c.studentCount,
    schedule: c.schedule.map((p) => ({
      id: String(p.id),
      subject: p.subject,
      teacherId: String(p.teacherId),
      teacherName: p.teacherName,
      startTime: p.startTime,
      endTime: p.endTime,
      days: p.days.map((d) => (DAY_SHORT_MAP[d] || d) as any),
    })),
  };
}

export interface ClassesReader {data:ClassRecord[];loading:boolean;error:string|null;retry:()=>void;}
const noop=()=>{};
const allowBootstrap=()=>true;
export function ClassesProvider({ children,reader,operations,activateQueries=noop,bootstrapEnabled=true,isBootstrapCurrent=allowBootstrap }: { children: ReactNode;reader?:ClassesReader;operations?:Pick<ClassesContextValue,'deleteClass'|'createClass'|'updateClass'>;activateQueries?:()=>void;bootstrapEnabled?:boolean;isBootstrapCurrent?:()=>boolean }) {
  const [localClasses, setClasses] = useState<ClassRecord[]>([]);
  const [localLoading, setLoading] = useState(true);
  const [localError, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [serverUpdatedAt,setServerUpdatedAt]=useState(0),activated=useRef(false);
  const activate=useCallback(()=>{activated.current=true;activateQueries();},[activateQueries]);

  const external=!!reader;
  const classes=useMemo(()=>(reader?.data??localClasses).map(mapRecordToSchoolClass),[reader?.data,localClasses]);
  const loading=reader?.loading??localLoading;
  const error=reader?reader.error:localError;
  useEffect(() => {
    if(external){setClasses(previous=>previous.length?[]:previous);return;}
    if(!bootstrapEnabled||activated.current||!isBootstrapCurrent())return;
    const controller=new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    fetchClasses({signal:controller.signal})
      .then((data) => {
        if (active) {setClasses(data);setServerUpdatedAt(Date.now());}
      })
      .catch((err) => {
        if(!controller.signal.aborted)console.error(err);
        if (active) setError("Failed to load classes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadFlag,external,bootstrapEnabled,isBootstrapCurrent]);

  const value = useMemo<ClassesContextValue>(
    () => ({
      classes,
      loading,
      error,
      createClass,updateClass:updateClassApi,activateQueries:activate,serverRows:reader?.data??localClasses,serverUpdatedAt,
      getClass: (id) => classes.find((c) => c.id === id),
      deleteClass: async (id) => {
        if(external)throw new Error("Teacher class context is read-only.");
        await deleteClassApi(id);
        setClasses((prev) => prev.filter((c) => String(c.id) !== id));
      },
      refreshClasses: () => {if(reader)reader.retry();else setReloadFlag((f) => f + 1);},
      ...operations,
    }),
    [classes, loading, error,external,reader,operations,activate,localClasses,serverUpdatedAt]
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within a ClassesProvider");
  return ctx;
}
