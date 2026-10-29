import type {QueryClient} from '@tanstack/react-query';
import type {AttendanceMap,AttendanceStatus} from '../pages/subjects/detail/types/Grading';
type Reply={data:AttendanceMap;termId?:string|null;presentTotals?:Record<string,number>};
/** Patch confirmed marks only into matching class/term caches; never create partial caches. */
export function confirmAttendance(client:QueryClient,scope:readonly unknown[],classId:string,studentIds:string[],date:string,status:AttendanceStatus,termId?:string){
 const prefix=[...scope,'attendance',classId];
 for(const query of client.getQueryCache().findAll({queryKey:prefix})){
  const old=query.state.data as Reply|undefined;
  if(!old?.data)continue;
  const all=query.queryKey[prefix.length+1]===true;
  const cachedTerm=old.termId??query.queryKey[prefix.length];
  if(!all&&(!termId||String(cachedTerm)!==termId)){
   void client.invalidateQueries({queryKey:query.queryKey,exact:true,refetchType:'none'});continue;
  }
  client.setQueryData<Reply>(query.queryKey,previous=>{
   if(!previous)return previous;
   const data={...previous.data},presentTotals=previous.presentTotals?{...previous.presentTotals}:undefined;
   for(const id of studentIds){const before=data[id]?.[date];data[id]={...data[id],[date]:status};
    if(presentTotals)presentTotals[id]=(presentTotals[id]??0)+(status==='P'?1:0)-(before==='P'?1:0);
   }
   return {...previous,data,...(presentTotals?{presentTotals}:{})};
  });
 }
}
