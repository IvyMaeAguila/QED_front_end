import {useReadFreshness} from '@shared/query/readFreshness';
import {queryClient} from '@shared/query/queryClient';
import {useParentQueryScope} from './parentQueryScope';
import {fetchParentSchoolYear} from '../pages/Student/Overview/service/schoolYear.service';
export const freshChildResource=(resource:readonly unknown[])=>resource[0]==='progress'||resource[0]==='attendance'||resource[0]==='holistic'&&resource[1]==='weekly'||resource[0]==='overview'&&resource[1]==='academic';
/** Only classified display GETs. Existing generation, draft and notification owners stay separate. */
export function useParentFreshness(studentId:string|number|undefined,enabled:boolean){
 const scope=useParentQueryScope();
 useReadFreshness(JSON.stringify([...scope.key,'student',String(studentId??''),'freshness']),scope.enabled&&enabled&&!!studentId,async signal=>{
  if(!scope.online||queryClient.isMutating())return;
  const yearKey=[...scope.key,'school-year','active'];
  const yearQuery=queryClient.getQueryCache().find({queryKey:yearKey,exact:true});
  if(!yearQuery||yearQuery.state.data===undefined||yearQuery.state.fetchStatus!=='idle')return;
  const state=yearQuery.state;
  if(state.error instanceof Error&&'status' in state.error&&[401,403].includes(Number(state.error.status)))return;
  const current=()=>!signal.aborted&&scope.isCurrent()&&queryClient.getQueryCache().find({queryKey:yearKey,exact:true})===yearQuery&&yearQuery.state===state;
  try{
   // Probe context without putting the shared identity/year readers back into
   // loading and unmounting the view that owns this refresh. Do not overwrite
   // a newer manual/navigation check that finishes while this probe is pending.
   const year=await fetchParentSchoolYear(scope.request(signal));
   if(!current())return;
   queryClient.setQueryData(yearKey,year);
   if(year.id!==(state.data as {id:unknown}).id)return; // New keys fetch in their existing owners.
   const prefix=[...scope.key,'student',String(studentId),'year',year.id];
   await queryClient.refetchQueries({type:'active',predicate:q=>JSON.stringify(q.queryKey.slice(0,prefix.length))===JSON.stringify(prefix)&&freshChildResource(q.queryKey.slice(prefix.length))&&!(q.state.error instanceof Error&&'status'in q.state.error&&[401,403].includes(Number(q.state.error.status)))},{cancelRefetch:false});
  }catch(error){
   if(!current())return;
   // Use the existing error/Retry and denial presentation, preserving credentials.
   yearQuery.setState({error:error instanceof Error?error:new Error('Unable to verify the current school year.'),status:'error',errorUpdatedAt:Date.now()});
  }
 });
}
