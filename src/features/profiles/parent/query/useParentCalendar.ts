import { useParentReader } from './useParentReader';
import { fetchCalendarActivities, fetchCalendarHolidays, fetchAllCalendarActivities, fetchAllCalendarHolidays } from '@shared/calendar/services/calendar.service';
export function useParentCalendar(includeAll = true) {
  const activities = useParentReader(['calendar','activities'], fetchCalendarActivities, 'Failed to load calendar.');
  const holidays = useParentReader(['calendar','holidays'], fetchCalendarHolidays, 'Failed to load calendar.');
  const allActivities = useParentReader(['calendar','all-activities'], fetchAllCalendarActivities, 'Failed to load calendar.', includeAll);
  const allHolidays = useParentReader(['calendar','all-holidays'], fetchAllCalendarHolidays, 'Failed to load calendar.', includeAll);
  const readers = includeAll ? [activities,holidays,allActivities,allHolidays] : [activities,holidays];
  return {activities:activities.data??[],holidays:holidays.data??[],allActivities:allActivities.data??[],allHolidays:allHolidays.data??[],
    loading:readers.some(r=>r.loading),error:readers.find(r=>r.error)?.error??null,offline:readers.some(r=>r.offline),retry:()=>{for(const reader of readers)void reader.retry();}};
}
