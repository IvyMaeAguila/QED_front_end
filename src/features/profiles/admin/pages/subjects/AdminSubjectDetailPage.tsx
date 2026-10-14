import {useEffect} from 'react';
import {useAdminReader,useAdminRetryAttempt} from '../../query/useAdminReader';
import {getActiveGradeTemplate} from './services/subjectGradeTemplate.service';
import {AdminSubjectDetailPageComposition,type AdminSubjectDetailPageEffectScope} from './AdminSubjectDetailPage.loading-view';
export * from './AdminSubjectDetailPage.loading-view';
function AdminSubjectDetailPageDataEffects({scope:s}:{scope:AdminSubjectDetailPageEffectScope}){
 const {numericSubjectId,setLoadingTemplate,setTemplateError,setActiveTemplate,attempt}=s;
 const template=useAdminReader(['templates',numericSubjectId],o=>getActiveGradeTemplate(numericSubjectId!,o),'Failed to load active grade template.',!!numericSubjectId,undefined,300_000);useAdminRetryAttempt(attempt,template.retry);
 useEffect(()=>{if(!numericSubjectId)return;setLoadingTemplate(template.loading);setTemplateError(template.error);if(!template.loading)setActiveTemplate(template.data??null);},[numericSubjectId,template.loading,template.error,template.data,setLoadingTemplate,setTemplateError,setActiveTemplate]);return null;
}
export function AdminSubjectDetailPage(){return <AdminSubjectDetailPageComposition effects={scope=><AdminSubjectDetailPageDataEffects scope={scope}/>}/>;}
