import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { queryClient } from '@shared/query/queryClient';
import { useParentReader, useParentRetryAttempt } from '../../../query/useParentReader';
import { useParentInterventionActions } from '../../../query/useParentInterventionActions';
import { useParentQueryScope } from '../../../query/parentQueryScope';
import { PetQuizPageComposition, type PetQuizPageEffectScope } from './PetQuizPage.loading-view';
import PetQuizService, { InterventionArchivedError } from './service/petQuiz.service';
import {QueryClientProvider} from '@tanstack/react-query';
export * from './PetQuizPage.loading-view';
function Initialization({scope}:{scope:PetQuizPageEffectScope}) {
  const {studentId,topicId,attempt,setLoadError,setView,setIntervention,setPetVisualState,hasSeenIntro}=scope;
  // Initializes progress/reopens archived topics: no automatic background replay.
  const reader=useParentReader(['student',studentId,'intervention',topicId,'state'],async options=>{
    try{return await PetQuizService.getInterventionState(studentId!,topicId!,options);}catch(error){if(error instanceof InterventionArchivedError)return {levels:{easy:'locked',medium:'locked',hard:'locked'} as const,bonus:{match:false,memory:false},hungerFilled:0,hungerTotal:5,interventionCompleted:true};throw error;}
  },'Could not load intervention state.',!!studentId&&!!topicId,undefined,30_000,undefined,{cancellable:false,reconnect:false});
  useParentRetryAttempt(attempt,reader.retry);
  useEffect(()=>{
    setLoadError(reader.error);
    if(reader.loading){setView('loading');return;}
    if(!reader.data)return;
    setIntervention(reader.data);
    if(reader.data.interventionCompleted){setView('archived');return;}
    setPetVisualState(reader.data.hungerFilled<reader.data.hungerTotal?'hungry':'idle');
    setView(hasSeenIntro(studentId,topicId)?'difficulty':'intro');
  },[reader.loading,reader.error,reader.data,setLoadError,setView,setIntervention,setPetVisualState,hasSeenIntro,studentId,topicId]);
  return null;
}
function QuizSession({studentId,topicId}:{studentId?:string;topicId?:string}) {
  const [denied,setDenied]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
  const scope=useParentQueryScope();
  const service=useParentInterventionActions(studentId,topicId,message=>{
    queryClient.removeQueries({queryKey:[...scope.key,'student',studentId,'intervention',topicId]});
    setDenied(message);
  });
  if(denied)return <LoadingRegion name="pet-quiz-content" loading={false} error={denied} retry={()=>{setDenied(null);setAttempt(n=>n+1);}} skeleton={null}>{null}</LoadingRegion>;
  return <PetQuizPageComposition key={attempt} service={service} effects={effectScope=><Initialization scope={effectScope}/>}/>;
}
export default function PetQuizPage() {
  const {studentId,topicId}=useParams();
  return <QueryClientProvider client={queryClient}><QuizSession key={`${studentId}:${topicId}`} studentId={studentId} topicId={topicId}/></QueryClientProvider>;
}
