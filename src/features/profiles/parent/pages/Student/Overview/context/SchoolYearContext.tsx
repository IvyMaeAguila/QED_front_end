import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/SchoolYearQueries';
export const {Provider:SchoolYearProvider,useValue:useSchoolYear}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/SchoolYearQueries'),()=>({monthOptions:[],monthsLoading:true,monthsError:null}));
