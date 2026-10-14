import {useContext} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {TeacherAdvisoryQueries} from '../../query/TeacherAdvisoryQueries';
import {TeacherAttendanceQueries} from '../../query/TeacherAttendanceQueries';
import {TeacherSessionBoundary} from '../../query/TeacherSessionBoundary';
import {AttendanceQueryContext} from '../../query/AttendanceQueryContext';
import {TeacherAttendancePageComposition,type TeacherAttendancePageEffectScope} from './TeacherAttendancePage.loading-view';
export {TeacherAttendancePageComposition} from './TeacherAttendancePage.loading-view';
export type {TeacherAttendancePageEffectScope,TeacherAttendancePageRouteProps} from './TeacherAttendancePage.loading-view';
function Effects({scope}:{scope:TeacherAttendancePageEffectScope}){
 const bridge=useContext(AttendanceQueryContext)!;
 return <bridge.Effects classId={scope.section?.classId??''} ready={!!scope.section} attempt={scope.attendanceAttempt} setAttendance={scope.setAttendance} setLoading={scope.setAttendanceLoading} setError={scope.setAttendanceError} setLoadedFor={scope.setAttendanceLoadedFor} errorMessage="Couldn't load attendance for this class. Please try again."/>;
}
export function TeacherAttendancePage(){
 return <TeacherSessionBoundary><QueryClientProvider client={queryClient}><TeacherAdvisoryQueries><TeacherAttendanceQueries><TeacherAttendancePageComposition effects={scope=><Effects scope={scope}/>}/></TeacherAttendanceQueries></TeacherAdvisoryQueries></QueryClientProvider></TeacherSessionBoundary>;
}
