import { ClassViewPageComposition } from "./ClassViewPage.loading-view";
import {useEffect} from 'react';
import {useClasses} from './context/ClassesContext';
import {useStudents} from '../studentrecords/context/StudentsContext';
export * from "./ClassViewPage.loading-view";

export function ClassViewPage() {
 const {activateQueries}=useClasses(),{activateQueries:activateStudents}=useStudents();useEffect(()=>{activateQueries();activateStudents();},[activateQueries,activateStudents]);
 return <ClassViewPageComposition/>;
}
