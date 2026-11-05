import type {TemplateDomain} from '../../../../shared/grading/gradeTemplate.types';
import type {GradeItem,AssessmentTabKey} from './types/Grading';
export function assessmentCapacity(items:GradeItem[],tab:AssessmentTabKey,term:string,domains:TemplateDomain[]){
 const selected=items.filter(item=>item.tab===tab&&String(item.gradingPeriodId)===String(term));
 return domains.map(domain=>{
  const used=domains.length===1?selected.length:selected.filter(item=>item.templateDomainId===domain.id).length;
  const max=domain.scoreColumns?new Set(domain.scoreColumns).size:null;
  return {id:domain.id,label:domain.label||'This category',used,max,full:max!==null&&used>=max};
 });
}


// Include saved exams in Full Records as well as pending score-sheet items.
export function availableExamTypes(items:GradeItem[],term:string,types:import('./types/Grading').ExamType[]){
 const used=new Set(items.filter(item=>item.tab==='exams'&&String(item.gradingPeriodId)===String(term)).map(item=>String(item.examType??'TE').trim().toUpperCase()));
 return types.filter(type=>!used.has(type));
}
