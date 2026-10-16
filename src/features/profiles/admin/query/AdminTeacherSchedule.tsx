import {lazy,Suspense,useEffect} from 'react';
import {TeacherSchedulePageComposition,type TeacherSchedulePageRouteProps} from '../../principal/pages/teachers/TeacherSchedulePage.loading-view';
import {useTeachers} from '../pages/classes/context/TeachersContext';
import {useRoutePreview} from '@shared/loading/RoutePreview';
const Queries=lazy(()=>import('./AdminTeacherProfileQueries'));
const pending:NonNullable<TeacherSchedulePageRouteProps['serverState']>={schedule:{teacher:null,schoolYear:'',loading:true,error:null,notFound:false,retry:()=>{}},classRosters:[],rostersLoading:true,rostersError:false,retryRosters:()=>{},offline:false};
// The shared view remains Query-free in eager route previews. Do not mount its
// legacy hook/cache while the Admin-only reader is loading.
export function AdminTeacherSchedule(props:TeacherSchedulePageRouteProps){const {activateQueries}=useTeachers(),preview=useRoutePreview();useEffect(()=>{if(!preview)activateQueries();},[preview,activateQueries]);const fallback=<TeacherSchedulePageComposition {...props} serverState={pending}/>;return preview?fallback:<Suspense fallback={fallback}><Queries {...props}/></Suspense>;}
