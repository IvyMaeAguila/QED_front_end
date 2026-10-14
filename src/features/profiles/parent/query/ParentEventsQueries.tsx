import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {EventsCardView,type EventsCardProps} from '../pages/dashboard/components/EventsCard';
import {useParentCalendar} from './useParentCalendar';
function Events(props:EventsCardProps){const calendar=useParentCalendar(false);return <EventsCardView {...props} calendar={calendar}/>;}
export default function ParentEventsQueries(props:EventsCardProps){return <QueryClientProvider client={queryClient}><Events {...props}/></QueryClientProvider>;}
