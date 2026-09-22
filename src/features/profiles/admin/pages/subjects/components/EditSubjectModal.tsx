import { useState, useEffect, useMemo } from "react";
import { Pencil, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useTeachers } from "../../classes/context/TeachersContext";
import { formatTeacherName } from "../../classes/types/Teacher";
import {
  ACCENT,
  type Subject,
  type SubjectsTheme,
  type WeightDistributionItem,
} from "../types/types";
import { useSections } from "../context/SectionsContext";
import { useSubjectsCatalog } from "../context/SubjectsCatalogContext";
import { ModalShell } from "./ModalShell";

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
  saving = false,
  error = null,
  ...theme
}: EditSubjectModalProps) {
  const { teachers } = useTeachers();
  const { getSectionsForGrade, loadSectionsForGrade } = useSections();
  const { assessmentTypes, loadAssessmentTypes, loading: loadingCatalog } =
    useSubjectsCatalog();

  const [name] = useState(subject.name);
  const [teacherId, setTeacherId] = useState(subject.teacherId ?? "");
  const [section, setSection] = useState(subject.section ?? "");
  const [isGraded, setIsGraded] = useState(subject.isGraded);
  const [weights, setWeights] = useState<WeightDistributionItem[]>(
    () => subject.weightDistribution ?? []
  );
  const { darkMode, textMuted } = theme;

  useEffect(() => {
    void loadSectionsForGrade(subject.gradeLevel);
  }, [subject.gradeLevel, loadSectionsForGrade]);

  useEffect(() => {
    void loadAssessmentTypes();
  }, [loadAssessmentTypes]);

  const gradeSections = getSectionsForGrade(subject.gradeLevel);
  const sectionOptions =
    subject.section && !gradeSections.some((s) => s.name === subject.section)
      ? [{ id: "current", name: subject.section }, ...gradeSections]
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

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

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

  function handleSave() {
    if (saving || !weightsValid) return;
    void onSave({
      name: name.trim() || subject.name,
      schoolYear: subject.schoolYear,
      teacherId: teacherId || null,
      section,
      status: subject.status,
      isGraded,
      weightDistribution: isGraded ? weights : [],
    });
  }

  return (
    <ModalShell
      title="Edit Subject"
      icon={Pencil}
      onClose={onClose}
      closeDisabled={saving}
      {...theme}
    >
      <p className={`text-[11px] font-semibold -mt-1 ${textMuted}`}>
        Editing renames the existing curriculum entry — this does not create a
        new subject.
      </p>

      {error && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
            darkMode
              ? "border-[#7F1D1D] bg-[#7F1D1D]/20 text-[#F87171]"
              : "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className={labelClasses}>Subject Name</label>
        <input value={subject.name} disabled className={disabledInputClasses} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Grade Level</label>
          <input
            value={subject.gradeLevel}
            disabled
            className={disabledInputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled
            className={disabledInputClasses}
          >
            <option value="">Not Assigned</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Assigned Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled
            className={disabledInputClasses}
          >
            <option value="">Not Assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTeacherName(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>School Year</label>
          <input
            value={subject.schoolYear}
            disabled
            className={disabledInputClasses}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses}>Type</label>
        <select
          value={isGraded ? "graded" : "non-graded"}
          onChange={(e) => setIsGraded(e.target.value === "graded")}
          disabled={saving}
          className={saving ? disabledInputClasses : inputClasses}
        >
          <option value="graded">Graded</option>
          <option value="non-graded">Non-Graded</option>
        </select>
      </div>

      {isGraded && (
        <div
          className={`rounded-xl border p-3 space-y-2.5 ${
            darkMode
              ? "border-[#374151] bg-[#0B1120]/60"
              : "border-[#E5E7EB] bg-[#F8FAFC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <label className={`${labelClasses} mb-0`}>Weight Distribution</label>
            <span
              className={`text-[11px] font-bold ${
                totalWeight === 100 ? textMuted : "text-[#B91C1C]"
              }`}
            >
              Total: {totalWeight}%
            </span>
          </div>

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
                <select
                  value={row.assessmentType}
                  onChange={(e) =>
                    updateRow(row.id, { assessmentType: e.target.value })
                  }
                  disabled={saving || loadingCatalog}
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
                </select>

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
                    disabled={saving}
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
                  disabled={saving}
                  title="Remove"
                  className={`h-10 w-10 shrink-0 rounded-xl border inline-flex items-center justify-center transition-colors disabled:opacity-50 ${
                    darkMode
                      ? "border-[#374151] text-[#F87171] hover:bg-white/10"
                      : "border-[#E5E7EB] text-[#B91C1C] hover:bg-[#FEF2F2]"
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
            disabled={saving || allTypesUsed || assessmentTypes.length === 0}
            className={`w-full h-9 rounded-xl border border-dashed text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode
                ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5"
                : "border-[#CBD5E1] text-[#374151] hover:bg-white"
            }`}
          >
            <Plus size={13} />
            Add Assessment Type
          </button>

          {/* {!weightsValid && (
            <p className="text-[11px] font-semibold text-[#B91C1C]">
              {weights.length === 0
                ? "Kailangan ng at least isang assessment type."
                : hasUnsetType
                ? "Kumpletuhin ang type at weight sa bawat row."
                : hasDuplicateType
                ? "May duplicate na assessment type."
                : hasUnknownType
                ? "May assessment type na wala na sa catalog. Palitan muna."
                : `Dapat 100% ang total. Kulang/sobra ng ${Math.abs(
                    100 - totalWeight
                  )}%.`}
            </p>
          )} */}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleClose}
          disabled={saving}
          className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !weightsValid}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            saving || !weightsValid
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}