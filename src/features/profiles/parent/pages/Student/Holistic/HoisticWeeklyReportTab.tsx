import { useEffect, useState } from "react";
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
  const { textPrimary, textMuted, panelBorder } = theme;
  const [data, setData] = useState<StudentWeeklyEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [student.id, termKey]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`text-lg font-bold sm:hidden ${textPrimary}`}>
        Holistic Development
      </h1>
      <SnapshotThemeProvider value={theme}>
        {loading ? (
          <div className={`rounded-2xl border p-8 text-center text-sm font-semibold ${textMuted} ${panelBorder}`}>
            Loading holistic evaluation…
          </div>
        ) : error ? (
          <div className={`rounded-2xl border p-8 text-center text-sm font-semibold text-red-500 ${panelBorder}`}>
            {error}
          </div>
        ) : (
          <WholeChildSnapshot
            {...data!.current}
            history={data!.history}
            termKey={termKey}
            student={student}
          />
        )}
      </SnapshotThemeProvider>
    </div>
  );
}