import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {InterventionSupportView,type InterventionSupportProps} from '../pages/Student/Academic/components/InterventionSupport';
import LowGradeTopicsService from '../pages/Student/Academic/service/intervention.service';
import {useParentChildReader} from './useParentChildReader';
function Flags(props:InterventionSupportProps){const reader=useParentChildReader(['intervention','flags'],props.student.id,options=>LowGradeTopicsService.getLowGradeTopics(props.student.id,options),'Unable to load intervention data right now.',0);return <InterventionSupportView {...props} reader={{...reader,flags:reader.data??[]}}/>;}
export default function ParentInterventionQueries(props:InterventionSupportProps){return <QueryClientProvider client={queryClient}><Flags {...props}/></QueryClientProvider>;}
