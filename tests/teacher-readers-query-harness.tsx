import { StrictMode, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, notifyManager } from "@tanstack/react-query";
import { AuthProvider } from "../src/features/auth/context/authContext";
import { useAuth } from "../src/shared/hooks/useAuth";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewOutletContext, RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { useTeacherReader } from "../src/features/profiles/teacher/query/useTeacherReader";
import { assignedSubjectsService } from "../src/features/profiles/teacher/pages/subjects/services/subjects.service";
import { subjectClassListService } from "../src/features/profiles/teacher/pages/subjects/services/subjectClassList.service";
import type { UserProfile } from "../src/shared/profile/types/types";
import { TeacherStudentsProvider } from "../src/features/profiles/teacher/query/TeacherStudentsProvider";
import { useStudents } from "../src/features/profiles/admin/pages/studentrecords/context/StudentsContext";
import { BrowserRouter,MemoryRouter,Routes,Route,useNavigate,useLocation } from "react-router-dom";
import { TeacherAdvisoryQueries } from "../src/features/profiles/teacher/query/TeacherAdvisoryQueries";
import { useSelectedAdvisorySection } from "../src/features/profiles/teacher/pages/attendance/services/useSelectedAdvisorySection.service";
import { HolisticOverviewPage } from "../src/features/profiles/teacher/pages/holistic/HolisticOverviewPage";
import { HolisticDomainTrendsPage } from "../src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage";
import "../src/style.css";
import { TeacherAttendancePage } from "../src/features/profiles/teacher/pages/attendance/TeacherAttendancePage";
import { GradesPage } from "../src/features/profiles/teacher/pages/grades/GradePage";
import {SubjectDetailPage} from "../src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage";
import {SubjectRecordsPage} from "../src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage";
import {TeacherScheduleProviders} from "../src/features/profiles/teacher/query/TeacherScheduleProviders";
import {StudentDetailPage} from "../src/shared/components/StudentDetailPage";
export function ScheduleNavigation(){const navigate=useNavigate();return <><button onClick={()=>navigate('/teacher')}>Dashboard</button><button onClick={()=>navigate('/teacher/students/1')}>Student 1</button><button onClick={()=>navigate('/teacher/students/2')}>Student 2</button></>;}
export function ScheduleObserver(){return <MemoryRouter initialEntries={['/teacher']}><TeacherStudentsProvider><TeacherScheduleProviders><RoutePreviewOutletContext.Provider value={{darkMode:false,panelBg:'bg-white',panelBorder:'border-gray-200',textPrimary:'text-gray-900',textMuted:'text-gray-500'}}><ScheduleNavigation/><Routes><Route path="/teacher" element={<div>Dashboard content</div>}/><Route path="/teacher/students/:studentId" element={<StudentDetailPage/>}/></Routes></RoutePreviewOutletContext.Provider></TeacherScheduleProviders></TeacherStudentsProvider></MemoryRouter>;}
export function AcademicNavigation(){const navigate=useNavigate(),location=useLocation();return <><pre data-testid="academic-location">{location.pathname}</pre><button onClick={()=>navigate('/teacher/subjects/1')}>Subject 1</button><button onClick={()=>navigate('/teacher/subjects/2')}>Subject 2</button></>;}
export function AcademicObserver(){return <MemoryRouter initialEntries={['/teacher/subjects/1']}><RoutePreviewOutletContext.Provider value={{darkMode:false,panelBg:'bg-white',panelBorder:'border-gray-200',textPrimary:'text-gray-900',textMuted:'text-gray-500'}}><AcademicNavigation/><Routes><Route path="/teacher/subjects/:subjectId" element={<SubjectDetailPage/>}/><Route path="/teacher/subjects/:subjectId/records" element={<SubjectRecordsPage/>}/></Routes></RoutePreviewOutletContext.Provider></MemoryRouter>;}
export function GradeObserver(){return <BrowserRouter><TeacherStudentsProvider><RoutePreviewOutletContext.Provider value={{darkMode:false,panelBg:'bg-white',panelBorder:'border-gray-200',textPrimary:'text-gray-900',textMuted:'text-gray-500'}}><GradesPage/></RoutePreviewOutletContext.Provider></TeacherStudentsProvider></BrowserRouter>;}
export function AttendanceObserver(){return <BrowserRouter><RoutePreviewOutletContext.Provider value={{darkMode:false,panelBg:'bg-white',panelBorder:'border-gray-200',textPrimary:'text-gray-900',textMuted:'text-gray-500'}}><TeacherAttendancePage/></RoutePreviewOutletContext.Provider></BrowserRouter>;}
export function HolisticObserver() {
 const theme={darkMode:false,panelBg:'#fff',panelBorder:'#ddd',textPrimary:'#222',textMuted:'#666'};
 return <BrowserRouter><RoutePreviewOutletContext.Provider value={theme}>{new URLSearchParams(location.search).has('domains')?<HolisticDomainTrendsPage/>:<HolisticOverviewPage/>}</RoutePreviewOutletContext.Provider></BrowserRouter>;
}
export function AdvisoryObserver() {
  const reader=useSelectedAdvisorySection();
  return <section><pre data-testid="advisory-data">{JSON.stringify(reader.sections)}</pre><pre data-testid="advisory-selected">{JSON.stringify(reader.section)}</pre><span data-testid="advisory-error">{reader.error}</span><button onClick={reader.retry}>Retry advisory</button><button onClick={()=>reader.selectSection('2')}>Select advisory 2</button></section>;
}
export function StudentObserver() {
  const students = useStudents();
  return <section><pre data-testid="students-data">{JSON.stringify(students.students)}</pre><span data-testid="students-loading">{String(students.loading)}</span><span data-testid="students-error">{students.error}</span><button onClick={() => void students.refetch()}>Retry students</button></section>;
}
export function Reader({ target }: { target: number }) {
  const subjects = useTeacherReader(["subjects", "assigned"], o => assignedSubjectsService.getAssignedSubjects(o), "Failed to load your subjects.");
  const roster = useTeacherReader(["subjects", "roster", String(target)], o => subjectClassListService.getClassList(target, o), "Failed to load this class list.");
  return <>{[["subjects", subjects], ["roster", roster]].map(([name, value]) => {
    const r = value as typeof subjects;
    return <section key={String(name)}><pre data-testid={`${name}-data`}>{JSON.stringify(r.data)}</pre><span data-testid={`${name}-loading`}>{String(r.loading)}</span><span data-testid={`${name}-error`}>{r.error}</span><button onClick={r.retry}>Retry {String(name)}</button></section>;
  })}</>;
}
const subscribe = (cb: () => void) => queryClient.getQueryCache().subscribe(notifyManager.batchCalls(cb));
const snapshot = () => JSON.stringify(queryClient.getQueryCache().getAll().filter(q => q.state.data !== undefined).map(q => q.queryKey));
const stateSnapshot=()=>JSON.stringify(queryClient.getQueryCache().getAll().map(q=>({key:q.queryKey,isInvalidated:q.state.isInvalidated})));
const scheduleSnapshot=()=>JSON.stringify(queryClient.getQueryCache().getAll().filter(q=>q.queryKey.includes('student-context')&&q.state.data!==undefined).map(q=>({key:q.queryKey,ids:(q.state.data as {id:number}[]).map(row=>row.id)})));
export function Harness() {
  const auth = useAuth();
  const [preview, setPreview] = useState(true), [mounted, setMounted] = useState(true), [target, setTarget] = useState(1), [observer, setObserver] = useState(false);
  const keys = useSyncExternalStore(subscribe, snapshot);
  const states=useSyncExternalStore(subscribe,stateSnapshot);
  const scheduleIds=useSyncExternalStore(subscribe,scheduleSnapshot);
  const switchUser = (role: string, id: string) => auth.setUser({ ...auth.user, id, role, name: "Synthetic Teacher", email: "synthetic@example.test" } as UserProfile);
  return <RoutePreviewContext.Provider value={preview}>
    <span data-testid="auth">{auth.isLoading ? "pending" : auth.user ? `${auth.user.role}:${auth.user.id}` : "signed-out"}</span>
    <pre data-testid="keys">{keys}</pre><pre data-testid="query-state">{states}</pre><pre data-testid="schedule-cache">{scheduleIds}</pre>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button><button onClick={() => setMounted(p => !p)}>Toggle readers</button><button onClick={() => setObserver(p => !p)}>Toggle observer</button>
    <button onClick={() => setTarget(t => t === 1 ? 2 : 1)}>Switch target</button>
    <button onClick={() => switchUser("TEACHER", "2")}>Switch account</button><button onClick={() => switchUser("PARENT", "3")}>Switch role</button>
    <button onClick={auth.logout}>Logout</button>
    {new URLSearchParams(location.search).has('schedule') ? <>{mounted&&<ScheduleObserver/>}</> : new URLSearchParams(location.search).has('academic') ? <>{mounted&&<AcademicObserver/>}</> : new URLSearchParams(location.search).has('grades') ? <>{mounted&&<GradeObserver/>}</> : new URLSearchParams(location.search).has('attendance') ? <>{mounted&&<AttendanceObserver/>}</> : new URLSearchParams(location.search).has('holistic') ? <>{mounted && <HolisticObserver/>}</> : new URLSearchParams(location.search).has('advisory')
      ? <BrowserRouter>{mounted && <TeacherAdvisoryQueries><AdvisoryObserver/></TeacherAdvisoryQueries>}{observer && <TeacherAdvisoryQueries><AdvisoryObserver/></TeacherAdvisoryQueries>}</BrowserRouter>
      : new URLSearchParams(location.search).has('students')
      ? <>{mounted && <TeacherStudentsProvider><StudentObserver/></TeacherStudentsProvider>}{observer && <TeacherStudentsProvider><StudentObserver/></TeacherStudentsProvider>}</>
      : <>{mounted && <Reader target={target}/>}{observer && <Reader target={target}/>}</>}
  </RoutePreviewContext.Provider>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><AuthProvider><QueryClientProvider client={queryClient}><Harness/></QueryClientProvider></AuthProvider></StrictMode>);


Object.assign(window,{__qedTeacherDiagnostics:()=>queryClient.getQueryCache().getAll().map(q=>({key:q.queryKey,status:q.state.status,fetchStatus:q.state.fetchStatus,isInvalidated:q.state.isInvalidated,updatedAt:q.state.dataUpdatedAt,observers:q.getObserversCount(),dataKeys:q.state.data&&typeof q.state.data==='object'?Object.keys(q.state.data):[],scoreValues:q.queryKey.includes('scores')&&q.state.data?Object.values(q.state.data as Record<string,Record<string,number|null>>).flatMap(values=>Object.values(values)):undefined}))});
