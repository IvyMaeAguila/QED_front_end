import { rememberRows } from "@shared/loading/reservations";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import {lazy,Suspense} from "react";
import {useRoutePreview} from "@shared/loading/RoutePreview";
import { WholeChildSnapshot } from "./components/weeklyReport";
import { SnapshotThemeProvider } from "./context/SnapshotThemeContext";
import {
  type StudentWeeklyEvaluationResponse,
} from "./service/weeklyHolistic.service";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../Student/GlobalTypes/types";

export interface HolisticTabProps {
  /** Current grading term/period (termNumber). Change this when the term switches
   * (e.g. Term 1 → Term 2) — HolisticTab refetches and the date-button selection
   * resets automatically. */
  termKey: string | number;
  student: DetailStudent;
  theme: AdminThemeContext;
}

export function HolisticTabView({ termKey, student, theme,reader }: HolisticTabProps&{reader:{data?:StudentWeeklyEvaluationResponse;loading:boolean;error:string|null;retry:()=>void}}) {
  const { textPrimary } = theme;
  const data=reader.data,loading=reader.loading,error=reader.error;

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`qed-type-page-title sm:hidden ${textPrimary}`}>
        Holistic Development
      </h1>
      <SnapshotThemeProvider value={theme}>
        <LoadingRegion name="parent-weekly-holistic" loading={loading} onSettled={() => rememberRows(`parent-weekly:${student.id}:${termKey}`,data?.subjects.length ?? 0)} error={error} retry={reader.retry} variable skeleton={null} frame={(pending) => (
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

const Queries=lazy(()=>import('../../../query/ParentWeeklyQueries'));
export default function HolisticTab(props:HolisticTabProps){const preview=useRoutePreview();const fallback=<HolisticTabView {...props} reader={{loading:true,error:null,retry:()=>{}}}/>;return preview?fallback:<Suspense fallback={fallback}><Queries {...props}/></Suspense>;}
