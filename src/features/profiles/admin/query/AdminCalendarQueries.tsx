import {useCalendarReads} from '@shared/calendar/useCalendarReads';
import {useCallback} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {CalendarPageComposition,type CalendarData} from '@shared/calendar/CalendarPage.loading-view';
import * as service from '@shared/calendar/services/calendar.service';
import {useAdminQueryScope} from './adminQueryScope';
import {useAdminWriter} from './useAdminWriter';
import {AdminSessionBoundary} from './AdminSessionBoundary';
type Write={kind:'activities'|'holidays';run:(options:service.CalendarRequestOptions)=>Promise<unknown>};
function CalendarQueries(){
 const scope=useAdminQueryScope(),{key}=scope;
 const calendar=useCalendarReads({...scope,key:[...key,'calendar']});
 const write=useAdminWriter(({run}:Write,o)=>run(o),useCallback(async(_result:unknown,{kind}:Write,key:readonly unknown[])=>{await queryClient.invalidateQueries({queryKey:[...key,'calendar'],predicate:q=>[kind,'all-'+kind].includes(String(q.queryKey.at(-1)))});void queryClient.invalidateQueries({queryKey:[...key,'dashboard','audit'],refetchType:'none'});},[]));
 const data:CalendarData={...calendar,
  saveActivities:entries=>write({kind:'activities',run:o=>service.createCalendarActivities(entries.map(e=>({title:e.title.trim(),date:e.date})),undefined,o)}),
  saveHolidays:entries=>write({kind:'holidays',run:o=>service.createCalendarHolidays(entries.map(e=>({title:e.title.trim(),date:e.date,type:e.holidayType})),undefined,o)}),
  edit:(state,value)=>write({kind:state.kind==='activity'?'activities':'holidays',run:o=>state.kind==='activity'?service.updateCalendarActivity(state.entry.id,{title:value.title,date:value.date},o):service.updateCalendarHoliday(state.entry.id,{title:value.title,date:value.date,type:value.holidayType},o)}),
  remove:state=>write({kind:state.kind==='activity'?'activities':'holidays',run:o=>state.kind==='activity'?service.deleteCalendarActivityApi(state.entry.id,o):service.deleteCalendarHolidayApi(state.entry.id,o)}),
 };
 return <CalendarPageComposition viewerRole="ADMIN" data={data}/>;
}
export default function AdminCalendarQueries(){return <QueryClientProvider client={queryClient}><AdminSessionBoundary resource="calendar"><CalendarQueries/></AdminSessionBoundary></QueryClientProvider>;}
