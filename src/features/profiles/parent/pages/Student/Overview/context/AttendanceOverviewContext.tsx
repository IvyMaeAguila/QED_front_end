import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/AttendanceOverviewQueries';
export const {Provider:AttendanceOverviewProvider,useValue:useAttendanceOverview}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/AttendanceOverviewQueries'),()=>({year:'',month:'',setYear:()=>{},setMonth:()=>{},data:null,loading:true,error:null,refetch:()=>{},monthOptions:[],monthsLoading:true,monthsError:null,retryMonths:()=>{}}));
