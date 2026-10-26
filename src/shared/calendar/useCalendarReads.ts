import {useQueries} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {safeReadOptions} from '@shared/query/safeReadPolicy';
import * as service from './services/calendar.service';
import type {CalendarActivity,CalendarHoliday,CalendarReadStates} from './types/Calendar';
const sources=[{name:'activities',read:service.fetchCalendarActivities},{name:'holidays',read:service.fetchCalendarHolidays},{name:'all-activities',read:service.fetchAllCalendarActivities},{name:'all-holidays',read:service.fetchAllCalendarHolidays}] as const;
type Scope={key:readonly unknown[];enabled:boolean;online:boolean;request:(signal:AbortSignal)=>service.CalendarRequestOptions};
/** Four pure reads with separate error/cache ownership; writes use their existing ports. */
export function useCalendarReads(scope:Scope,includeAll=true){
 const selected=includeAll?sources:sources.slice(0,2);
 const queries=useQueries({queries:selected.map(({name,read})=>({...safeReadOptions,enabled:scope.enabled,staleTime:30_000,gcTime:300_000,refetchOnWindowFocus:false,queryKey:[...scope.key,name],queryFn:({signal}:{signal:AbortSignal})=>read(scope.request(signal))}))},queryClient);
 const denied=queries.some(q=>q.error instanceof Error&&'status'in q.error&&[401,403].includes(Number(q.error.status)));
 const offline=!scope.online||queries.some(q=>q.isPaused),failure=queries.find(q=>q.error)?.error;
 const message=offline?"You're offline. Reconnect and try again.":failure?.message??null;
 const retry=()=>{if(!scope.enabled||offline||queries.some(q=>q.isFetching||q.isPaused))return;const failed=queries.filter(q=>q.error||q.data===undefined);for(const q of failed.length?failed:queries)void q.refetch({cancelRefetch:false});};
 const reads:CalendarReadStates={};
 selected.forEach(({name},i)=>{const q=queries[i];reads[name]={loading:!scope.enabled||!offline&&q.data===undefined&&(q.isPending||q.isFetching),error:!scope.enabled?null:denied?message:offline?q.data===undefined?message:null:q.error?.message??null,hasData:scope.enabled&&!denied&&q.data!==undefined,retry:()=>{if(denied){retry();return;}if(scope.enabled&&!offline&&!q.isFetching&&!q.isPaused)void q.refetch({cancelRefetch:false});}};});
 const visible=(i:number)=>scope.enabled&&!denied?queries[i]?.data:undefined;
 return {queries,reads,denied,offline,error:scope.enabled?message:null,retry,
  activities:(visible(0)??[]) as CalendarActivity[],holidays:(visible(1)??[]) as CalendarHoliday[],allActivities:(visible(2)??[]) as CalendarActivity[],allHolidays:(visible(3)??[]) as CalendarHoliday[],
  loading:!scope.enabled||!offline&&queries.some(q=>q.data===undefined&&(q.isPending||q.isFetching)),cachedOffline:offline&&!denied&&queries.every(q=>q.data!==undefined)};
}
