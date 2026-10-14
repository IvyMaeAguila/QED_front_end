import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
// SchoolYearContext.tsx
import { createContext, useContext } from "react";
import { useParentYear } from "../useParentYear";
import type { ReactNode } from "react";
import type { MonthOption } from "../../pages/Student/Overview/service/schoolYear.service"; // adjust path as needed

interface SchoolYearContextValue {
  monthOptions: MonthOption[];
  monthsLoading: boolean;
  monthsError: string | null;
}

const SchoolYearContext = createContext<SchoolYearContextValue | undefined>(
  undefined
);

function SchoolYearProvider({ children }: { children: ReactNode }) {
  const reader=useParentYear(),monthOptions=reader.data?.months??[],monthsLoading=reader.loading,monthsError=reader.error;

  return (
    <SchoolYearContext.Provider
      value={{ monthOptions, monthsLoading, monthsError }}
    >
      {children}
    </SchoolYearContext.Provider>
  );
}

function useSchoolYear() {
  const ctx = useContext(SchoolYearContext);
  if (!ctx) {
    throw new Error("useSchoolYear must be used within SchoolYearProvider");
  }
  return ctx;
}
export type ReaderValue=ReturnType<typeof useSchoolYear>;
export type ReaderProps=Omit<Parameters<typeof SchoolYearProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useSchoolYear();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><SchoolYearProvider {...props}><Publish onChange={onChange}/></SchoolYearProvider></QueryClientProvider>;});
