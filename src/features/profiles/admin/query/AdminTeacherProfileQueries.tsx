import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {TeacherSchedulePageComposition,type TeacherSchedulePageRouteProps} from '../../principal/pages/teachers/TeacherSchedulePage.loading-view';
import {AdminSessionBoundary} from './AdminSessionBoundary';
import {useAdminTeacherProfile} from './useAdminTeacherProfile';
function Profile(props:TeacherSchedulePageRouteProps){const state=useAdminTeacherProfile(props);return <TeacherSchedulePageComposition {...props} serverState={state}/>;}
export default function AdminTeacherProfileQueries(props:TeacherSchedulePageRouteProps){return <QueryClientProvider client={queryClient}><AdminSessionBoundary resource={`teacher-profile:${props.teacherIdOverride??''}`}><Profile {...props}/></AdminSessionBoundary></QueryClientProvider>;}
