import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {HolisticTabView,type HolisticTabProps} from '../pages/Student/Holistic/HoisticWeeklyReportTab';
import {fetchStudentWeeklyEvaluation} from '../pages/Student/Holistic/service/weeklyHolistic.service';
import {useParentChildReader} from './useParentChildReader';
function Weekly(props:HolisticTabProps){const reader=useParentChildReader(['holistic','weekly',String(props.termKey)],props.student.id,options=>fetchStudentWeeklyEvaluation(props.student.id,props.termKey,options),'Failed to load holistic evaluation.');return <HolisticTabView {...props} reader={reader}/>;}
export default function ParentWeeklyQueries(props:HolisticTabProps){return <QueryClientProvider client={queryClient}><Weekly {...props}/></QueryClientProvider>;}
