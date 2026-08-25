import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Quarter,
  ProgressReportData,
  QuarterlyAverageEntry,
  HolisticAssessmentEntry,
  AttendanceQuarterEntry,
} from "../types/types";
import { mockProgressReportData } from "../data/mockData";

interface ProgressReportContextValue {
  data: ProgressReportData;
  selectedQuarter: Quarter;
  setSelectedQuarter: (quarter: Quarter) => void;
  currentQuarterlyAverage: QuarterlyAverageEntry | undefined;
  currentHolisticAssessment: HolisticAssessmentEntry | undefined;
  currentAttendance: AttendanceQuarterEntry | undefined;
}

const ProgressReportContext = createContext<ProgressReportContextValue | undefined>(undefined);

interface ProgressReportProviderProps {
  children: ReactNode;
  data?: ProgressReportData;
}

export function ProgressReportProvider({ children, data = mockProgressReportData }: ProgressReportProviderProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("Q1");

  const currentQuarterlyAverage = useMemo(
    () => data.quarterlyAverages.find((q) => q.quarter === selectedQuarter),
    [data.quarterlyAverages, selectedQuarter],
  );

  const currentHolisticAssessment = useMemo(
    () => data.holisticAssessments.find((h) => h.quarter === selectedQuarter),
    [data.holisticAssessments, selectedQuarter],
  );

  const currentAttendance = useMemo(
    () => data.attendanceByQuarter.find((a) => a.quarter === selectedQuarter),
    [data.attendanceByQuarter, selectedQuarter],
  );

  const value: ProgressReportContextValue = {
    data,
    selectedQuarter,
    setSelectedQuarter,
    currentQuarterlyAverage,
    currentHolisticAssessment,
    currentAttendance,
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