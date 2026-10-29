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
