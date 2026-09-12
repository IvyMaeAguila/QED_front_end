import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  Term,
  TermFilter,
  ProgressReportData,
  TermAverageEntry,
  HolisticAssessmentEntry,
  HolisticDomainKey,
  HolisticDomainScore,
  AttendanceTermEntry,
} from "../types/types";
import { TERMS } from "../types/types";
import { toPeriodicRatingRows, toTermAverages } from "../utils/transformProgressReport";
import { toHolisticAssessments } from "../utils/TransformHolisticPerformance";
import { toAttendanceByTerm } from "../utils/transformAttendance";
import { fetchStudentTermPerformance } from "../service/TermPerformance.service";
import { fetchStudentHolisticTermAverages } from "../service/HolisticPerformance.service";
import AttendanceService from "../service/AttendanceSummary.service";

interface ProgressReportContextValue {
  data: ProgressReportData;
  loading: boolean;
  error: string | null;
  selectedTerm: TermFilter;
  setSelectedTerm: (term: TermFilter) => void;
  currentTermAverage: TermAverageEntry | undefined;
  currentHolisticAssessment: HolisticAssessmentEntry | undefined;
  currentAttendance: AttendanceTermEntry | undefined;
  /** Bypasses the service-layer cache and re-fetches from the backend. */
  refetch: () => void;
}

const ProgressReportContext = createContext<ProgressReportContextValue | undefined>(undefined);


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

export function ProgressReportProvider({
  children,
  data: providedData,
  studentId,
}: ProgressReportProviderProps) {
  const [selectedTerm, setSelectedTermState] = useState<TermFilter>("T1");
  const [fetchedData, setFetchedData] = useState<ProgressReportData | null>(null);
  const [loading, setLoading] = useState(!providedData);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  const userSelectedRef = useRef(false);

  function setSelectedTerm(term: TermFilter) {
    userSelectedRef.current = true;
    setSelectedTermState(term);
  }

  useEffect(() => {
    if (providedData) return;

    if (!studentId) {
      setError("Missing studentId for fetching progress report.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [termResult, holisticResult, attendanceResult] = await Promise.allSettled([
          fetchStudentTermPerformance(studentId!, { force: refetchTick > 0 }),
          fetchStudentHolisticTermAverages(studentId!, { force: refetchTick > 0 }),
          AttendanceService.getAttendanceSummary(Number(studentId)),
        ]);

        if (cancelled) return;

        if (termResult.status === "rejected") {
          throw termResult.reason instanceof Error
            ? termResult.reason
            : new Error("Failed to load progress report.");
        }

        const backendResult = termResult.value;
        const backendTerms = backendResult.terms;
        const termAverages = toTermAverages(backendTerms);

        const holisticAssessments =
          holisticResult.status === "fulfilled" ? toHolisticAssessments(holisticResult.value) : [];

        if (holisticResult.status === "rejected") {
          console.error("Failed to load holistic assessments:", holisticResult.reason);
        }

        const attendanceByTerm =
          attendanceResult.status === "fulfilled" ? toAttendanceByTerm(attendanceResult.value) : [];

        if (attendanceResult.status === "rejected") {
          console.error("Failed to load attendance summary:", attendanceResult.reason);
        }

        setFetchedData({

          meta: backendResult.meta,
          periodicRatings: toPeriodicRatingRows(backendTerms),
          termAverages,
          holisticAssessments,
          attendanceByTerm,
        });

        if (!userSelectedRef.current) {
          setSelectedTermState(getLatestReleasedTerm(termAverages));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load progress report.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [providedData, studentId, refetchTick]);

  useEffect(() => {
    if (providedData && !userSelectedRef.current) {
      setSelectedTermState(getLatestReleasedTerm(providedData.termAverages));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedData]);

  const data = providedData ?? fetchedData ?? EMPTY_PROGRESS_REPORT_DATA;

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

  const refetch = () => setRefetchTick((n) => n + 1);

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
  };

  return <ProgressReportContext.Provider value={value}>{children}</ProgressReportContext.Provider>;
}

export function useProgressReport() {
  const ctx = useContext(ProgressReportContext);
  if (!ctx) {
    throw new Error("useProgressReport must be used within a ProgressReportProvider");
  }
  return ctx;
}