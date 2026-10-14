import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/PerformanceAnalyticsQueries';
export const {Provider:TermPerformanceProvider,useValue:useTermPerformance}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/PerformanceAnalyticsQueries'),()=>({terms:[],termPoints:[],loading:true,error:null,refetch:()=>{}}));
export type {SubjectGrade,Term} from '../../../../query/drivers/PerformanceAnalyticsQueries';
export interface TermPoint {term:string;average:number;subjects:import('../../../../query/drivers/PerformanceAnalyticsQueries').SubjectGrade[]}
