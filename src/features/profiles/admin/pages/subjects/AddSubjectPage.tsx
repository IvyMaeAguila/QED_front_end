import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BookOpen,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import type { AdminThemeContext } from "./../AdminLayout";
import { ACCENT, GRADE_LEVEL_IDS, type GradeLevel } from "./types/types";
import { useGradeLevels } from "./context/gradeLevelsContext";
import { useSubjectsCatalog } from "./context/SubjectsCatalogContext";
import { useSubjectSections } from "./context/SubjectSectionsContext";
import { DEFAULT_ASSESSMENT_TYPES } from "./types/assessmentTypes";
import { useSettings } from "./../settings/context/SettingsContext";
import { addSubject as addSubjectApi } from "./services/subject.service";
import { uploadGradeTemplate } from "./services/subjectGradeTemplate.service";
import {
  parseGradeTemplate,
  type ParsedGradeTemplate,
} from "./services/gradeTemplateParser.service";

// Self-contained modal built for the admin theme — see AdminFeedbackModal.tsx.
import AdminFeedbackModal from "../../modal/adminFeedbackModal";

// Category names must match how assessmentTypes are named in the catalog,
// since weightDistribution below is derived FROM the parsed .xlsx (not
// typed manually) and still needs to map onto assessment_type_id for the
// existing addSubjectApi contract.
const [WW_CATEGORY_NAME, PT_CATEGORY_NAME, EX_CATEGORY_NAME] =
  DEFAULT_ASSESSMENT_TYPES.map((type) => type.name);

function formatGroup(group: ParsedGradeTemplate["ww"]): string {
  if (group.domains.length === 1) return `${group.weightPercent}%`;
  const parts = group.domains.map((d) => `${d.label} ${d.weightPercent}%`);
  return `${group.weightPercent}% (${parts.join(" + ")})`;
}

