import type {ScoreMap} from '../pages/subjects/detail/types/Grading';
/** Preserve locally edited cells when other students' confirmed saves arrive. */
export function mergeScoreDraft(draft:ScoreMap,previous:ScoreMap,confirmed:ScoreMap):ScoreMap{
 const result:ScoreMap={...confirmed};
 for(const [student,items] of Object.entries(draft))for(const [item,value] of Object.entries(items)){
  if((value??null)!==(previous[student]?.[item]??null))result[student]={...result[student],[item]:value};
 }
 return result;
}
export function removeItemScores(scores:ScoreMap,item:string):ScoreMap{
 return Object.fromEntries(Object.entries(scores).map(([student,values])=>{const next={...values};delete next[item];return [student,next];}));
}
