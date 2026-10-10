import { AccountSelect } from "@shared/components/AccountSelect";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { useState, useMemo } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Pencil, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import {
  ACCENT,
  GRADE_LEVELS,
  type Subject,
  type SubjectsTheme,
  type WeightDistributionItem,
} from "../types/types";
import { useSections } from "../context/SectionsContext";
import { useSubjectsCatalog } from "../context/SubjectsCatalogContext";
import { ModalShell } from "./ModalShell";
import { SubjectGradeTemplateSection } from "./SubjectGradeTemplateSection";
import {
  canonicalAssessmentTypeName,
  DEFAULT_ASSESSMENT_TYPES,
} from "../types/assessmentTypes";
import {
  getActiveGradeTemplate,
  uploadGradeTemplate,
  type ActiveGradeTemplate,
} from "../services/subjectGradeTemplate.service";
import type { ParsedGradeTemplate } from "../services/gradeTemplateParser.service";
import { fetchAllSchoolYears, type SchoolYearRow } from "../services/academicyear.service";

interface EditSubjectModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onSave: (updates: Partial<Subject>) => void | Promise<void>;
  onManageSections: () => void;
  saving?: boolean;
  error?: string | null;
}

function makeRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random()}`;
}

export function EditSubjectModal({
  subject,
  onClose,
  onSave,
  onManageSections,
  saving: parentSaving = false,
  error = null,
  ...theme
}: EditSubjectModalProps) {
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [processingTemplate, setProcessingTemplate] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{ file: File; preview: ParsedGradeTemplate } | null>(null);
  const [saveTemplateError, setSaveTemplateError] = useState<string | null>(null);
  const saving = parentSaving || savingTemplate;
  const { teachers } = useTeachers();
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();
  const { assessmentTypes, loadAssessmentTypes, loading: loadingCatalog } =
    useSubjectsCatalog();

  const [name, setName] = useState(subject.name);
  const [gradeLevel, setGradeLevel] = useState(subject.gradeLevel);
  const [schoolYear, setSchoolYear] = useState(subject.schoolYear);
  const [teacherId, setTeacherId] = useState(subject.teacherId ?? "");
  const [section, setSection] = useState(subject.section ?? "");
  const [isGraded, setIsGraded] = useState(subject.isGraded);
  const [weights, setWeights] = useState<WeightDistributionItem[]>(
    () => subject.weightDistribution ?? []
  );
  const { darkMode, textMuted } = theme;

  // Official DepEd .xlsx grade template — separate from the manual weight
  // rows above; once uploaded, becomes the source of truth for this subject.
  const [activeTemplate, setActiveTemplate] = useState<ActiveGradeTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(Number(subject.subjectId ?? subject.id)));
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateAttempt, setTemplateAttempt] = useState(0);
  const [schoolYears, setSchoolYears] = useState<SchoolYearRow[]>([]);

  useEffect(() => {
    void loadSectionsForGrade(gradeLevel);
  }, [gradeLevel, loadSectionsForGrade]);

  useEffect(() => {
    let active = true;
    void fetchAllSchoolYears()
      .then((rows) => { if (active) setSchoolYears(rows); })
      .catch((err) => console.error("Failed to load school years:", err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    void loadAssessmentTypes();
  }, [loadAssessmentTypes]);

  useEffect(() => {
    const numericSubjectId = Number(subject.subjectId ?? subject.id);
    if (!numericSubjectId || isNaN(numericSubjectId)) return;
    let active = true;
    setLoadingTemplate(true);
    setTemplateError(null);
    getActiveGradeTemplate(numericSubjectId)
      .then((template) => { if (active) setActiveTemplate(template); })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load active grade template:", err);
        setActiveTemplate(null);
        setTemplateError(err instanceof Error ? err.message : "Failed to load active grade template.");
      })
      .finally(() => { if (active) setLoadingTemplate(false); });
    return () => { active = false; };
  }, [subject.subjectId, subject.id, templateAttempt]);

  // Preview pending weights locally; persist only through Save Changes.
  // A saved template is authoritative for a graded subject. Keep the legacy
  // manual weight rows in sync so the normal Save Changes validation and API
  // payload remain valid, while preserving the assessment type IDs.
  useEffect(() => {
    if ((!activeTemplate && !pendingTemplate) || assessmentTypes.length === 0) return;
    const templateWeights = [
      pendingTemplate?.preview.ww.weightPercent ?? activeTemplate!.wwWeightPercent,
      pendingTemplate?.preview.pt.weightPercent ?? activeTemplate!.ptWeightPercent,
      pendingTemplate?.preview.examWeightPercent ?? activeTemplate!.examWeightPercent,
    ];
    const rows = DEFAULT_ASSESSMENT_TYPES.map((defaultType, index) => {
      const category = assessmentTypes.find(
        (type) => canonicalAssessmentTypeName(type.assessmentName) === defaultType.name,
      );
      return category
        ? {
            id: String(category.id),
            assessmentType: category.assessmentName,
            weight: templateWeights[index],
          }
        : null;
    });
    if (rows.every((row) => row !== null)) {
      setWeights(rows as WeightDistributionItem[]);
    }
  }, [activeTemplate, pendingTemplate, assessmentTypes]);

  const gradeSections = getSectionsForGrade(gradeLevel);
  const sectionOptions =
    section && !gradeSections.some((s) => s.name === section)
      ? [{ id: "current", name: section }, ...gradeSections]
      : gradeSections;

  const totalWeight = useMemo(
    () => weights.reduce((sum, w) => sum + (Number(w.weight) || 0), 0),
    [weights]
  );

  const hasDuplicateType = useMemo(() => {
    const names = weights
      .map((w) => w.assessmentType.trim().toLowerCase())
      .filter((n) => n !== "");
    return new Set(names).size !== names.length;
  }, [weights]);

  const hasUnsetType = weights.some(
    (w) => w.assessmentType.trim() === "" || w.weight <= 0
  );

  // Siguraduhing existing pa rin sa catalog ang bawat napiling type
  const hasUnknownType = useMemo(
    () =>
      weights.some(
        (w) =>
          w.assessmentType.trim() !== "" &&
          !assessmentTypes.some(
            (t) =>
              t.assessmentName.trim().toLowerCase() ===
              w.assessmentType.trim().toLowerCase()
          )
      ),
    [weights, assessmentTypes]
  );

  const allTypesUsed = weights.length >= assessmentTypes.length;

  const weightsValid =
    !isGraded ||
    (weights.length > 0 &&
      totalWeight === 100 &&
      !hasDuplicateType &&
      !hasUnsetType &&
      !hasUnknownType);

  const inputClasses = `w-full h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-maroon-light"
      : "bg-brand-light border-border-subtle text-[#111827] focus:border-maroon-light"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  function updateRow(rowId: string, patch: Partial<WeightDistributionItem>) {
    setWeights((prev) =>
      prev.map((w) => (w.id === rowId ? { ...w, ...patch } : w))
    );
  }

  function addRow() {
    setWeights((prev) => [
      ...prev,
      {
        id: makeRowId(),
        assessmentType: "",
        weight: 0,
      },
    ]);
  }

  function removeRow(rowId: string) {
    setWeights((prev) => prev.filter((w) => w.id !== rowId));
  }

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSave() {
    if (saving || processingTemplate || !weightsValid || !name.trim() || !section.trim() || !schoolYear) return;
    setSavingTemplate(true);
    setSaveTemplateError(null);
    try {
      if (isGraded && pendingTemplate) {
        const saved = await uploadGradeTemplate(Number(subject.subjectId ?? subject.id), pendingTemplate.file);
        setActiveTemplate(saved);
        setPendingTemplate(null);
      }
      await onSave({
        name: name.trim(),
        gradeLevel,
        schoolYear,
        teacherId: teacherId || null,
        section,
        status: subject.status,
        isGraded,
        weightDistribution: isGraded ? weights : [],
      });
    } catch (err) {
      setSaveTemplateError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <ModalShell
      title="Edit Subject"
      icon={Pencil}
      onClose={handleClose}
      closeDisabled={saving}
      size="xl"
      {...theme}
    >
      <p className={`text-xs font-medium leading-relaxed lg:col-span-2 ${textMuted}`}>
        Editing renames the existing curriculum entry — this does not create a
        new subject.
      </p>

      {(error || saveTemplateError) && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold lg:col-span-2 ${
            darkMode
              ? "border-[#7F1D1D] bg-[#7F1D1D]/20 text-[#F87171]"
              : "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{saveTemplateError || error}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-5 ${isGraded ? "lg:grid-cols-2 lg:gap-6" : ""}`}>
      <div className={`space-y-4 ${isGraded ? "lg:col-span-2" : ""}`}>
      <div>
        <label className={labelClasses}>Subject Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} className={saving ? disabledInputClasses : inputClasses} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Grade Level</label>
          <AccountSelect data-account-select="" value={gradeLevel} onChange={(e) => {
            const nextGrade = e.target.value as Subject["gradeLevel"];
            setGradeLevel(nextGrade);
            if (nextGrade !== gradeLevel) setSection("");
          }} disabled={saving} className={saving ? disabledInputClasses : inputClasses}>
            {GRADE_LEVELS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </AccountSelect>
        </div>
        <div>
          <label className={labelClasses}>Section</label>
          <AccountSelect data-account-select=""
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={saving}
            className={saving ? disabledInputClasses : inputClasses}
          >
            <option value="">Select section…</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </AccountSelect>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Assigned Teacher</label>
          <AccountSelect data-account-select=""
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={saving}
            className={saving ? disabledInputClasses : inputClasses}
          >
            <option value="">Not Assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTeacherName(t)}
              </option>
            ))}
          </AccountSelect>
        </div>
        <div>
          <label className={labelClasses}>School Year</label>
          <AccountSelect data-account-select="" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} disabled={saving} className={saving ? disabledInputClasses : inputClasses}>
            {[...new Set([subject.schoolYear, ...schoolYears.map((year) => year.school_year)])].filter(Boolean).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </AccountSelect>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Type</label>
        <AccountSelect data-account-select=""
          value={isGraded ? "graded" : "non-graded"}
          onChange={(e) => setIsGraded(e.target.value === "graded")}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        >
          <option value="graded">Graded</option>
          <option value="non-graded">Non-Graded</option>
        </AccountSelect>
      </div>
      </div>
{isGraded && (
      <div
          className={`rounded-[12px] border p-3 space-y-2.5 ${
            darkMode
              ? "border-[#374151] bg-[#0B1120]/60"
              : "border-border-subtle bg-brand-light"
          }`}
        >
          <div className="flex items-center justify-between">
            <label className={`${labelClasses} mb-0`}>Weight Distribution</label>
            <span
              className={`text-xs font-bold ${
                totalWeight === 100 ? textMuted : "text-[#B91C1C]"
              }`}
            >
              Total: {totalWeight}%
            </span>
          </div>

          {activeTemplate && (
            <p className={`text-xs font-semibold ${textMuted}`}>
              The active Excel template controls these weights. Upload a replacement template to change them.
            </p>
          )}

          {weights.map((row) => {
            const usedByOthers = new Set(
              weights
                .filter((w) => w.id !== row.id)
                .map((w) => w.assessmentType.trim().toLowerCase())
            );
            const isMissingFromCatalog =
              row.assessmentType.trim() !== "" &&
              !assessmentTypes.some(
                (t) =>
                  t.assessmentName.trim().toLowerCase() ===
                  row.assessmentType.trim().toLowerCase()
              );

            return (
              <div key={row.id} className="flex items-center gap-2">
                <AccountSelect data-account-select=""
                  value={row.assessmentType}
                  onChange={(e) =>
                    updateRow(row.id, { assessmentType: e.target.value })
                  }
                  disabled={saving || loadingCatalog || Boolean(activeTemplate || pendingTemplate)}
                  className={`${
                    saving ? disabledInputClasses : inputClasses
                  } flex-1`}
                >
                  <option value="">
                    {loadingCatalog ? "Loading types…" : "Select type…"}
                  </option>

                  {isMissingFromCatalog && (
                    <option value={row.assessmentType}>
                      {row.assessmentType} (unavailable)
                    </option>
                  )}

                  {assessmentTypes.map((t) => (
                    <option
                      key={t.id}
                      value={t.assessmentName}
                      disabled={usedByOthers.has(
                        t.assessmentName.trim().toLowerCase()
                      )}
                    >
                      {t.assessmentName}
                    </option>
                  ))}
                </AccountSelect>

                <div className="relative w-24 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.weight === 0 ? "" : row.weight}
                    onChange={(e) =>
                      updateRow(row.id, {
                        weight: Math.max(
                          0,
                          Math.min(100, Number(e.target.value) || 0)
                        ),
                      })
                    }
                    disabled={saving || Boolean(activeTemplate || pendingTemplate)}
                    placeholder="0"
                    className={`${
                      saving ? disabledInputClasses : inputClasses
                    } pr-7`}
                  />
                  <span
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${textMuted}`}
                  >
                    %
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={saving || Boolean(activeTemplate || pendingTemplate)}
                  title="Remove"
                  className={`h-10 w-10 shrink-0 rounded-lg border inline-flex items-center justify-center transition-colors disabled:opacity-50 ${
                    darkMode
                      ? "border-[#374151] text-[#F87171] hover:bg-white/10"
                      : "border-border-subtle text-[#B91C1C] hover:bg-[#FEF2F2]"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRow}
            disabled={saving || Boolean(activeTemplate || pendingTemplate) || allTypesUsed || assessmentTypes.length === 0}
            className={`w-full h-9 rounded-lg border border-dashed text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5"
                : "border-[#CBD5E1] text-[#374151] hover:bg-white"
            }`}
          >
            <Plus size={13} />
            Add Assessment Type
          </button>
      </div>
      )}

      {isGraded && (
      <div className="space-y-4">
        <LoadingRegion name="edit-subject-template" loading={loadingTemplate} error={templateError} retry={() => setTemplateAttempt(attempt => attempt + 1)} variable skeleton={null} frame={(pending) => (
          <SubjectGradeTemplateSection
            loading={pending}
            subjectId={Number(subject.subjectId ?? subject.id)}
            darkMode={darkMode}
            activeTemplate={activeTemplate}
            onTemplateUpdated={setActiveTemplate}
            disabled={saving}
            onProcessingChange={setProcessingTemplate}
            onTemplateSelected={(file, preview) => {
              setPendingTemplate({ file, preview });
              setSaveTemplateError(null);
            }}
          />
        )}>{null}</LoadingRegion>
      </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3 sm:pt-2 lg:col-span-2">
        <button
          onClick={handleClose}
          disabled={saving}
          className={`h-10 w-full rounded-lg border px-5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-border-subtle text-[#374151] hover:bg-brand-light"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || processingTemplate || !weightsValid || !name.trim() || !section.trim() || !schoolYear}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold text-white transition-opacity sm:w-auto ${
            saving || processingTemplate || !weightsValid || !name.trim() || !section.trim() || !schoolYear
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      </div>
    </ModalShell>
  );
}
