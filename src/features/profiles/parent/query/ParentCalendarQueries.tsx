import { CalendarPageViewComposition, type CalendarPageViewRouteProps } from '@shared/calendar/CalendarPageView.loading-view';
import { useParentCalendar } from './useParentCalendar';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
export default function ParentCalendarQueries(props:CalendarPageViewRouteProps) {
  const data=useParentCalendar();
  return <QueryClientProvider client={queryClient}><CalendarPageViewComposition {...props} data={data}/></QueryClientProvider>;
}
