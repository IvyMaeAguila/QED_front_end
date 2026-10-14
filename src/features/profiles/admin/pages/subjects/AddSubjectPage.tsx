import {useEffect} from 'react';
import {useAdminReader,useAdminRetryAttempt} from '../../query/useAdminReader';
import {fetchActiveAcademicYear} from './services/academicyear.service';
import {AddSubjectPageComposition,type AddSubjectPageEffectScope} from './AddSubjectPage.loading-view';
export * from './AddSubjectPage.loading-view';
function AddSubjectPageDataEffects({scope:s}:{scope:AddSubjectPageEffectScope}){
 const {setSchoolYearLoading,setSchoolYearError,setSchoolYear,yearAttempt,loadAssessmentTypes,setName,setIsGraded,setTemplateFile,setTemplateFileName,setTemplatePreview,setTemplateError,gradeLevel}=s;
 const year=useAdminReader(['academic-year','active'],fetchActiveAcademicYear,'Failed to load active school year.');useAdminRetryAttempt(yearAttempt,year.retry);
 useEffect(()=>{setSchoolYearLoading(year.loading);setSchoolYearError(year.error);if(year.data)setSchoolYear(year.data.label);},[year.loading,year.error,year.data,setSchoolYearLoading,setSchoolYearError,setSchoolYear]);
 useEffect(()=>{void loadAssessmentTypes();},[loadAssessmentTypes]);
 useEffect(()=>{setName('');setIsGraded(null);setTemplateFile(null);setTemplateFileName(null);setTemplatePreview(null);setTemplateError(null);},[gradeLevel,setName,setIsGraded,setTemplateFile,setTemplateFileName,setTemplatePreview,setTemplateError]);
 return null;
}
export function AddSubjectPage(){return <AddSubjectPageComposition effects={scope=><AddSubjectPageDataEffects scope={scope}/>}/>;}
