import {createContext,type ComponentType,type Dispatch,type SetStateAction} from 'react';
import type * as api from '../pages/grades/services/gradePage.service';
export interface VisibilityScope {
 period:string;classId?:string;ready:boolean;attempt:number;
 setStudents:Dispatch<SetStateAction<api.VisibilityStudent[]>>;
 setSelected:Dispatch<SetStateAction<Set<string>>>;
 setLoading:Dispatch<SetStateAction<boolean>>;
 setError:Dispatch<SetStateAction<string|null>>;
}
export const TeacherGradeQueryContext=createContext<{
 VisibilityEffects:ComponentType<VisibilityScope>;
 submit:typeof api.submitClassGrades;
 saveVisibility:typeof api.setGradeVisibility;
 fetchLogs:typeof api.fetchClassSubmissionLogs;
}|null>(null);
