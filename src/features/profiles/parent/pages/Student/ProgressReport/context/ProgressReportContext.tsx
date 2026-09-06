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
import { fetchStudentTermPerformance } from "../service/TermPerformance.service";
import { fetchStudentHolisticTermAverages } from "../service/HolisticPerformance.service";

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

/**
 * Empty shape used only while data hasn't arrived yet (loading) or a fetch
 * failed (error). Never contains fake/mock numbers — consumers should key
 * off `loading` / `error` to render skeletons or error states instead of
 * trusting this as real data.
 */
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

/**
 * Picks the latest term with a released average, e.g. if T1 and T2 are
 * released but T3 isn't yet, this returns "T2". Falls back to "T1" if
 * nothing is released yet, so the UI always has something valid selected.
 */
function getLatestReleasedTerm(termAverages: TermAverageEntry[]): Term {
  for (let i = TERMS.length - 1; i >= 0; i--) {
    const t = TERMS[i];
    const entry = termAverages.find((e) => e.term === t);
    if (entry?.released) return t;
  }
  return "T1";
}

/**
 * Builds a synthetic "OVERALL" holistic entry by averaging each domain's
 * score across every term that has data for it. A domain missing from a
 * term (e.g. not yet assessed) is simply excluded from that domain's
 * average rather than counted as 0.
 */
/**
 * Builds a synthetic "OVERALL" holistic entry by averaging each domain's
 * score across every term — but only once T1, T2, and T3 are all released.
 * Returns undefined while any term is still pending publish, same gating
 * as the GWA in TermAverageCard, so both cards go "complete" together.
 */
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

interface ProgressReportProviderProps {
  children: ReactNode;
  /**
   * If provided, this data is used as-is and no fetch happens — useful for
   * storybook/tests, or when a parent component already fetched the data.
   * If omitted, the provider fetches from the backend using `studentId`.
   */
  data?: ProgressReportData;
  /** Required when `data` is not provided, so the provider knows who to fetch for. */
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

  // Tracks whether the user has manually picked a term tab. Once true, we
  // stop auto-selecting the latest released term on data changes — the
  // user's explicit choice always wins.
  const userSelectedRef = useRef(false);

  function setSelectedTerm(term: TermFilter) {
    userSelectedRef.current = true;
    setSelectedTermState(term);
  }

  useEffect(() => {
    // If data was passed in directly, skip fetching entirely.
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
        const [termResult, holisticResult] = await Promise.allSettled([
          fetchStudentTermPerformance(studentId!, { force: refetchTick > 0 }),
          fetchStudentHolisticTermAverages(studentId!, { force: refetchTick > 0 }),
        ]);

        if (cancelled) return;

        if (termResult.status === "rejected") {
          throw termResult.reason instanceof Error
            ? termResult.reason
            : new Error("Failed to load progress report.");
        }

        const backendTerms = termResult.value;
        const termAverages = toTermAverages(backendTerms);

        const holisticAssessments =
          holisticResult.status === "fulfilled" ? toHolisticAssessments(holisticResult.value) : [];

        if (holisticResult.status === "rejected") {
          console.error("Failed to load holistic assessments:", holisticResult.reason);
        }

        setFetchedData({
          meta: {
            learner: "",
            gradeSection: "",
            classAdviser: "",
            schoolYear: "",
          },
          periodicRatings: toPeriodicRatingRows(backendTerms),
          termAverages,
          holisticAssessments,
          attendanceByTerm: [],
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

  // Attendance doesn't support "OVERALL" yet — falls through to undefined,
  // same as any unmatched term, until this is scoped.
  const currentAttendance = useMemo(
    () => data.attendanceByTerm.find((a) => a.term === selectedTerm),
    [data.attendanceByTerm, selectedTerm],
  );

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