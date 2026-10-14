import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParentChildReader } from "../useParentChildReader";
import { fetchStudentTermPerformance } from "../../pages/Student/Overview/service/studentTermPerformance.service";
import type { Term, SubjectGrade } from "../../pages/Student/Overview/service/studentTermPerformance.service";

export type { SubjectGrade, Term };

export interface TermPoint {
  /** "Term 1" | "Term 2" | "Term 3" */
  term: string;
  /** Overall average for that term (percentage) */
  average: number;
  /** Per-subject grades for that term — shown on hover */
  subjects: SubjectGrade[];
}

interface TermPerformanceContextValue {
  terms: Term[];
  termPoints: TermPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TermPerformanceContext = createContext<TermPerformanceContextValue | undefined>(
  undefined
);

const EMPTY_TERMS:Term[]=[];
function toTermPoints(terms: Term[]): TermPoint[] {
  return terms
    .filter((t) => t.released && t.average !== undefined)
    .map((t, i) => ({
      term: `Term ${i + 1}`,
      average: t.average as number,
      subjects: t.subjects,
    }));
}

function TermPerformanceProvider({
  studentId,
  children,
}: {
  studentId: string;
  children: ReactNode;
}) {
  const reader = useParentChildReader(['overview','academic'],studentId,options=>fetchStudentTermPerformance(studentId,options),'Failed to load term performance.');
  const terms = reader.data ?? EMPTY_TERMS, loading = reader.loading, error = reader.error, refetch = reader.retry;
  const termPoints = useMemo(()=>toTermPoints(terms),[terms]);

  const value: TermPerformanceContextValue = {
    terms,
    termPoints,
    loading,
    error,
    refetch,
  };

  return (
    <TermPerformanceContext.Provider value={value}>
      {children}
    </TermPerformanceContext.Provider>
  );
}

function useTermPerformance() {
  const ctx = useContext(TermPerformanceContext);
  if (!ctx) {
    throw new Error(
      "useTermPerformance must be used within a TermPerformanceProvider"
    );
  }
  return ctx;
}
export type ReaderValue=ReturnType<typeof useTermPerformance>;
export type ReaderProps=Omit<Parameters<typeof TermPerformanceProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useTermPerformance();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><TermPerformanceProvider {...props}><Publish onChange={onChange}/></TermPerformanceProvider></QueryClientProvider>;});
