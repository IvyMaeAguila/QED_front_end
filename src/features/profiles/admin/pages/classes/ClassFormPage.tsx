import {useEffect} from 'react';
import {useAdminReader,useAdminRetryAttempt} from '../../query/useAdminReader';
import {useClasses} from './context/ClassesContext';
import * as service from './services/classes.service';
import {ClassFormPageComposition,type ClassFormPageEffectScope} from './ClassFormPage.loading-view';
export * from './ClassFormPage.loading-view';
const noGrades:service.GradeLevelOption[]=[],noTeachers:service.TeacherOption[]=[],noSections:service.SectionOption[]=[],noSubjects:service.SubjectOption[]=[];
function ClassFormPageDataEffects({scope:s}:{scope:ClassFormPageEffectScope}){
 const {activateQueries}=useClasses();useEffect(()=>{activateQueries();},[activateQueries]);
 const {existing,classesLoading,seededRecord:seededRecordRef,classId,setSubjectsResolved,setForm,setLoadingGradeLevels,setGradeLevels,setChoiceError,choiceAttempt,setLoadingAllTeachers,setAllTeachers,form,setSections,setLoadingSections,setSubjects,setLoadingSubjects,isEditing,subjectsResolved,subjects}=s;
 const grade=form.gradeLevelId;
 const grades=useAdminReader(['class-options','grades'],service.fetchGradeLevels,'Failed to load grade levels.',true,undefined,300_000);
 const teachers=useAdminReader(['class-options','teachers','all'],service.fetchAllTeachers,'Failed to load teachers.');
 const sections=useAdminReader(['class-options','sections',String(grade),existing?.id??null],o=>service.fetchSectionsByGrade(Number(grade),existing?.id,o),'Failed to load sections.',grade!=='');
 const available=useAdminReader(['class-options','subjects',String(grade)],o=>service.fetchSubjectsByGrade(Number(grade),o),'Failed to load subjects.',grade!=='');
 useAdminRetryAttempt(choiceAttempt,grades.retry);useAdminRetryAttempt(choiceAttempt,teachers.retry);useAdminRetryAttempt(choiceAttempt,sections.retry);useAdminRetryAttempt(choiceAttempt,available.retry);
 useEffect(()=>{if(!existing||classesLoading||seededRecordRef.current===classId)return;seededRecordRef.current=classId;setSubjectsResolved(false);setForm({gradeLevelId:existing.gradeLevelId,section:existing.section??'',room:existing.room??'',subjectName:'',adviserId:existing.adviserId,schedule:existing.schedule});},[existing,classesLoading,seededRecordRef,classId,setSubjectsResolved,setForm]);
 useEffect(()=>{setLoadingGradeLevels(grades.loading);if(!grades.loading)setGradeLevels(grades.data??noGrades);},[grades.loading,grades.data,setLoadingGradeLevels,setGradeLevels]);
 useEffect(()=>{setLoadingAllTeachers(teachers.loading);if(!teachers.loading)setAllTeachers(teachers.data??noTeachers);},[teachers.loading,teachers.data,setLoadingAllTeachers,setAllTeachers]);
 useEffect(()=>{setLoadingSections(grade!==''&&sections.loading);if(!sections.loading||grade==='')setSections(grade===''?noSections:sections.data??noSections);},[grade,sections.loading,sections.data,setLoadingSections,setSections]);
 useEffect(()=>{setLoadingSubjects(grade!==''&&available.loading);if(!available.loading||grade==='')setSubjects(grade===''?noSubjects:available.data??noSubjects);},[grade,available.loading,available.data,setLoadingSubjects,setSubjects]);
 useEffect(()=>{setChoiceError(grades.error??teachers.error??(grade!==''?sections.error??available.error:null));},[grades.error,teachers.error,sections.error,available.error,grade,setChoiceError]);
 useEffect(()=>{if(!isEditing||subjectsResolved||subjects.length===0)return;setForm(f=>({...f,schedule:f.schedule.map(p=>{const match=subjects.find(s=>s.subject_name===p.subject);return match?{...p,subject:String(match.id)}:p;})}));setSubjectsResolved(true);},[subjects,isEditing,subjectsResolved,setForm,setSubjectsResolved]);
 return null;
}
export function ClassFormPage(){return <ClassFormPageComposition effects={scope=><ClassFormPageDataEffects scope={scope}/>}/>;}
