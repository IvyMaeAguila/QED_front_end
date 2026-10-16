import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { useParentChildReader } from "../useParentChildReader";
import type {
  Term,
  TermFilter,
  ProgressReportData,
  TermAverageEntry,
  HolisticAssessmentEntry,
  HolisticDomainKey,
  HolisticDomainScore,
  AttendanceTermEntry,
} from "../../pages/Student/ProgressReport/types/types";
import { TERMS } from "../../pages/Student/ProgressReport/types/types";
import { toPeriodicRatingRows, toTermAverages } from "../../pages/Student/ProgressReport/utils/transformProgressReport";
import { toHolisticAssessments } from "../../pages/Student/ProgressReport/utils/TransformHolisticPerformance";
import { toAttendanceByTerm } from "../../pages/Student/ProgressReport/utils/transformAttendance";
import { fetchStudentTermPerformance } from "../../pages/Student/ProgressReport/service/TermPerformance.service";
import { fetchStudentHolisticTermAverages } from "../../pages/Student/ProgressReport/service/HolisticPerformance.service";
import AttendanceService from "../../pages/Student/ProgressReport/service/AttendanceSummary.service";
import { fetchStudentGradeVisibility, type TermVisibilityEntry } from "../../pages/Student/ProgressReport/service/GradeVisibility.service";

interface ProgressReportContextValue {
  data: ProgressReportData;
  loading: boolean;
  error: string | null;
  selectedTerm: TermFilter;
  setSelectedTerm: (term: TermFilter) => void;
  currentTermAverage: TermAverageEntry | undefined;
  currentHolisticAssessment: HolisticAssessmentEntry | undefined;
  currentAttendance: AttendanceTermEntry | undefined;
  refetch: () => void;
  visibility: TermVisibilityEntry[];
  /** Visibility entry (isVisible/termEnded/available) para sa currently selected term. */
  selectedTermVisibility: TermVisibilityEntry | undefined;
}

const ProgressReportContext = createContext<ProgressReportContextValue | undefined>(undefined);


const EMPTY_VISIBILITY:TermVisibilityEntry[]=[];
const EMPTY_PROGRESS_REPORT_DATA: ProgressReportData = {
  meta: {
    learner: "",
    gradeSection: "",
    classAdviser: "",
    schoolYear: "",
  },
  periodicRatings: [],
  termAverages: [],
  holisticAssessments: [],
  attendanceByTerm: [],
};

function getLatestReleasedTerm(termAverages: TermAverageEntry[]): Term {
  for (let i = TERMS.length - 1; i >= 0; i--) {
    const t = TERMS[i];
    const entry = termAverages.find((e) => e.term === t);
    if (entry?.released) return t;
  }
  return "T1";
}

/** Kinukuha ang term_number (1, 2, 3) mula sa "T1"/"T2"/"T3" string
 * para ma-match sa termNumber na galing sa grading_periods table. */
function termToTermNumber(term: Term): number {
  return parseInt(term.replace(/\D/g, ""), 10);
}

function computeOverallHolisticAssessment(
  assessments: HolisticAssessmentEntry[],
  termAverages: TermAverageEntry[],
): HolisticAssessmentEntry | undefined {
  const allReleased = TERMS.every((t) => termAverages.find((e) => e.term === t)?.released);
  if (!allReleased) return undefined;

  const perTermAssessments = assessments.filter((a) => a.term !== "OVERALL");
  if (perTermAssessments.length === 0) return undefined;

  const domainMap = new Map<
    HolisticDomainKey,
    { label: string; subtitle: string; maxScore: number; total: number; count: number }
  >();

  for (const entry of perTermAssessments) {
    for (const domain of entry.domains) {
      const existing = domainMap.get(domain.key);
      if (existing) {
        existing.total += domain.score;
        existing.count += 1;
      } else {
        domainMap.set(domain.key, {
          label: domain.label,
          subtitle: domain.subtitle,
          maxScore: domain.maxScore,
          total: domain.score,
          count: 1,
        });
      }
    }
  }

  const domains: HolisticDomainScore[] = Array.from(domainMap.entries()).map(([key, v]) => ({
    key,
    label: v.label,
    subtitle: v.subtitle,
    maxScore: v.maxScore,
    score: Math.round((v.total / v.count) * 100) / 100,
  }));

  return { term: "OVERALL", domains };
}


function computeOverallAttendance(
  attendanceByTerm: AttendanceTermEntry[],
): AttendanceTermEntry | undefined {
  const perTermEntries = TERMS
    .map((t) => attendanceByTerm.find((a) => a.term === t))
    .filter((entry): entry is AttendanceTermEntry => entry !== undefined);

  if (perTermEntries.length === 0) return undefined;

  const totals = perTermEntries.reduce(
    (acc, entry) => ({
      present: acc.present + entry.present,
      absent: acc.absent + entry.absent,
      tardiness: acc.tardiness + entry.tardiness,
      excused: acc.excused + (entry.excused ?? 0),
      totalDays: acc.totalDays + entry.totalDays,
    }),
    { present: 0, absent: 0, tardiness: 0, excused: 0, totalDays: 0 },
  );

  return {
    term: "OVERALL",
    ...totals,
    months: perTermEntries.flatMap((entry) => entry.months),
  };
}

