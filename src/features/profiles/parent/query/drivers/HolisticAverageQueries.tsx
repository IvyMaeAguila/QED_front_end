import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
// src/features/holistic/context/HolisticAverageContext.tsx

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useParentChildReader } from "../useParentChildReader";
import type { StudentNarrativeSnapshot } from "../../pages/Student/Overview/types/holisticAverageType";
import type { StudentDomainKey } from "../../pages/Student/Overview/types/holisticAverageType";
import {
  fetchStudentHolisticTermAverages,
  type HolisticTermAverage,
  type HolisticDomainAverages,
} from "../../pages/Student/Overview/service/holisticTermPerformance.service";

interface StudentNarrativeSnapshotContextValue {
  snapshot: StudentNarrativeSnapshot | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const StudentNarrativeSnapshotContext =
  createContext<StudentNarrativeSnapshotContextValue | undefined>(undefined);

interface StudentNarrativeSnapshotProviderProps {
  studentId: string;
  children: ReactNode;
}

const NARRATIVE_DOMAINS: StudentDomainKey[] = ["cognitive", "emotional", "behavioral", "social"];

/**
 * Averages all 4 holistic axes (cognitive/emotional/behavioral/social) that
 * the backend tracks. Returns null if every domain is null (nothing to
 * average yet).
 */
function computeComposite(domainAverages: HolisticDomainAverages): number | null {
  const values = [
    domainAverages.cognitive,
    domainAverages.emotional,
    domainAverages.behavioral,
    domainAverages.social,
  ].filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100;
}

/**
 * Maps one student's full list of per-term holistic averages down to the
 * single-term StudentNarrativeSnapshot shape this UI expects.
 *
 * KNOWN GAPS vs the original mock shape (flagging rather than guessing):
 * - `reportCardStatus` distinguishes visible scores from future terms. The
 *   active term is visible live; completed terms remain visible after end.
 * - `domainScores` includes all 4 backend axes (cognitive/emotional/
 *   behavioral/social).
 * - `studentName` isn't returned by this endpoint at all, so it's left as
 *   an empty string — callers that need a display name should keep sourcing
 *   it from their own student record (e.g. `DetailStudent.firstName`), same
 *   as HolisticAverage.tsx already does.
 * - `releasedAt` isn't returned by this endpoint, so it remains null.
 */
function toStudentNarrativeSnapshot(
  studentId: string,
  allTerms: HolisticTermAverage[]
): StudentNarrativeSnapshot | null {
  const current = allTerms.find((t) => t.isActive) ??
    allTerms.reduce<HolisticTermAverage | undefined>(
      (latest, term) => (!latest || term.termNumber > latest.termNumber ? term : latest),
      undefined,
    );
  if (!current) return null;

  const previous = allTerms.find((t) => t.termNumber === current.termNumber - 1);

  const domainScores = NARRATIVE_DOMAINS.map((domain) => ({
    domain,
    score: current.released ? current.domainAverages[domain] : null,
  }));

  return {
    studentId,
    studentName: "",
    termNumber: current.termNumber,
    termLabel: current.termLabel,
    reportCardStatus: current.released ? "released" : "not_released",
    releasedAt: null,
    domainScores,
    compositeScore: current.released ? computeComposite(current.domainAverages) : null,
    previousCompositeScore:
      previous?.released ? computeComposite(previous.domainAverages) : null,
  };
}

function StudentNarrativeSnapshotProvider({
  studentId,
  children,
}: StudentNarrativeSnapshotProviderProps) {
  const reader=useParentChildReader(['overview','holistic'],studentId,options=>fetchStudentHolisticTermAverages(studentId,options),'Failed to load narrative snapshot.',30_000,30_000);
  const snapshot=useMemo(()=>reader.data?toStudentNarrativeSnapshot(studentId,reader.data):null,[reader.data,studentId]);
  const retry=reader.retry;
  useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')void retry();};document.addEventListener('visibilitychange',refresh);return()=>document.removeEventListener('visibilitychange',refresh);},[retry]);
  const value={snapshot,loading:reader.loading,error:reader.error,retry:reader.retry};

  return (
    <StudentNarrativeSnapshotContext.Provider value={value}>
      {children}
    </StudentNarrativeSnapshotContext.Provider>
  );
}

function useStudentNarrativeSnapshot() {
  const ctx = useContext(StudentNarrativeSnapshotContext);
  if (!ctx) {
    throw new Error(
      "useStudentNarrativeSnapshot must be used within a StudentNarrativeSnapshotProvider"
    );
  }
  return ctx;
}

export type ReaderValue=ReturnType<typeof useStudentNarrativeSnapshot>;
export type ReaderProps=Omit<Parameters<typeof StudentNarrativeSnapshotProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useStudentNarrativeSnapshot();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><StudentNarrativeSnapshotProvider {...props}><Publish onChange={onChange}/></StudentNarrativeSnapshotProvider></QueryClientProvider>;});
