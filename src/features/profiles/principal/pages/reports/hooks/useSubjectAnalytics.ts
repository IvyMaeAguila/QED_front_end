import { useMemo, useState } from "react";
import type { Term } from "../data/types";
import { getGradeOptions, getSubjectRanking } from "../services/reports.service";
import { aggregateWholeElementary, filterAndRankByGrade, getLowestPerforming } from "../utils/ranking";
import { useAnalyticsReads } from "./useAnalyticsReads";

export function useSubjectAnalytics() {
  const [term, setTerm] = useState<Term>("Term 1");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const reads = useAnalyticsReads("subjects", [term], options => getSubjectRanking(term, options), "grades", getGradeOptions);
  const rawRanking = useMemo(() => reads.data ?? [], [reads.data]);
  const wholeElementaryRanking = useMemo(() => aggregateWholeElementary(rawRanking), [rawRanking]);
  const filteredRanking = useMemo(() => filterAndRankByGrade(rawRanking, gradeFilter), [rawRanking, gradeFilter]);
  const lowestPerforming = useMemo(() => getLowestPerforming(wholeElementaryRanking, 3), [wholeElementaryRanking]);
  return {
    term, setTerm, gradeFilter, setGradeFilter,
    termOptions: reads.terms ?? [], gradeOptions: reads.filters ?? [],
    wholeElementaryRanking, filteredRanking, lowestPerforming,
    loading: reads.loading, error: reads.error, retry: reads.retry,
    cachedOffline: reads.cachedOffline, dataScope: reads.dataScope,
  };
}