export function AddSubjectPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();

  const { schoolYear } = useSettings();
  const { gradeLevels, loading: loadingGradeLevels } = useGradeLevels();
  const { getSubjectsForGrade, addLocalSubject } = useSubjectSections();
  const { assessmentTypes, loadAssessmentTypes } = useSubjectsCatalog();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [name, setName] = useState("");
  const [isGraded, setIsGraded] = useState<boolean | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // The subject's actual grading structure now comes from the official
  // DepEd .xlsx it was created with — not typed weight percentages. This
  // mirrors the same client-preview-then-server-reparse pattern used in
  // SubjectGradeTemplateSection, just at creation time instead of as a
  // later per-subject step.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = useState<ParsedGradeTemplate | null>(null);
  const [templateParsing, setTemplateParsing] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Replaces native alert() for success/error feedback. onCloseAction lets
  // the success case navigate away only after the user dismisses the modal.
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    onCloseAction?: () => void;
  }>({ open: false, variant: "success", title: "", message: "" });

  function closeFeedbackModal() {
    const action = feedbackModal.onCloseAction;
    setFeedbackModal((prev) => ({ ...prev, open: false }));
    action?.();
  }

  useEffect(() => {
    void loadAssessmentTypes();
  }, [loadAssessmentTypes]);

  useEffect(() => {
    setName("");
    setIsGraded(null);
    setTemplateFile(null);
    setTemplateFileName(null);
    setTemplatePreview(null);
    setTemplateError(null);
  }, [gradeLevel]);

  function handleGradeChange(grade: string) {
    setGradeLevel(grade as GradeLevel | "");
  }

  function handleGradingTypeChange(graded: boolean) {
    setIsGraded(graded);
    setTemplateFile(null);
    setTemplateFileName(null);
    setTemplatePreview(null);
    setTemplateError(null);
  }

  async function processTemplateFile(file: File) {
    setTemplateFileName(file.name);
    setTemplatePreview(null);
    setTemplateError(null);
    setTemplateParsing(true);
    try {
      const parsed = await parseGradeTemplate(file);
      setTemplatePreview(parsed);
      setTemplateFile(file);
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Could not read that file.",
      );
      setTemplateFile(null);
    } finally {
      setTemplateParsing(false);
    }
  }

  function handleTemplateInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processTemplateFile(file);
  }

  function handleTemplateDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (templateParsing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processTemplateFile(file);
  }

  function handleTemplateDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!templateParsing) setIsDragOver(true);
  }

  function handleTemplateDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;
  const subCardClasses = `rounded-xl border p-4 space-y-3 ${darkMode ? "border-[#374151] bg-[#0B1120]/60" : "border-[#E5E7EB] bg-[#F8FAFC]"}`;
  const subCardLabelClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${textPrimary}`;

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${darkMode ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]" : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"}`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed placeholder:text-current`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;
  const noGradeSelected = gradeLevel === "";
  const trimmedName = name.trim();

  const gradeSubjects = gradeLevel === "" ? [] : getSubjectsForGrade(gradeLevel);

  const isDuplicate =
    !noGradeSelected &&
    trimmedName !== "" &&
    gradeSubjects.some(
      (s) =>
        s.gradeLevel === gradeLevel &&
        s.schoolYear === schoolYear &&
        s.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

  const noGradingTypeSelected = isGraded === null;

  // The template is only relevant (and required) for graded subjects.
  const templateActive = isGraded === true;
  const templateSatisfied = !templateActive || (templateFile !== null && templatePreview !== null);

  const canSubmit =
    !isSubmitting &&
    !templateParsing &&
    !noGradeSelected &&
    trimmedName !== "" &&
    !isDuplicate &&
    !noGradingTypeSelected &&
    templateSatisfied;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (gradeLevel === "" || !canSubmit) return;

    setIsSubmitting(true);
    try {
      // For graded subjects, derive the flat WW/PT/EX percentages from the
      // parsed template so the existing subject/weightDistribution
      // contract still gets sensible top-level numbers, even though the
      // real domain-level detail lives in the uploaded template itself
      // (persisted separately below via uploadGradeTemplate).
      const mappedWeightDistribution =
        isGraded && templatePreview
          ? [
              {
                assessment_type_id:
                  assessmentTypes.find(
                    (t) => t.assessmentName.trim().toLowerCase() === WW_CATEGORY_NAME.toLowerCase(),
                  )?.id ?? 0,
                weight_percent: templatePreview.ww.weightPercent,
                order_index: 0,
              },
              {
                assessment_type_id:
                  assessmentTypes.find(
                    (t) => t.assessmentName.trim().toLowerCase() === PT_CATEGORY_NAME.toLowerCase(),
                  )?.id ?? 0,
                weight_percent: templatePreview.pt.weightPercent,
                order_index: 1,
              },
              {
                assessment_type_id:
                  assessmentTypes.find(
                    (t) => t.assessmentName.trim().toLowerCase() === EX_CATEGORY_NAME.toLowerCase(),
                  )?.id ?? 0,
                weight_percent: templatePreview.examWeightPercent,
                order_index: 2,
              },
            ]
          : [];

      if (isGraded && mappedWeightDistribution.some((weight) => weight.assessment_type_id <= 0)) {
        throw new Error(
          "The assessment type catalog is missing Written/Oral Works (WW), Product/Performance Tasks (PT), or Examinations (EX). Add those categories before creating a graded subject.",
        );
      }

      const row = await addSubjectApi({
        gradeLevelId: GRADE_LEVEL_IDS[gradeLevel],
        subjectName: trimmedName,
        isGraded: isGraded === true,
        schoolYear,
        weightDistribution: mappedWeightDistribution,
      });

      // Persist the actual uploaded .xlsx so the backend re-parses and
      // stores the full structure (domains, ST1/ST2/TE sub-weights,
      // transmutation + descriptor tables) — this is what makes
      // AssessmentRecordsSection later render the subject's real columns
      // instead of falling back to a flat layout.
      if (isGraded && templateFile) {
        await uploadGradeTemplate(row.id, templateFile);
      }

      addLocalSubject({
        name: trimmedName,
        gradeLevel,
        isGraded: isGraded === true,
        schoolYear,
        status: "Active",
        weightDistribution: [],
        section: "",
        teacherId: null,
        id: String(row.id),
      });

      setFeedbackModal({
        open: true,
        variant: "success",
        title: "Subject Added",
        message: `"${trimmedName}" was added successfully.`,
        onCloseAction: () => navigate("/admin/subjects"),
      });
    } catch (err) {
      console.error("Failed to add subject:", err);
      setFeedbackModal({
        open: true,
        variant: "error",
        title: "Couldn't Save Subject",
        message: err instanceof Error ? err.message : "Failed to add subject.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full mt-6 space-y-6 pb-12 px-4 sm:px-6">
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/subjects")}
              disabled={isSubmitting}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "border-[#374151] hover:bg-white/10 text-white"
                  : "border-[#E5E7EB] hover:bg-[#F6F7FB] text-[#374151]"
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <h2 className={sectionTitleClasses}>
              <BookOpen size={15} style={{ color: ACCENT }} />
              Add New Subject
            </h2>
          </div>
          <span className={`text-xs font-semibold ${textMuted}`}>
            This subject will be assigned the next available ID
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        <div className="space-y-5 min-w-0">
          <div className="space-y-5">
            <div>
              <label className={labelClasses}>Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => handleGradeChange(e.target.value)}
                disabled={isSubmitting || loadingGradeLevels}
                className={inputClasses}
              >
                <option value="">
                  {loadingGradeLevels
                    ? "Loading…"
                    : gradeLevels.length === 0
                      ? "No grade levels found"
                      : "Select grade level…"}
                </option>
                {gradeLevels.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Subject Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || noGradeSelected}
                placeholder={
                  noGradeSelected
                    ? "Select a grade level first"
                    : "e.g. Filipino, MAPEH"
                }
                className={noGradeSelected ? disabledInputClasses : inputClasses}
              />
              {isDuplicate && (
                <p className="mt-1 text-[11px] font-semibold text-[#B91C1C]">
                  This subject is already available
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Grading Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGradingTypeChange(true)}
                  disabled={isSubmitting || noGradeSelected}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isGraded === true ? "text-white border-transparent" : darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
                  style={isGraded === true ? { background: ACCENT } : undefined}
                >
                  Graded
                </button>

                <button
                  type="button"
                  onClick={() => handleGradingTypeChange(false)}
                  disabled={isSubmitting || noGradeSelected}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isGraded === false ? "text-white border-transparent" : darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
                  style={isGraded === false ? { background: ACCENT } : undefined}
                >
                  Non-graded
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${subCardClasses} lg:sticky lg:top-6`}>
          <div className="flex items-center justify-between">
            <span className={subCardLabelClasses}>
              <FileSpreadsheet size={14} style={{ color: ACCENT }} />
              Official DepEd Grade Template
            </span>
            {templateActive && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#B91C1C]">
                Required
              </span>
            )}
          </div>

          <div className={templateActive ? "" : "opacity-50"}>
            <p className={`text-xs leading-relaxed ${textMuted} mb-3`}>
              {templateActive
                ? "Upload the official DepEd Electronic Class Record (.xlsx) for this subject. Its WW/PT/Exam weights, any domain breakdown (e.g. Cognitive/Affective/Behavioral), and ST1/ST2/TE sub-weights become this subject's grading structure — the records page will follow these exact columns."
                : "Select \"Graded\" as the grading type to enable the template upload."}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              disabled={templateParsing || !templateActive}
              onChange={handleTemplateInputChange}
              className="hidden"
            />

            <div
              onClick={() =>
                templateActive &&
                !templateParsing &&
                fileInputRef.current?.click()
              }
              onDragOver={(e) => templateActive && handleTemplateDragOver(e)}
              onDragLeave={handleTemplateDragLeave}
              onDrop={(e) => templateActive && handleTemplateDrop(e)}
              className={`rounded-xl border-2 border-dashed py-8 px-4 flex flex-col items-center justify-center gap-2.5 text-center transition-colors ${
                !templateActive || templateParsing
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer"
              } ${
                isDragOver && templateActive
                  ? "border-[#2F6FED] bg-[#2F6FED]/5"
                  : darkMode
                    ? "border-[#374151] bg-[#0B1120]"
                    : "border-[#D1D5DB] bg-white"
              }`}
            >
              {templateParsing ? (
                <Loader2 size={26} className="animate-spin text-[#2F6FED]" />
              ) : (
                <Upload size={26} className="text-[#2F6FED]" strokeWidth={2} />
              )}

              <p className={`text-sm font-bold ${textPrimary}`}>
                {templateParsing
                  ? "Reading template…"
                  : templateActive
                    ? "Drag the .xlsx here"
                    : "Upload disabled"}
              </p>

              {templateActive && !templateParsing && (
                <>
                  <span className={`text-xs ${textMuted}`}>or</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="h-9 px-6 rounded-full text-xs font-bold text-white bg-[#2F6FED] hover:bg-[#2557C7] transition-colors"
                  >
                    Browse
                  </button>
                </>
              )}
            </div>

            {templateFileName && (
              <div
                className={`flex items-center gap-2 text-xs font-semibold mt-3 ${
                  templateParsing
                    ? textMuted
                    : templatePreview
                      ? "text-[#15803D]"
                      : "text-[#B91C1C]"
                }`}
              >
                {!templateParsing &&
                  (templatePreview ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  ))}
                <span className="truncate">{templateFileName}</span>
              </div>
            )}

            {templateError && (
              <p className="text-[11px] font-semibold text-[#B91C1C] mt-2">
                {templateError}
              </p>
            )}

            {templatePreview && !templateError && (
              <div className="text-xs space-y-1 mt-3 pt-3 border-t border-current/10">
                <p className={textPrimary}>WW: {formatGroup(templatePreview.ww)}</p>
                <p className={textPrimary}>PT: {formatGroup(templatePreview.pt)}</p>
                <p className={textPrimary}>Exam: {templatePreview.examWeightPercent}%</p>
                <p className={textMuted}>
                  Exam sub-weights — ST1: {templatePreview.examSubWeights.st1}% · ST2:{" "}
                  {templatePreview.examSubWeights.st2}% · TE: {templatePreview.examSubWeights.te}%
                </p>
              </div>
            )}

            {templateActive && !templatePreview && !templateParsing && !templateError && (
              <p className="text-[11px] font-semibold text-[#B91C1C] mt-3">
                You must upload a valid DepEd .xlsx template before you can
                add this subject.
              </p>
            )}
          </div>
        </div>
        </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/subjects")}
              disabled={isSubmitting}
              className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`h-10 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 transition-colors ${
                !canSubmit ? "opacity-50 cursor-not-allowed" : "hover:bg-[#6B0000]"
              }`}
              style={{ background: ACCENT }}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Saving..." : "Add Subject"}
            </button>
          </div>
        </form>
      </section>

      <AdminFeedbackModal
        open={feedbackModal.open}
        onClose={closeFeedbackModal}
        title={feedbackModal.title}
        message={feedbackModal.message}
        darkMode={darkMode}
        icon={
          feedbackModal.variant === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )
        }
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closeFeedbackModal}
            className="h-9 px-4 rounded-xl text-xs font-bold text-white transition-colors hover:bg-[#6B0000]"
            style={{ background: ACCENT }}
          >
            OK
          </button>
        </div>
      </AdminFeedbackModal>
    </div>
  );
}
