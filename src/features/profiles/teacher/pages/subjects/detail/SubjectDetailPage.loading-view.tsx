import { useUnsavedChanges } from "@shared/components/useUnsavedChanges";
import {useTeacherAcademicServices} from '../../../query/TeacherAcademicQueryContext';
import {useAuth} from '@shared/hooks/useAuth';
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { GradeTemplateStructure } from "../../../../shared/grading/gradeTemplate.types";
import { AssessmentTab } from "./components/AssessmentTab";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { HolisticTab } from "./components/HolisticTab";
import { TabNav,type SubjectDetailTab } from "./components/TabNav";
import type { RosterStudent } from "./data";
import type {
GradeItem,
GradingPeriod,
HolisticAxisKey,
HolisticMap,
ScoreMap,
} from "./types/Grading";

function currentSchoolYearLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 5 ? year : year - 1;
  return `School Year ${startYear}-${startYear + 1}`;
}

function useSubjectDetailPageState() {
  const {grading}=useTeacherAcademicServices();
  const {addItem:addItemApi,deleteItem,saveScore,saveHolistic}=grading;
  const {sessionScope,user}=useAuth();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();

  const [attempt, setAttempt] = useState(0);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SubjectDetailTab>("writtenWorks");

  const [subjectName, setSubjectName] = useState<string>("");

  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);

  // Whether the logged-in teacher is this section's own adviser (drives
  // hiding "Submit Grades" on AssessmentRecordsSection), plus that
  // section's adviser's display name for the confirm-submit copy when
  // it's false. Both come from the backend via fetchSubjectSectionInfo —
  // the frontend has no independent way to know this.
  const [isOwnAdvisory, setIsOwnAdvisory] = useState(false);
  const [adviserName, setAdviserName] = useState<string | null>(null);

  const [items, setItems] = useState<GradeItem[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [holistic, setHolistic] = useState<HolisticMap>({});
  const [holisticWeekStartDate, setHolisticWeekStartDate] =
    useState<string>("");
  const [holisticTermNumber] = useState(1);
  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<GradeTemplateStructure | undefined>();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { navigationDialog, allowNavigation } = useUnsavedChanges(hasUnsavedChanges, darkMode);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function guardedNavigate(action: () => void) {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    setPendingAction(() => action);
  }

  function handleBack() {
    guardedNavigate(() => navigate(-1));
  }

  function handleTabChange(next: SubjectDetailTab) {
    guardedNavigate(() => setActiveTab(next));
  }

  async function handleAddItem(item: GradeItem) {
    if (!subjectId) return;
    try {
      const { id } = await addItemApi(subjectId, {
        tab: item.tab,
        date: item.date,
        activityName: item.activityName,
        topic: item.topic,
        topicId: item.topicId,
        format: item.format,
        examType: item.examType,
        maxItems: item.maxItems,
        term: selectedTerm,
        templateDomainId: item.templateDomainId,
      });
      setItems((prev) => {
        const next = [...prev, { ...item, id, gradingPeriodId: selectedTerm }];
        return next;
      });
    } catch (err) {
      console.error("Failed to add item:", err);
      throw err instanceof Error ? err : new Error("Could not save the assessment item. Please try again.");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!subjectId) throw new Error("No subject selected.");
    await deleteItem(subjectId, itemId);
    setItems(previous => previous.filter(item => item.id !== itemId));
  }

  async function handleScoreChange(
    studentId: string,
    itemId: string,
    value: number | null,
  ) {


    if (!subjectId) return;
    try {
      await saveScore(subjectId, studentId, itemId, value);
    setScores((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...prev[studentId], [itemId]: value },
      };
      return next;
    });
    } catch (err) {
      console.error("Failed to save score:", err);
      throw err;
    }
  }

  async function handleHolisticRate(
    studentId: string,
    axis: HolisticAxisKey,
    value: number,
  ) {
    if (!subjectId) throw new Error("No subject selected.");
    await saveHolistic(subjectId, studentId, axis, value, holisticTermNumber);
    setHolistic(prev => ({ ...prev, [studentId]: { ...prev[studentId], [axis]: value } }));
  }

  function openRecords() {
    guardedNavigate(() => {
      navigate(`/teacher/subjects/${subjectId}/records`, {
        state: {
          queryOwner:{session:sessionScope,role:user?.role,user:String(user?.id??'')},
          subjectName,
          gradeLevel,
          tab: activeTab,
          roster,
          items,
          scores,
          holistic,
          terms,
          selectedTerm,
          isOwnAdvisory,
          adviserName,
        },
      });
    });
  }

  if (!subjectId) {
    return { content: ((
      <div className={`w-full min-h-full ${textPrimary}`}>
      {navigationDialog}
        No subject selected.
      </div>
    )), scope: { subjectId, setTemplateLoading, selectedTerm, setTemplateStructure, hasUnsavedChanges, attempt, setSubjectName, setGradeLevel, setRoster, setItems, setScores, setHolistic, setHolisticWeekStartDate, setTerms, setSelectedTerm, setIsOwnAdvisory, setAdviserName, setLoading, setError } };
  }

  const holisticLocked = [0, 6].includes(new Date().getDay());

  return { content: ((
    <div className="w-full min-h-full pb-0">
      {navigationDialog}
      <div className="w-full space-y-6">
        <div className="flex items-start gap-2.5">
          <button
            onClick={handleBack}
            aria-label="Go back"
            className={`system-back-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${panelBg} ${panelBorder} ${textMuted} ${
              darkMode ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5 hover:text-black"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1
              className={`qed-type-page-title ${textPrimary}`}
            >
              {error ? subjectName : <LoadingRegion as="span" loading={loading} variable name="subject-title" skeleton={<SkeletonParagraph field={`subject-${subjectId}-title`} typical={2} />}><span data-sk-field={`subject-${subjectId}-title`} data-sk-variable="">{subjectName}</span></LoadingRegion>}
            </h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
              {currentSchoolYearLabel()}
            </p>
          </div>
        </div>

        <TabNav
          active={activeTab}
          onChange={handleTabChange}
          darkMode={darkMode}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />

        {error && <LoadingRegion loading={false} error={error} retry={() => setAttempt(value => value + 1)} skeleton={null} name="subject-error">{null}</LoadingRegion>}

        {!error && (activeTab === "writtenWorks" ||
          activeTab === "performanceTask" ||
          activeTab === "exams") && (
          <AssessmentTab
            loading={loading}
            templateLoading={templateLoading}
            subjectSectionId={subjectId}
            subjectName={subjectName}
            tab={activeTab}
            roster={roster}
            items={items}
            scores={scores}
            terms={terms}
            selectedTerm={selectedTerm}
            onTermChange={setSelectedTerm}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onScoreChange={handleScoreChange}
            onOpenRecords={openRecords}
            onDirtyChange={setHasUnsavedChanges}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            templateDomains={activeTab === "writtenWorks"
              ? templateStructure?.ww.domains
              : activeTab === "performanceTask"
                ? templateStructure?.pt.domains
                : []}
            examTypes={templateStructure?.examinations?.enabled
              ? (templateStructure.examinations.components.some((component) => component.key.toUpperCase() === "ALL")
                ? ["TE"]
                : templateStructure.examinations.components.map((component) => component.key as "ST1" | "ST2" | "TE"))
              : undefined}
          />
        )}

        {!error && activeTab === "holistic" && (
          <HolisticTab
            loading={loading}
            view={`subject-${subjectId}-holistic`}
            roster={roster}
            ratings={holistic}
            weekStartDate={holisticWeekStartDate}
            termNumber={holisticTermNumber}
            locked={holisticLocked}
            onRate={handleHolisticRate}
            onOpenRecords={openRecords}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        )}

        {pendingAction && (
          <ConfirmDialog
            title="Leave without saving?"
            message="You have scores that haven't been saved yet. If you leave now, those changes will be lost."
            confirmLabel="Leave anyway"
            danger
            onCancel={() => setPendingAction(null)}
            onConfirm={() => {
              allowNavigation();
              const action = pendingAction;
              setPendingAction(null);
              action();
            }}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  )), scope: { subjectId, setTemplateLoading, selectedTerm, setTemplateStructure, hasUnsavedChanges, attempt, setSubjectName, setGradeLevel, setRoster, setItems, setScores, setHolistic, setHolisticWeekStartDate, setTerms, setSelectedTerm, setIsOwnAdvisory, setAdviserName, setLoading, setError } };
}


export type SubjectDetailPageEffectScope = ReturnType<typeof useSubjectDetailPageState>["scope"];
export type SubjectDetailPageRouteProps = Record<string, never>;
export function SubjectDetailPageComposition(props: object & { effects?: (scope: SubjectDetailPageEffectScope) => import("react").ReactNode }) {
 const state = useSubjectDetailPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
