import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/missedActivitiesQueries';
export const {Provider:MissedActivitiesProvider,useValue:useMissedActivities}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/missedActivitiesQueries'),()=>({activities:[],loading:true,retry:()=>{},error:null}));