interface ProgressReportProviderProps {
  children: ReactNode;

  data?: ProgressReportData;

  studentId?: string;
}

function ProgressReportProvider({
  children,
  data: providedData,
  studentId,
}: ProgressReportProviderProps) {
  const [selectedTerm, setSelectedTermState] = useState<TermFilter>("T1");
  const userSelectedRef = useRef(false);

  function setSelectedTerm(term: TermFilter) {
    userSelectedRef.current = true;
    setSelectedTermState(term);
  }

  const ready=!providedData&&!!studentId;
  const academic=useParentChildReader(['progress','academic'],studentId,options=>fetchStudentTermPerformance(studentId!,options),'Failed to load progress report.',30_000,undefined,ready);
  const holistic=useParentChildReader(['progress','holistic'],studentId,options=>fetchStudentHolisticTermAverages(studentId!,options),'Failed to load holistic assessments.',30_000,undefined,ready);
  const attendance=useParentChildReader(['progress','attendance'],studentId,options=>AttendanceService.getAttendanceSummary(Number(studentId),options),'Failed to load attendance summary.',30_000,undefined,ready);
  const access=useParentChildReader(['progress','visibility'],studentId,options=>fetchStudentGradeVisibility(studentId!,options),'Failed to load grade visibility.',30_000,undefined,ready);
  const denied=[academic,holistic,attendance,access].find(reader=>reader.denied);
  const fetchedData=useMemo(()=>academic.data?({meta:academic.data.meta,periodicRatings:toPeriodicRatingRows(academic.data.terms),termAverages:toTermAverages(academic.data.terms),holisticAssessments:holistic.data?toHolisticAssessments(holistic.data):[],attendanceByTerm:attendance.data?toAttendanceByTerm(attendance.data):[]}):null,[academic.data,holistic.data,attendance.data]);
  const data=providedData??(denied?EMPTY_PROGRESS_REPORT_DATA:fetchedData??EMPTY_PROGRESS_REPORT_DATA);
  const visibility=denied?EMPTY_VISIBILITY:access.data??EMPTY_VISIBILITY;
  const loading=!providedData&&[academic,holistic,attendance,access].some(reader=>reader.loading);
  const error=providedData?null:!studentId?'Missing studentId for fetching progress report.':denied?.error??academic.error;
  useEffect(()=>{if(!userSelectedRef.current)setSelectedTermState(getLatestReleasedTerm(data.termAverages));},[data.termAverages]);
  const refetch=()=>{void Promise.all([academic.retry(),holistic.retry(),attendance.retry(),access.retry()]);};

  const currentTermAverage = useMemo(
    () => data.termAverages.find((t) => t.term === selectedTerm),
    [data.termAverages, selectedTerm],
  );

  const currentHolisticAssessment = useMemo(() => {
    if (selectedTerm === "OVERALL") {
      return computeOverallHolisticAssessment(data.holisticAssessments, data.termAverages);
    }
    return data.holisticAssessments.find((h) => h.term === selectedTerm);
  }, [data.holisticAssessments, data.termAverages, selectedTerm]);

  const currentAttendance = useMemo(() => {
    if (selectedTerm === "OVERALL") {
      return computeOverallAttendance(data.attendanceByTerm);
    }
    return data.attendanceByTerm.find((a) => a.term === selectedTerm);
  }, [data.attendanceByTerm, selectedTerm]);

  const selectedTermVisibility = useMemo((): TermVisibilityEntry | undefined => {
    if (visibility.length === 0) return undefined;

    if (selectedTerm === "OVERALL") {
      const allAvailable = visibility.every((v) => v.available);
      const allTermEnded = visibility.every((v) => v.termEnded);
      const allVisible = visibility.every((v) => v.isVisible);
      return {
        gradingPeriodId: -1,
        termNumber: -1,
        termLabel: "OVERALL",
        submitted: visibility.every((v) => v.submitted),
        isVisible: allVisible,
        termEnded: allTermEnded,
        available: allAvailable,
      };
    }

    const termNumber = termToTermNumber(selectedTerm);
    return visibility.find((v) => v.termNumber === termNumber);
  }, [visibility, selectedTerm]);


  const value: ProgressReportContextValue = {
    data,
    loading,
    error,
    selectedTerm,
    setSelectedTerm,
    currentTermAverage,
    currentHolisticAssessment,
    currentAttendance,
    refetch,
    visibility,
    selectedTermVisibility,
  };

  return <ProgressReportContext.Provider value={value}>{children}</ProgressReportContext.Provider>;
}

function useProgressReport() {
  const ctx = useContext(ProgressReportContext);
  if (!ctx) {
    throw new Error("useProgressReport must be used within a ProgressReportProvider");
  }
  return ctx;
}
export type ReaderValue=ReturnType<typeof useProgressReport>;
export type ReaderProps=Omit<Parameters<typeof ProgressReportProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useProgressReport();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><ProgressReportProvider {...props}><Publish onChange={onChange}/></ProgressReportProvider></QueryClientProvider>;});
