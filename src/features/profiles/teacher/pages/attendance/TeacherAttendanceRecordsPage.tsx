import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {TeacherAdvisoryQueries} from '../../query/TeacherAdvisoryQueries';
import {TeacherAttendanceQueries} from '../../query/TeacherAttendanceQueries';
import {TeacherSessionBoundary} from '../../query/TeacherSessionBoundary';
import {TeacherAttendanceRecordsPageComposition} from './TeacherAttendanceRecordsPage.loading-view';
export {TeacherAttendanceRecordsPageComposition} from './TeacherAttendanceRecordsPage.loading-view';
export type {TeacherAttendanceRecordsPageEffectScope,TeacherAttendanceRecordsPageRouteProps} from './TeacherAttendanceRecordsPage.loading-view';
export function TeacherAttendanceRecordsPage(){return <TeacherSessionBoundary><QueryClientProvider client={queryClient}><TeacherAdvisoryQueries><TeacherAttendanceQueries><TeacherAttendanceRecordsPageComposition/></TeacherAttendanceQueries></TeacherAdvisoryQueries></QueryClientProvider></TeacherSessionBoundary>;}
