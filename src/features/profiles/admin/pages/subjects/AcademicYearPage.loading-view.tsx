import { ConfirmationModal } from "@shared/components/ConfirmationModal";
import { useActionConfirmation } from "@shared/components/useActionConfirmation";
import { useToast } from "@shared/context/ToastContext";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { ArrowLeft } from "lucide-react";
import { useCallback,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../AdminLayout";
import { AcademicYearCard } from "./components/AcademicYearCard";
import { EditAcademicYearModal } from "./components/EditAcademicYearModal";
import { EditTermDatesModal } from "./components/EditTermDatesModal";
import { TermsTable } from "./components/TermsTable";
import {
addAcademicYear,
fetchActiveAcademicYear,
fetchTerms,
saveTerms as saveTermsRequest,
type TermInput,
} from "./services/academicyear.service";
import type { AcademicYear,SchoolYearStatus,Term } from "./types/academicyear";

export interface AcademicYearData {
 academicYear:AcademicYear|null;terms:Term[];loading:boolean;error:string|null;retry:()=>Promise<void>;
 addYear:typeof addAcademicYear;saveTerms:typeof saveTermsRequest;refreshYear:()=>Promise<AcademicYear>;
}
function useAcademicYearPageState(data?:AcademicYearData) {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const [localAcademicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [localTerms, setTerms] = useState<Term[]>([]);
  const [localLoading, setLoading] = useState(true);
  const [localLoadError, setLoadError] = useState<string | null>(null);
  const academicYear=data?data.academicYear:localAcademicYear,terms=data?.terms??localTerms,loading=data?.loading??localLoading,loadError=data?data.error:localLoadError;

  const { confirmAction, confirmationDialog } = useActionConfirmation(darkMode);
  const { showToast } = useToast();
  const [editingYear, setEditingYear] = useState(false);
  const [editingTerms, setEditingTerms] = useState(false);

  const [transitionCompleted, setTransitionCompleted] = useState(false);
  const [savingYear, setSavingYear] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const loadAcademicYear = useCallback(async () => {
    if(data){await data.retry();return;}
    setLoading(true);
    setLoadError(null);
    try {
      const year = await fetchActiveAcademicYear();
      setAcademicYear(year);
      const yearTerms = await fetchTerms(year.id);
      setTerms(yearTerms);
    } catch (err) {
      console.error("Failed to load academic year:", err);
      setLoadError(
        err instanceof Error ? err.message : "Failed to load academic year.",
      );
    } finally {
      setLoading(false);
    }
  }, [data]);

  async function saveAcademicYear(newYear: {
    label: string;
    status: SchoolYearStatus;
  }) {
    setSavingYear(true);
    setYearError(null);
    try {
      const savedYear = await (data?.addYear??addAcademicYear)(newYear);
      if (newYear.status === "Active" && savedYear.transition) setTransitionCompleted(true);
      // Refresh the active readers without discarding the result acknowledgement.
      await loadAcademicYear();
      setEditingYear(false);
      setSavingYear(false);
      showToast("Academic year saved.");
    } catch (err) {
      console.error("Failed to add academic year:", err);
      setYearError(
        err instanceof Error ? err.message : "Failed to add academic year.",
      );
      setSavingYear(false);
      throw err;
    }
  }

  async function saveTermDates(updatedTerms: TermInput[]) {
    if (!academicYear) return;
    setSavingTerms(true);
    setTermsError(null);
    try {
      const saved = await (data?.saveTerms??saveTermsRequest)(academicYear.id, updatedTerms);
      setTerms(saved);
      setEditingTerms(false);
      showToast("Term dates updated.");
      try {
        const refreshedYear = await (data?.refreshYear??fetchActiveAcademicYear)();
        setAcademicYear(refreshedYear);
      } catch { showToast("Term dates were saved, but the year summary could not refresh. Reload this page.", "error"); }
    } catch (err) {
      console.error("Failed to save term dates:", err);
      setTermsError(
        err instanceof Error ? err.message : "Failed to save term dates.",
      );
      throw err;
    } finally {
      setSavingTerms(false);
    }
  }

  // ── Shared design tokens (same as StudentFormPage) ──
  const stateCardClasses = `rounded-[12px] border shadow-xs p-12 text-center transition-all ${panelBg} ${panelBorder}`;

  return { content: ((
    <div className="w-full min-h-full space-y-6 pb-12">
      {transitionCompleted && <ConfirmationModal title="School Year Transition Completed" description="The new academic year is now active. You can assign students to their respective sections." darkMode={darkMode} confirmLabel="Assign Sections" cancelLabel="Later" onClose={() => setTransitionCompleted(false)} onConfirm={() => { setTransitionCompleted(false); navigate('/admin/classes/section-assignment'); }} />}
      {confirmationDialog}
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/subjects")}
            aria-label="Go back to academics"
            className="system-back-button"
          >
            <ArrowLeft />
          </button>
          <div>
            <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="academicyearpage-academic-year" data-sk-static="">
              Academic Year
            </h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`} data-sk-region="academicyearpage-manage-school-years-grading-periods-and-term-" data-sk-static="">
              Manage school years, grading periods, and term settings.
            </p>
          </div>
        </div>

      </div>

      {loadError || (!loading && !academicYear) ? (
        <div className={stateCardClasses}><LoadingRegion loading={false} error={loadError ?? "No active academic year found."} retry={loadAcademicYear} skeleton={null}>{null}</LoadingRegion></div>
      ) : (
        <>
          <AcademicYearCard
            loading={loading}
            academicYear={academicYear ?? {id:0,label:"",startDate:null,endDate:null,status:"Inactive"}}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onEdit={() => setEditingYear(true)}
          />

          <TermsTable
            loading={loading} view="admin/academic-year/active"
            terms={terms}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onEdit={() => setEditingTerms(true)}
          />

          {editingYear && academicYear && (
            <EditAcademicYearModal
              academicYear={academicYear}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              onClose={() => {
                setEditingYear(false);
                setYearError(null);
              }}
              onSave={value => confirmAction({ title: "Change academic year?", description: `Save ${value.label} with status ${value.status}? This changes the academic-year context used by school records.`, confirmLabel: "Save academic year", action: () => saveAcademicYear(value) })}
              saving={savingYear}
              error={yearError}
            />
          )}

          {editingTerms && (
            <EditTermDatesModal
              terms={terms}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              onClose={() => {
                setEditingTerms(false);
                setTermsError(null);
              }}
              onSave={value => confirmAction({ title: "Update term dates?", description: `Save these dates for ${academicYear?.label}? Term dates affect attendance and report availability. ${value.map(term => `Term ${term.termNumber}: ${term.startDate} to ${term.endDate}`).join("; ")}`, confirmLabel: "Save term dates", action: () => saveTermDates(value) })}
              saving={savingTerms}
              error={termsError}
            />
          )}
        </>
      )}
    </div>
  )), scope: { loadAcademicYear } };
}


export type AcademicYearPageEffectScope = ReturnType<typeof useAcademicYearPageState>["scope"];
export type AcademicYearPageRouteProps = Record<string, never>;
export function AcademicYearPageComposition(props: object & {data?:AcademicYearData; effects?: (scope: AcademicYearPageEffectScope) => import("react").ReactNode }) {
 const state = useAcademicYearPageState(props.data);
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
