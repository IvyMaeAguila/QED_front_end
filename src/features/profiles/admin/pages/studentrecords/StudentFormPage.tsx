import {useEffect} from 'react';
import {useAdminReader,useAdminRetryAttempt} from '../../query/useAdminReader';
import {useStudents} from './context/StudentsContext';
import {fetchGradeLevels,fetchSectionByGrade} from './services/grade-section.service';
import {StudentFormPageComposition,type StudentFormPageEffectScope} from './StudentFormPage.loading-view';
export * from './StudentFormPage.loading-view';
const emptyGrades:Awaited<ReturnType<typeof fetchGradeLevels>>=[];
const emptySections:Awaited<ReturnType<typeof fetchSectionByGrade>>=[];
function StudentFormPageDataEffects({scope:s}:{scope:StudentFormPageEffectScope}){
 const {activateQueries}=useStudents();useEffect(()=>{activateQueries();},[activateQueries]);
 const {existing,loading,seededRecord:seededRecordRef,setPlacementSnapshot,studentId,setForm,setLoadingGrades,setGradeError,setGradeLevels,choicesAttempt,form,setSections,setSectionError,setLoadingSections}=s;
 const grade=form.gradeLevel;
 const grades=useAdminReader(['student-options','grades'],fetchGradeLevels,'Failed to load grade levels',true,undefined,300_000);
 const sections=useAdminReader(['student-options','sections',grade],o=>fetchSectionByGrade(grade,o),'Could not load sections.',!!grade);
 useAdminRetryAttempt(choicesAttempt,grades.retry);useAdminRetryAttempt(choicesAttempt,sections.retry);
 useEffect(()=>{
  if(!existing||loading||seededRecordRef.current===studentId)return;
  seededRecordRef.current=studentId;
  setPlacementSnapshot({schoolYearId:existing.schoolYearId,gradeLevelId:existing.gradeLevelId,sectionId:existing.sectionId});
  setForm({studentId:existing.studentId,lastName:existing.lastName,firstName:existing.firstName,middleName:existing.middleName??'',lrn:existing.lrn,gender:existing.gender,gradeLevel:String(existing.gradeLevelId),section:existing.sectionId!=null?String(existing.sectionId):''});
 },[existing,loading,seededRecordRef,setPlacementSnapshot,studentId,setForm]);
 useEffect(()=>{setLoadingGrades(grades.loading);setGradeError(grades.error);if(!grades.loading)setGradeLevels(grades.data??emptyGrades);},[grades.loading,grades.error,grades.data,setLoadingGrades,setGradeError,setGradeLevels]);
 useEffect(()=>{
  if(!grade){setSections(emptySections);setSectionError(null);setLoadingSections(false);return;}
  setLoadingSections(sections.loading);setSectionError(sections.error);
  if(sections.loading)return;
  const rows=sections.data??emptySections;setSections(rows);
  if(!sections.error)setForm(previous=>previous.gradeLevel!==grade||rows.some(row=>String(row.id)===previous.section)?previous:{...previous,section:''});
 },[grade,sections.loading,sections.error,sections.data,setSections,setSectionError,setLoadingSections,setForm]);
 return null;
}
export function StudentFormPage(){return <StudentFormPageComposition effects={scope=><StudentFormPageDataEffects scope={scope}/>}/>;}
