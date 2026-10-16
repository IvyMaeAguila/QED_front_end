import {createContext,useContext,type ComponentType,type Dispatch,type SetStateAction} from 'react';
import * as grading from '../pages/subjects/services/subjectGrading.service';
import * as holistic from '../pages/holistic/services/holistic.service';
import type {TeacherReader} from './TeacherReader';
export interface TopicScope {
 subjectId:string;enabled:boolean;setTopics:Dispatch<SetStateAction<grading.Topic[]>>;
 setLoading:Dispatch<SetStateAction<boolean>>;setError:Dispatch<SetStateAction<string|null>>;
 setNewTopicMode?:Dispatch<SetStateAction<boolean>>;
 onTopicsChanged?:(topics:grading.Topic[])=>void;
}
export interface WeeklyScope {
 subjectId:string;termNumber?:number;periodId?:string;attempt:number;editing:boolean;
 setData:Dispatch<SetStateAction<holistic.HolisticWeeklyMap>>;
 setLoading:Dispatch<SetStateAction<boolean>>;setError:Dispatch<SetStateAction<string|null>>;
 setPeriods:Dispatch<SetStateAction<holistic.GradingPeriod[]>>;
 setPeriodsLoaded:Dispatch<SetStateAction<boolean>>;setPeriodError:Dispatch<SetStateAction<string|null>>;
}
export type GradingPort=Pick<typeof grading,'addItem'|'deleteItem'|'fetchItems'|'fetchScores'|'saveScore'|'saveHolistic'|'fetchTopics'|'createTopic'|'submitGrades'>;
export type HolisticPort=Pick<typeof holistic,'fetchGradingPeriodsGlobal'|'fetchHolisticWeekly'|'saveHolistic'>;
export interface AcademicPort {
 grading:GradingPort;holistic:HolisticPort;writing:boolean;
 TopicsEffects:ComponentType<TopicScope>;WeeklyEffects:ComponentType<WeeklyScope>;
 info:TeacherReader<Awaited<ReturnType<typeof grading.fetchSubjectSectionInfo>>>;
 periods:TeacherReader<holistic.GradingPeriod[]>;
}
export const TeacherAcademicQueryContext=createContext<AcademicPort|null>(null);
const legacy={grading:{addItem:grading.addItem,deleteItem:grading.deleteItem,fetchItems:grading.fetchItems,fetchScores:grading.fetchScores,saveScore:grading.saveScore,saveHolistic:grading.saveHolistic,fetchTopics:grading.fetchTopics,createTopic:grading.createTopic,submitGrades:grading.submitGrades},holistic:{fetchGradingPeriodsGlobal:holistic.fetchGradingPeriodsGlobal,fetchHolisticWeekly:holistic.fetchHolisticWeekly,saveHolistic:holistic.saveHolistic}};
export function useTeacherAcademicServices(){
 const port=useContext(TeacherAcademicQueryContext);
 return port??legacy;
}
