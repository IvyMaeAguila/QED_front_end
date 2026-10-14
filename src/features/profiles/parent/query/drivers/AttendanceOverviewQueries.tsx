import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
// AttendanceOverviewContext.tsx
import { createContext, useContext, useState } from "react";
import { useParentYear } from "../useParentYear";
import { useParentChildReader } from "../useParentChildReader";
import type { ReactNode } from "react";
import AttendanceService from "../../pages/Student/Overview/service/attendance.service"; // adjust path as needed
import type { MonthlyAttendance } from "../../pages/Student/Overview/service/attendance.service"; // adjust path as needed
import type { MonthOption } from "../../pages/Student/Overview/service/schoolYear.service"; // adjust path as needed
import type { DetailStudent } from "../../pages/Student/GlobalTypes/types";

interface AttendanceOverviewContextValue {
  year: string;
  month: string;
  setYear: (year: string) => void;
  setMonth: (month: string) => void;
  data: MonthlyAttendance | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  monthOptions: MonthOption[];
  monthsLoading: boolean;
  monthsError: string | null;
  retryMonths: () => void;
}

const AttendanceOverviewContext = createContext<
  AttendanceOverviewContextValue | undefined
>(undefined);

interface AttendanceOverviewProviderProps {
  student: DetailStudent;
  children: ReactNode;
}

// "YYYY-MM" galing sa kasalukuyang petsa ng device
function getCurrentMonthKey(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
}

function AttendanceOverviewProvider({
  student,
  children,
}: AttendanceOverviewProviderProps) {
  const years=useParentYear(),monthOptions=years.data?.months??[],monthsLoading=years.loading,monthsError=years.error;
  const [selection,setSelection]=useState<{year:string;month:string;scope:string}>();
  const currentKey=getCurrentMonthKey(),defaultOption=monthOptions.find(m=>m.key===currentKey)??monthOptions.at(-1);
  const scope=String(years.data?.id??'active');
  const selected=selection?.scope===scope?selection:undefined;
  const year=selected?.year??defaultOption?.key.slice(0,4)??'',month=selected?.month??defaultOption?.key.slice(5,7)??'';
  const setYear=(value:string)=>setSelection(previous=>({year:value,month:previous?.scope===scope?previous.month:month,scope}));
  const setMonth=(value:string)=>setSelection(previous=>({year:previous?.scope===scope?previous.year:year,month:value,scope}));
  const reader=useParentChildReader(['attendance','monthly',year,month],student.id,options=>AttendanceService.getMonthlyAttendance(Number(student.id),parseInt(month,10),parseInt(year,10),options),'Failed to load attendance.',30_000,undefined,!!month&&!!year);
  const data=reader.data??null,loading=reader.loading,error=reader.error,fetchAttendance=reader.retry;

  return (
    <AttendanceOverviewContext.Provider
      value={{
        year,
        month,
        setYear,
        setMonth,
        data,
        loading,
        error,
        refetch: fetchAttendance,
        monthOptions,
        monthsLoading,
        monthsError,
        retryMonths: years.retry,
      }}
    >
      {children}
    </AttendanceOverviewContext.Provider>
  );
}

function useAttendanceOverview() {
  const ctx = useContext(AttendanceOverviewContext);
  if (!ctx) {
    throw new Error(
      "useAttendanceOverview must be used within an AttendanceOverviewProvider"
    );
  }
  return ctx;
}

export type ReaderValue=ReturnType<typeof useAttendanceOverview>;
export type ReaderProps=Omit<Parameters<typeof AttendanceOverviewProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useAttendanceOverview();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><AttendanceOverviewProvider {...props}><Publish onChange={onChange}/></AttendanceOverviewProvider></QueryClientProvider>;});
