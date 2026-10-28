import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {CalendarPageViewComposition,type CalendarPageViewRouteProps} from '@shared/calendar/CalendarPageView.loading-view';
import {useCalendarReads} from '@shared/calendar/useCalendarReads';
import {useTeacherQueryScope} from './teacherQueryScope';
function CalendarQueries(props:CalendarPageViewRouteProps){const scope=useTeacherQueryScope();const data=useCalendarReads({...scope,key:[...scope.key,'calendar',new Date().toLocaleDateString('en-CA')]});return <CalendarPageViewComposition {...props} data={data}/>;}
export default function TeacherCalendarQueries(props:CalendarPageViewRouteProps){return <QueryClientProvider client={queryClient}><CalendarQueries {...props}/></QueryClientProvider>;}
