import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/classScheduleQueries';
export const {Provider:ClassScheduleProvider,useValue:useClassSchedule}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/classScheduleQueries'),()=>({items:[],loading:true,retry:()=>{},error:null}));
