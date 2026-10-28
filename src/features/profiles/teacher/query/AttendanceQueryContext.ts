import {createContext,type ComponentType,type Dispatch,type SetStateAction} from 'react';
import type {AttendanceMap} from '../pages/subjects/detail/types/Grading';
import type {saveAdvisoryAttendance,markAdvisoryPresent} from '../pages/attendance/services/attendance.service';
export interface AttendanceReadScope {
 classId:string;termId?:string;allPeriods?:boolean;ready:boolean;attempt:number;
 setAttendance:Dispatch<SetStateAction<AttendanceMap>>;
 setLoading:Dispatch<SetStateAction<boolean>>;
 setError:Dispatch<SetStateAction<string|null>>;
 setLoadedFor?:Dispatch<SetStateAction<string|null>>;
 errorMessage:string;
}
// Lightweight preview contract. The implementation lives in the lazy page.
export const AttendanceQueryContext=createContext<{
 Effects:ComponentType<AttendanceReadScope>;
 save:typeof saveAdvisoryAttendance;
 markPresent:typeof markAdvisoryPresent;
}|null>(null);
