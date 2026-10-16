import {useCallback,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {QueryClientProvider,useQueries,useQuery,type UseQueryResult} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {useAdminQueryScope,adminOfflineMessage} from './adminQueryScope';
import {useAdminReader} from './useAdminReader';
import {useAdminWriter} from './useAdminWriter';
import {useAdminFetch} from './useAdminFetch';
import type {AdminSubjectsBridge,AdminSubjectOperations} from './AdminSubjectOperations';
import {fetchGradeLevels} from '../pages/classes/services/classes.service';
import * as sectionsApi from '../pages/subjects/services/section.service';
import * as subjectsApi from '../pages/subjects/services/subject.service';
import * as templatesApi from '../pages/subjects/services/subjectGradeTemplate.service';
import {fetchAllSchoolYears} from '../pages/subjects/services/academicyear.service';
import {mapSectionRow,mapSubjectRow} from '../pages/subjects/types/serverRowMappers';
import {GRADE_LEVEL_IDS,type GradeLevel,type Section,type Subject} from '../pages/subjects/types/types';
import {canonicalAssessmentTypeName,DEFAULT_ASSESSMENT_TYPES} from '../pages/subjects/types/assessmentTypes';

const sectionRead=async(grade:GradeLevel,o:ApiRequestOptions)=>(await sectionsApi.fetchSectionsByGrade(String(GRADE_LEVEL_IDS[grade]),o)).map(mapSectionRow);
const subjectRead=async(grade:GradeLevel,o:ApiRequestOptions)=>(await subjectsApi.fetchSubjectSectionsByGrade(String(GRADE_LEVEL_IDS[grade]),o)).map(mapSubjectRow);
const catalogRead=(grade:GradeLevel,o:ApiRequestOptions)=>subjectsApi.fetchSubjectsByGrade(String(GRADE_LEVEL_IDS[grade]),o);
const sectionResource=['sections','grade'] as const,subjectResource=['subjects','assignments','grade'] as const,catalogResource=['subjects','catalog','grade'] as const,assessmentResource=['subjects','assessments'] as const;
const emptyGrades:GradeLevel[]=[],emptyAssessments:subjectsApi.NewAssessmentType[]=[];
const forbidden=(error:unknown)=>error instanceof Error&&'status'in error&&[401,403].includes(Number(error.status));
function combine<T>(queries:UseQueryResult<T[]>[]){return {rows:queries.flatMap(q=>forbidden(q.error)?[]:q.data??[]),groups:queries.map(q=>forbidden(q.error)?[]:q.data??[]),pending:queries.some(q=>q.isFetching||q.isPending),paused:queries.some(q=>q.isPaused),error:queries.find(q=>q.error)?.error??null,uncached:queries.some(q=>q.data===undefined)};}
function useGradesReader<T>(resource:readonly unknown[],read:(grade:GradeLevel,o:ApiRequestOptions)=>Promise<T[]>){
 const scope=useAdminQueryScope(),fetch=useAdminFetch(),[requested,setRequested]=useState<GradeLevel[]>([]);
 const result=useQueries({queries:requested.map(grade=>({...scope.options,retryOnMount:false,queryKey:[...scope.key,...resource,GRADE_LEVEL_IDS[grade]],queryFn:({signal}:{signal:AbortSignal})=>read(grade,scope.request(signal))})),combine:combine<T>},queryClient);
 const load=useCallback(async(grade:GradeLevel)=>{setRequested(old=>old.includes(grade)?old:[...old,grade]);try{await fetch([...resource,GRADE_LEVEL_IDS[grade]],o=>read(grade,o));}catch{/* Query owns the independent error; preserve the context's resolved promise contract. */}},[fetch,resource,read]);
 const offline=!scope.online||result.paused;
 return useMemo(()=>({rows:scope.enabled?result.rows:[],groups:result.groups,grades:requested,loading:!scope.enabled||(!offline&&result.pending),error:!scope.enabled?null:result.error?.message??(offline&&result.uncached?adminOfflineMessage:null),load,requested:requested.length}),[result.rows,result.groups,requested,scope.enabled,offline,result.pending,result.error,result.uncached,load]);
}
function sortAssessments(types:subjectsApi.NewAssessmentType[]){const order=new Map<string,number>(DEFAULT_ASSESSMENT_TYPES.map((t,i)=>[t.name,i]));return types.slice().sort((a,b)=>{const x=order.get(canonicalAssessmentTypeName(a.assessmentName)),y=order.get(canonicalAssessmentTypeName(b.assessmentName));return x!==undefined||y!==undefined?(x??Number.MAX_SAFE_INTEGER)-(y??Number.MAX_SAFE_INTEGER):a.assessmentName.localeCompare(b.assessmentName);});}
function Driver({publish}:{publish:(value:AdminSubjectsBridge|undefined)=>void}){
 const scope=useAdminQueryScope(),fetch=useAdminFetch(),{key,isCurrent}=scope;
 const [templateIds,setTemplateIds]=useState<number[]>([]),[yearsRequested,setYearsRequested]=useState(false);
 useQueries({queries:templateIds.map(id=>({...scope.options,staleTime:300_000,queryKey:[...key,'templates',id],queryFn:({signal}:{signal:AbortSignal})=>templatesApi.getActiveGradeTemplate(id,scope.request(signal))}))},queryClient);
 useAdminReader(['academic-year','all'],fetchAllSchoolYears,'Failed to fetch school years.',yearsRequested);
 const grades=useAdminReader(['class-options','grades'],fetchGradeLevels,'Failed to load grade levels.',true,undefined,300_000);
 const sections=useGradesReader(sectionResource,sectionRead),assignments=useGradesReader(subjectResource,subjectRead),catalog=useGradesReader(catalogResource,catalogRead);
 const [usageRequested,setUsageRequested]=useState(false),usage=useAdminReader(['sections','used-by-classes'],sectionsApi.fetchSectionIdsUsedByClasses,'Failed to load used sections.',usageRequested);
 const usageLoad=useCallback(async()=>{setUsageRequested(true);try{await fetch(['sections','used-by-classes'],sectionsApi.fetchSectionIdsUsedByClasses);}catch{/* Retain independent context behavior. */}},[fetch]);
 const invalidate=useCallback((resources:readonly (readonly unknown[])[])=>{if(!isCurrent())return;for(const resource of [...resources,['dashboard','audit']])void queryClient.invalidateQueries({queryKey:[...key,...resource],refetchType:'none'});},[key,isCurrent]);
 const sectionChanged=useCallback(()=>{invalidate([['sections'],['class-options','sections'],['student-options','sections']]);if(isCurrent())for(const resource of [['subjects','assignments'],['classes'],['students']])void queryClient.invalidateQueries({queryKey:[...key,...resource]});},[invalidate,isCurrent,key]);
 const createSection=useAdminWriter(({grade,name}:{grade:GradeLevel;name:string},o)=>sectionsApi.createSection(String(GRADE_LEVEL_IDS[grade]),name,o),sectionChanged);
 const updateSection=useAdminWriter(({id,name}:{id:string;name:string},o)=>sectionsApi.updateSection(id,name,o),sectionChanged);
 const deleteSection=useAdminWriter((id:string,o)=>sectionsApi.deleteSection(id,o),sectionChanged);
 const patchSections=useCallback((grade:GradeLevel,change:(old:Section[])=>Section[])=>{if(isCurrent())queryClient.setQueryData<Section[]>([...key,...sectionResource,GRADE_LEVEL_IDS[grade]],old=>change(old??[]));},[key,isCurrent]);
 const sectionValue=useMemo<AdminSubjectsBridge['sections']>(()=>({sections:sections.rows,loading:sections.loading,sectionIdsUsedByClasses:new Set((usage.data??[]).map(String)),getSectionsForGrade:grade=>sections.rows.filter(s=>s.gradeLevel===grade),loadSectionsForGrade:sections.load,loadSectionIdsUsedByClasses:usageLoad,
  addSection:async(grade,name)=>{const trimmed=name.trim();if(!trimmed)return {ok:false,error:'Section name is required.'};if(sections.rows.some(s=>s.gradeLevel===grade&&s.name.toLowerCase()===trimmed.toLowerCase()))return {ok:false,error:`"${trimmed}" already exists for ${grade}.`};try{const row=await createSection({grade,name:trimmed});patchSections(grade,old=>[...old,mapSectionRow(row)]);return {ok:true};}catch(e){return {ok:false,error:e instanceof Error?e.message:'Failed to add section.'};}},
  editSection:async(id,name)=>{const trimmed=name.trim(),current=sections.rows.find(s=>s.id===id);if(!trimmed)return {ok:false,error:'Section name is required.'};if(!current)return {ok:false,error:'Section not found.'};if(sections.rows.some(s=>s.id!==id&&s.gradeLevel===current.gradeLevel&&s.name.toLowerCase()===trimmed.toLowerCase()))return {ok:false,error:`"${trimmed}" already exists for ${current.gradeLevel}.`};try{const row=await updateSection({id,name:trimmed});patchSections(current.gradeLevel,old=>old.map(s=>s.id===id?mapSectionRow(row):s));return {ok:true};}catch(e){return {ok:false,error:e instanceof Error?e.message:'Failed to update section.'};}},
  removeSection:async id=>{try{await deleteSection(id);const current=sections.rows.find(s=>s.id===id);if(current)patchSections(current.gradeLevel,old=>old.filter(s=>s.id!==id));return {ok:true};}catch(e){return {ok:false,error:e instanceof Error?e.message:'Failed to remove section.'};}},
 }),[sections,usage.data,usageLoad,createSection,updateSection,deleteSection,patchSections]);
 const assessment=useQuery({...scope.options,enabled:false,queryKey:[...key,...assessmentResource],queryFn:({signal})=>subjectsApi.getAssessmentTypes(scope.request(signal)).then(r=>sortAssessments(r.data??[])),staleTime:300_000},queryClient);
 const [initializing,setInitializing]=useState(false),[assessmentError,setAssessmentError]=useState<string|null>(null),pending=useRef<Promise<void>|null>(null);
 const initialize=useAdminWriter(async(_:void,o)=>{
  // This existing mixed read/write initializer is one explicit non-retried
  // mutation. Never automatically replay default creation from a queryFn.
  const state=queryClient.getQueryState<subjectsApi.NewAssessmentType[]>([...key,...assessmentResource]);
  let types=state?.status==='success'&&!state.isInvalidated&&Date.now()-state.dataUpdatedAt<300_000?state.data??[]:(await subjectsApi.getAssessmentTypes(o)).data??[];
  const check=()=>{if(!isCurrent())throw new Error('Your session changed. Please sign in again.');};check();let changed=false;
  for(const standard of DEFAULT_ASSESSMENT_TYPES){check();const existing=types.find(t=>t.assessmentName===standard.name)??types.find(t=>canonicalAssessmentTypeName(t.assessmentName)===standard.name);if(!existing){const created=await subjectsApi.createAssessmentType({assessmentName:standard.name},o);check();types=[...types,created];changed=true;}else if(existing.assessmentName!==standard.name){const renamed=await subjectsApi.updateAssessmentType(existing.id,{assessmentName:standard.name},o);check();types=types.map(t=>t.id===existing.id?renamed:t);changed=true;}}
  if(changed){types=(await subjectsApi.getAssessmentTypes(o)).data??types;check();}return sortAssessments(types);
 },useCallback((types:subjectsApi.NewAssessmentType[])=>{queryClient.setQueryData([...key,...assessmentResource],types);},[key]));
 const loadAssessments=useCallback(()=>{if(pending.current)return pending.current;setInitializing(true);setAssessmentError(null);const task=initialize(undefined).then(()=>{},e=>{if(isCurrent())setAssessmentError(e instanceof Error?e.message:'Failed to load assessment types.');}).finally(()=>{pending.current=null;if(isCurrent())setInitializing(false);});pending.current=task;return task;},[initialize,isCurrent]);
 const assessmentChanged=useCallback(()=>invalidate([assessmentResource,['subjects','assignments']]),[invalidate]);
 const createAssessment=useAdminWriter((name:string,o)=>subjectsApi.createAssessmentType({assessmentName:name},o),assessmentChanged),updateAssessment=useAdminWriter(({id,name}:{id:number;name:string},o)=>subjectsApi.updateAssessmentType(id,{assessmentName:name},o),assessmentChanged),deleteAssessment=useAdminWriter((id:number,o)=>subjectsApi.deleteAssessmentType(id,o),assessmentChanged);
 const patchAssessments=useCallback((change:(old:subjectsApi.NewAssessmentType[])=>subjectsApi.NewAssessmentType[])=>{if(isCurrent())queryClient.setQueryData<subjectsApi.NewAssessmentType[]>([...key,...assessmentResource],old=>change(old??[]));},[key,isCurrent]);
 const catalogValue=useMemo<AdminSubjectsBridge['catalog']>(()=>({loading:catalog.loading||initializing,assessmentError,assessmentTypes:scope.enabled&&!forbidden(assessment.error)?assessment.data??emptyAssessments:emptyAssessments,getSubjectNamesForGrade:grade=>(catalog.groups[catalog.grades.indexOf(grade)]??[]).map(r=>r.subject_name),loadSubjectsForGrade:catalog.load,loadAssessmentTypes:loadAssessments,
  addAssessmentType:async name=>{const row=await createAssessment(name);patchAssessments(old=>[row,...old]);return row;},editAssessmentType:async(id,name)=>{const row=await updateAssessment({id,name});patchAssessments(old=>old.map(t=>t.id===id?row:t));return row;},removeAssessmentType:async id=>{await deleteAssessment(id);patchAssessments(old=>old.filter(t=>t.id!==id));},
 }),[catalog,initializing,assessmentError,scope.enabled,assessment.error,assessment.data,loadAssessments,createAssessment,updateAssessment,deleteAssessment,patchAssessments]);
 const patchSubjects=useCallback((change:(old:Subject[])=>Subject[])=>{if(!isCurrent())return;for(const grade of Object.keys(GRADE_LEVEL_IDS) as GradeLevel[])queryClient.setQueryData<Subject[]>([...key,...subjectResource,GRADE_LEVEL_IDS[grade]],old=>{if(!old)return;const next=change(old);return next===old?undefined:next.filter(s=>s.gradeLevel===grade);});},[key,isCurrent]);
 const assignmentValue=useMemo<AdminSubjectsBridge['assignments']>(()=>({subjects:assignments.rows,loading:assignments.loading||assignments.requested===0,error:assignments.error,getSubjectsForGrade:grade=>assignments.rows.filter(s=>s.gradeLevel===grade),loadSubjectsForGrade:assignments.load,addLocalSubject:subject=>{if(isCurrent())queryClient.setQueryData<Subject[]>([...key,...subjectResource,GRADE_LEVEL_IDS[subject.gradeLevel]],old=>[...(old??[]),subject]);},updateLocalSubject:(id,updates)=>patchSubjects(old=>old.some(s=>s.id===id)?old.map(s=>s.id===id?{...s,...updates}:s):old)}),[assignments,isCurrent,key,patchSubjects]);
 const subjectChanged=useCallback(()=>invalidate([['subjects'],['class-options','subjects'],['classes'],['teachers'],['templates']]),[invalidate]);
 const addSubject=useAdminWriter(subjectsApi.addSubject,subjectChanged),updateSubject=useAdminWriter(({id,payload}:{id:string;payload:Parameters<typeof subjectsApi.updateSubjectAssignment>[1]},o)=>subjectsApi.updateSubjectAssignment(id,payload,o),subjectChanged),assignTeacher=useAdminWriter(({id,payload}:{id:string;payload:Parameters<typeof subjectsApi.assignTeacherToSubject>[1]},o)=>subjectsApi.assignTeacherToSubject(id,payload,o),subjectChanged),toggleStatus=useAdminWriter(subjectsApi.toggleSubjectStatus,subjectChanged);
 const upload=useAdminWriter(({id,file}:{id:number;file:File},o)=>templatesApi.uploadGradeTemplate(id,file,o),useCallback((template:templatesApi.ActiveGradeTemplate,variables:{id:number})=>{queryClient.setQueryData([...key,'templates',variables.id],template);invalidate([['subjects','assignments'],['class-options','subjects']]);},[key,invalidate]));
 const operations=useMemo<AdminSubjectOperations>(()=>({addSubject,updateSubjectAssignment:(id,payload)=>updateSubject({id,payload}),assignTeacher:(id,payload)=>assignTeacher({id,payload}),toggleStatus,uploadTemplate:(id,file)=>upload({id,file}),fetchTemplate:id=>{setTemplateIds(old=>old.includes(id)?old:[...old,id]);return fetch(['templates',id],o=>templatesApi.getActiveGradeTemplate(id,o),300_000);},fetchYears:()=>{setYearsRequested(true);return fetch(['academic-year','all'],fetchAllSchoolYears,30_000);}}),[addSubject,updateSubject,assignTeacher,toggleStatus,upload,fetch]);
 const gradeValue=useMemo<AdminSubjectsBridge['grades']>(()=>({gradeLevels:grades.data?grades.data.slice().sort((a,b)=>a.id-b.id).map(r=>r.grade_level as GradeLevel):emptyGrades,loading:grades.loading,error:grades.error,refetch:async()=>{await grades.retry();}}),[grades]);
 const bridge=useMemo<AdminSubjectsBridge>(()=>({grades:gradeValue,sections:sectionValue,catalog:catalogValue,assignments:assignmentValue,operations}),[gradeValue,sectionValue,catalogValue,assignmentValue,operations]);
 useLayoutEffect(()=>publish(bridge),[publish,bridge]);useLayoutEffect(()=>()=>publish(undefined),[publish]);return null;
}
export default function AdminSubjectsQueries(props:{publish:(value:AdminSubjectsBridge|undefined)=>void}){return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;}
