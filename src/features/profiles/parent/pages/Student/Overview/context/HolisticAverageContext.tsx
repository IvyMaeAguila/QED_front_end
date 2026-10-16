import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/HolisticAverageQueries';
export const {Provider:StudentNarrativeSnapshotProvider,useValue:useStudentNarrativeSnapshot}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/HolisticAverageQueries'),()=>({snapshot:null,loading:true,error:null,retry:()=>{}}));
