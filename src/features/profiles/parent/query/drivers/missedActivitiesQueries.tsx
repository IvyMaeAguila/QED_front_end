import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import { createContext, useContext, type ReactNode } from "react";
import { useParentChildReader } from "../useParentChildReader";
import type { MissedActivity } from "../../pages/Student/Academic/types/types";
import MissedActivitiesService from "../../pages/Student/Academic/service/missedActivities.service";

interface MissedActivitiesContextValue {
  activities: MissedActivity[];
  loading: boolean;
  retry: () => void;
  error: string | null;
}

const MissedActivitiesContext = createContext<MissedActivitiesContextValue | undefined>(
  undefined
);

interface MissedActivitiesProviderProps {
  studentId: number | string;
  children: ReactNode;
}

function MissedActivitiesProvider({ studentId, children }: MissedActivitiesProviderProps) {
  const reader=useParentChildReader(['missed-activities'],studentId,options=>MissedActivitiesService.getMissedActivities(studentId,options),'Failed to fetch missed activities.');
  const activities=reader.data??[],loading=reader.loading,error=reader.error;

  return (
    <MissedActivitiesContext.Provider value={{ activities, loading, error, retry: reader.retry }}>
      {children}
    </MissedActivitiesContext.Provider>
  );
}

function useMissedActivities() {
  const context = useContext(MissedActivitiesContext);
  if (!context) {
    throw new Error("useMissedActivities must be used within a MissedActivitiesProvider");
  }
  return context;
}
export type ReaderValue=ReturnType<typeof useMissedActivities>;
export type ReaderProps=Omit<Parameters<typeof MissedActivitiesProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useMissedActivities();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><MissedActivitiesProvider {...props}><Publish onChange={onChange}/></MissedActivitiesProvider></QueryClientProvider>;});
