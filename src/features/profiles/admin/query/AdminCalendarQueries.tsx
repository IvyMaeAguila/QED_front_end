import {useCallback} from 'react';
import {QueryClientProvider,useQueries} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {CalendarPageComposition,type CalendarData} from '@shared/calendar/CalendarPage.loading-view';
import * as service from '@shared/calendar/services/calendar.service';
import {useAdminQueryScope} from './adminQueryScope';
import {useAdminWriter} from './useAdminWriter';
import {AdminSessionBoundary} from './AdminSessionBoundary';
type Write={kind:'activities'|'holidays';run:(options:service.CalendarRequestOptions)=>Promise<unknown>};
const readers=[{resource:'activities',read:service.fetchCalendarActivities},{resource:'holidays',read:service.fetchCalendarHolidays},{resource:'all-activities',read:service.fetchAllCalendarActivities},{resource:'all-holidays',read:service.fetchAllCalendarHolidays}] as const;
function CalendarQueries(){
 const scope=useAdminQueryScope(),{enabled,online,key}=scope;
 const queries=useQueries({queries:readers.map(({resource,read})=>({...scope.options,queryKey:[...key,'calendar',resource],queryFn:({signal}:{signal:AbortSignal})=>read(scope.request(signal))}))});
 const write=useAdminWriter(({run}:Write,o)=>run(o),useCallback(async(_result:unknown,{kind}:Write,key:readonly unknown[])=>{await queryClient.invalidateQueries({queryKey:[...key,'calendar'],predicate:q=>[kind,'all-'+kind].includes(String(q.queryKey.at(-1)))});void queryClient.invalidateQueries({queryKey:[...key,'dashboard','audit'],refetchType:'none'});},[]));
 const denied=queries.some(q=>q.error instanceof Error&&'status'in q.error&&[401,403].includes(Number(q.error.status))),offline=!online||queries.some(q=>q.isPaused),error=queries.find(q=>q.error)?.error;
 const data:CalendarData={
  activities:enabled&&!denied?queries[0].data??[]:[],holidays:enabled&&!denied?queries[1].data??[]:[],allActivities:enabled&&!denied?queries[2].data??[]:[],allHolidays:enabled&&!denied?queries[3].data??[]:[],
  loading:!enabled||(!offline&&queries.some(q=>q.data===undefined&&(q.isPending||q.isFetching))),cachedOffline:offline&&!denied&&queries.every(q=>q.data!==undefined),error:offline?"You're offline. Reconnect and try again.":error?.message??null,
  retry:()=>{if(enabled&&online&&!queries.some(q=>q.isFetching||q.isPaused))for(const q of queries)void q.refetch({cancelRefetch:false});},
  saveActivities:entries=>write({kind:'activities',run:o=>service.createCalendarActivities(entries.map(e=>({title:e.title.trim(),date:e.date})),undefined,o)}),
  saveHolidays:entries=>write({kind:'holidays',run:o=>service.createCalendarHolidays(entries.map(e=>({title:e.title.trim(),date:e.date,type:e.holidayType})),undefined,o)}),
  edit:(state,value)=>write({kind:state.kind==='activity'?'activities':'holidays',run:o=>state.kind==='activity'?service.updateCalendarActivity(state.entry.id,{title:value.title,date:value.date},o):service.updateCalendarHoliday(state.entry.id,{title:value.title,date:value.date,type:value.holidayType},o)}),
  remove:state=>write({kind:state.kind==='activity'?'activities':'holidays',run:o=>state.kind==='activity'?service.deleteCalendarActivityApi(state.entry.id,o):service.deleteCalendarHolidayApi(state.entry.id,o)}),
 };
 return <CalendarPageComposition viewerRole="ADMIN" data={data}/>;
}
export default function AdminCalendarQueries(){return <QueryClientProvider client={queryClient}><AdminSessionBoundary resource="calendar"><CalendarQueries/></AdminSessionBoundary></QueryClientProvider>;}
