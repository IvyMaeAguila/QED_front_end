import {useQueries} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import {type TeacherSchedulePageRouteProps} from '../../principal/pages/teachers/TeacherSchedulePage.loading-view';
import type {TeacherClassRoster} from '../../principal/pages/teachers/components/TeacherClassRosters';
import {fetchPrincipalTeacherProfile} from '../../principal/pages/teachers/services/principalTeacherProfile.service';
import {getClassList} from '../../principal/pages/students/services/students.service';
import {fetchActiveAcademicYear} from '../pages/subjects/services/academicyear.service';
import {useAdminQueryScope} from './adminQueryScope';
import {useAdminReader} from './useAdminReader';
export function useAdminTeacherProfile(props:TeacherSchedulePageRouteProps):NonNullable<TeacherSchedulePageRouteProps['serverState']>{
 const scope=useAdminQueryScope(),id=props.teacherIdOverride,ready=!!id&&!props.prerequisite?.loading&&!props.prerequisite?.error;
 const year=useAdminReader(['academic-year','active'],async o=>{const data=await fetchActiveAcademicYear(o);if(!Number.isInteger(data.id)||data.id<=0)throw new Error('Failed to fetch academic year.');return data;},'Failed to fetch academic year.',ready);
 const profile=useAdminReader(['teachers','profile',year.data?.id??null,id??null],async o=>{try{const data=await fetchPrincipalTeacherProfile(id!,o.signal!);if(data===null)throw new QueryHttpError('Failed to fetch teacher profile (404)',404);return data;}catch(error){if(error instanceof QueryHttpError&&error.status===401)o.onUnauthorized?.();throw error;}},'Failed to load teacher schedule',ready&&!!year.data&&!year.loading&&!year.error,undefined,300_000);
 const teacher=ready&&!year.error&&!profile.error?profile.data:null;
 const classes=new Map<number,{section:string;room:string|null}>();for(const advisory of teacher?.advisories??[]){const classId=Number(advisory.classId);if(Number.isInteger(classId)&&classId>0&&!classes.has(classId))classes.set(classId,{section:`${advisory.gradeLevel??''} · ${advisory.section??''}`,room:advisory.room});}
 const targets=[...classes.entries()];
 const rosters=useQueries({queries:targets.map(([classId])=>({...scope.options,queryKey:[...scope.key,'students','roster',year.data?.id??null,'class',classId],enabled:scope.enabled&&ready&&!!teacher&&!!year.data&&!year.loading&&!year.error,queryFn:async({signal}:{signal:AbortSignal})=>{try{return await getClassList(classId,signal);}catch(error){if(error instanceof QueryHttpError&&error.status===401)scope.request(signal).onUnauthorized?.();throw error;}}}))});
 const denied=rosters.some(q=>q.error instanceof QueryHttpError&&[401,403].includes(q.error.status));
 const classRosters:TeacherClassRoster[]=!ready||denied?[]:rosters.flatMap((q,index)=>{if(!q.data)return [];const [classId,advisory]=targets[index],label=`${q.data.grade} · ${q.data.sectionInfo.section}`;return [{classId,sectionLabel:label.trim()||advisory.section||'Section not assigned',room:advisory.room||q.data.sectionInfo.room,students:q.data.roster}];});
 const offline=scope.enabled&&(!scope.online||rosters.some(q=>q.isPaused)),error=year.error??profile.error;
 const retryRosters=()=>{if(scope.enabled&&scope.online&&!rosters.some(q=>q.isFetching||q.isPaused))for(const q of rosters)void q.refetch({cancelRefetch:false});};
 const retry=async()=>{if(!scope.enabled||!scope.online||!ready)return;await year.retry();if(!scope.isCurrent())return;const activeYear=queryClient.getQueryData<{id:number}>([...scope.key,'academic-year','active']);if(activeYear?.id===year.data?.id){void profile.retry();retryRosters();}};
 return {schedule:{teacher:teacher??null,schoolYear:ready&&!year.error?year.data?.label??'':'',loading:!scope.enabled||!!props.prerequisite?.loading||(ready&&!offline&&!error&&((year.data===undefined&&year.loading)||(profile.data===undefined&&profile.loading))),error:error?new Error(error):null,notFound:scope.enabled&&!id&&!props.prerequisite?.loading,retry},classRosters,rostersLoading:ready&&!offline&&rosters.some(q=>q.data===undefined&&q.isPending),rostersError:rosters.some(q=>!!q.error||q.data===null),retryRosters,offline};
}
