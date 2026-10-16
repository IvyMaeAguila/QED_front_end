import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import { createContext, useContext, type ReactNode } from "react";
import { useParentChildReader } from "../useParentChildReader";
import type { ScheduleItem } from "../../pages/Student/Academic/types/types";
import { fetchClassSchedule } from "../../pages/Student/Academic/service/classSchedule.service";

interface ClassScheduleContextValue {
  items: ScheduleItem[];
  loading: boolean;
  retry: () => void;
  error: string | null;
}

const ClassScheduleContext = createContext<ClassScheduleContextValue | undefined>(
  undefined
);

interface ClassScheduleProviderProps {
  studentId: string;
  children: ReactNode;
}

function ClassScheduleProvider({ studentId, children }: ClassScheduleProviderProps) {
  const reader=useParentChildReader(['schedule'],studentId,options=>fetchClassSchedule(studentId,options),'Failed to load class schedule.',300_000);
  const items=reader.data??[],loading=reader.loading,error=reader.error;

  return (
    <ClassScheduleContext.Provider value={{ items, loading, error, retry: reader.retry }}>
      {children}
    </ClassScheduleContext.Provider>
  );
}

function useClassSchedule(): ClassScheduleContextValue {
  const context = useContext(ClassScheduleContext);
  if (!context) {
    throw new Error("useClassSchedule must be used within a ClassScheduleProvider");
  }
  return context;
}
export type ReaderValue=ReturnType<typeof useClassSchedule>;
export type ReaderProps=Omit<Parameters<typeof ClassScheduleProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useClassSchedule();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><ClassScheduleProvider {...props}><Publish onChange={onChange}/></ClassScheduleProvider></QueryClientProvider>;});
