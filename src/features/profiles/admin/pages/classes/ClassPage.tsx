import { ClassesPageComposition } from "./ClassPage.loading-view";
import {useEffect} from 'react';
import {useClasses} from './context/ClassesContext';
export * from "./ClassPage.loading-view";

export function ClassesPage() {
 const {activateQueries}=useClasses();useEffect(()=>{activateQueries();},[activateQueries]);
 return <ClassesPageComposition/>;
}
