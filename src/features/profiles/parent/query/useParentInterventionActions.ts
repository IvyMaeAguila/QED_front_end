import { useMemo } from 'react';
import { queryClient } from '@shared/query/queryClient';
import PetQuizService from '../pages/Student/Academic/service/petQuiz.service';
import { useParentWriter } from './useParentWriter';
type Method=keyof typeof PetQuizService;
const arities:Record<Method,number>={getInterventionState:2,getQuiz:3,getBonusGames:2,submitAnswer:5,submitQuiz:6,completeBonus:3,markTopicMastered:2};
export function useParentInterventionActions(studentId:string|undefined,topicId:string|undefined,onDenied:(message:string)=>void) {
  const run=useParentWriter<{method:Method;args:unknown[]},unknown>(async({method,args},options)=>{
    const call=PetQuizService[method] as (...args:unknown[])=>Promise<unknown>;
    const padded=[...args];while(padded.length<arities[method])padded.push(undefined);
    try{return await call(...padded,options);}catch(error){
      if(error instanceof Error&&'status'in error&&[401,403].includes(Number(error.status)))onDenied(error.message);
      throw error;
    }
  },async(data,{method},key)=>{
    if(data&&typeof data==='object'&&'success'in data&&data.success===false)return;
    if(['submitQuiz','completeBonus','markTopicMastered'].includes(method) || (method==='getInterventionState' && data && typeof data==='object' && 'interventionCompleted' in data && data.interventionCompleted===true)) {
      await queryClient.invalidateQueries({predicate:q=>key.every((part,i)=>q.queryKey[i]===part)&&q.queryKey[5]==='student'&&q.queryKey[6]===studentId&&q.queryKey.includes('intervention'),refetchType:'none'});
    }
  },['student',studentId,'intervention',topicId,'actions']);
  return useMemo(()=>Object.fromEntries((Object.keys(arities) as Method[]).map(method=>[method,(...args:unknown[])=>run({method,args})])) as unknown as typeof PetQuizService,[run]);
}
