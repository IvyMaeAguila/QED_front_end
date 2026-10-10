import { rememberRows } from "@shared/loading/reservations";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { WholeChildSnapshot } from "./components/weeklyReport";
import { SnapshotThemeProvider } from "./context/SnapshotThemeContext";
import {
  fetchStudentWeeklyEvaluation,
  type StudentWeeklyEvaluationResponse,
} from "./service/weeklyHolistic.service";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../Student/GlobalTypes/types";

interface HolisticTabProps {
  /** Current grading term/period (termNumber). Change this when the term switches
   * (e.g. Term 1 → Term 2) — HolisticTab refetches and the date-button selection
   * resets automatically. */
  termKey: string | number;
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function HolisticTab({ termKey, student, theme }: HolisticTabProps) {
  const { textPrimary } = theme;
  const [data, setData] = useState<StudentWeeklyEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStudentWeeklyEvaluation(student.id, termKey)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load holistic evaluation.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [student.id, termKey, attempt]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`qed-type-page-title sm:hidden ${textPrimary}`}>
        Holistic Development
      </h1>
      <SnapshotThemeProvider value={theme}>
        <LoadingRegion name="parent-weekly-holistic" loading={loading} onSettled={() => rememberRows(`parent-weekly:${student.id}:${termKey}`,data?.subjects.length ?? 0)} error={error} retry={() => setAttempt(n=>n+1)} variable skeleton={null} frame={(pending) => (
          <WholeChildSnapshot
            {...(data?.current ?? {domainAverages:{cognitive:null,emotional:null,behavioral:null,social:null},evaluationCount:0,lastEvaluation:null,riskLevel:"NONE" as const})}
            loading={pending} viewKey={`parent-weekly:${student.id}:${termKey}`}
            history={data?.history}
            subjects={data?.subjects}
            termKey={termKey}
            student={student}
          />
        )}>{null}</LoadingRegion>
      </SnapshotThemeProvider>
    </div>
  );
}
