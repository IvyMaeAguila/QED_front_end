import { StudentRecordsPageComposition } from "./StudentRecordsPage.loading-view";
import {useEffect} from 'react';
import {useStudents} from './context/StudentsContext';
export * from "./StudentRecordsPage.loading-view";

export function StudentRecordsPage() {
 const {activateQueries}=useStudents();useEffect(()=>{activateQueries();},[activateQueries]);
 return <StudentRecordsPageComposition/>;
}
