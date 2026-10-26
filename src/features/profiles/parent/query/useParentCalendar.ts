import {useCalendarReads} from '@shared/calendar/useCalendarReads';
import {useParentQueryScope} from './parentQueryScope';
export function useParentCalendar(includeAll=true){const scope=useParentQueryScope();return useCalendarReads({...scope,key:[...scope.key,'calendar']},includeAll);}
