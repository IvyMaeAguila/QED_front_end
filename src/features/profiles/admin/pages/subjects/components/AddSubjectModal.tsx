import { useState, useEffect } from "react";
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import {
  ACCENT,
  type GradeLevel,
  type Subject,
  type NewSubjectInput,
  type SubjectsTheme,
  type WeightDistributionItem,
} from "../types/types";
import { ModalShell } from "./ModalShell";
import { useGradeLevels } from "../context/gradeLevelsContext";

interface AddSubjectModalProps extends SubjectsTheme {
  subjects: Subject[];
  defaultGrade: GradeLevel;
  schoolYear: string;
  onClose: () => void;
  onAdd: (newSubject: NewSubjectInput) => void | Promise<void>;
  onManageSections: () => void;
  saving?: boolean;
  error?: string | null;
}

const ADD_NEW_VALUE = "__add_new__";

function makeEmptyRow(): WeightDistributionItem {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : `row-${Date.now()}-${Math.random()}`,
    assessmentType: "",
    weight: 0,
  };
}

export function AddSubjectModal({
  subjects,
  schoolYear,
  onClose,
  onAdd,
  saving = false,
  error = null,
  ...theme
}: AddSubjectModalProps) {
  const { darkMode, textMuted } = theme;

  const { gradeLevels, loading: loadingGradeLevels } = useGradeLevels();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [name, setName] = useState("");
  const [isGraded, setIsGraded] = useState<boolean | null>(null);

  const [weightDistribution, setWeightDistribution] = useState<WeightDistributionItem[]>([
    makeEmptyRow(),
  ]);

  // Shared na listahan ng assessment type options — dito napupunta ang
  // custom labels na idinagdag ng user, para magamit din sa ibang rows.
  // Walang preset/defaults; lahat galing sa user input.
  const [assessmentTypeOptions, setAssessmentTypeOptions] = useState<string[]>([]);

  // Row id na kasalukuyang nasa "add new type" input mode
  const [addingLabelForRowId, setAddingLabelForRowId] = useState<string | null>(null);
  const [newLabelDraft, setNewLabelDraft] = useState("");

  useEffect(() => {
    setName("");
    setIsGraded(null);
    setWeightDistribution([makeEmptyRow()]);
    setAddingLabelForRowId(null);
    setNewLabelDraft("");
  }, [gradeLevel]);

  function handleGradeChange(grade: string) {
    setGradeLevel(grade as GradeLevel | "");
  }

  function addWeightRow() {
    setWeightDistribution((prev) => [...prev, makeEmptyRow()]);
  }

  function removeWeightRow(id: string) {
    setWeightDistribution((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id),
    );
    if (addingLabelForRowId === id) {
      setAddingLabelForRowId(null);
      setNewLabelDraft("");
    }
  }

  function updateWeightRow(id: string, field: "assessmentType" | "weight", value: string) {
    setWeightDistribution((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === "weight" ? Number(value) || 0 : value,
            }
          : row,
      ),
    );
  }

  function handleAssessmentTypeSelect(rowId: string, value: string) {
    if (value === ADD_NEW_VALUE) {
      // Buksan ang inline input para mag-type ng bagong label
      setAddingLabelForRowId(rowId);
      setNewLabelDraft("");
      return;
    }
    updateWeightRow(rowId, "assessmentType", value);
  }

  function confirmNewLabel(rowId: string) {
    const label = newLabelDraft.trim();
    if (label === "") {
      setAddingLabelForRowId(null);
      return;
    }

    // Idagdag sa shared options kung wala pa (case-insensitive check)
    setAssessmentTypeOptions((prev) =>
      prev.some((opt) => opt.toLowerCase() === label.toLowerCase()) ? prev : [...prev, label],
    );

    updateWeightRow(rowId, "assessmentType", label);
    setAddingLabelForRowId(null);
    setNewLabelDraft("");
  }

  function cancelNewLabel() {
    setAddingLabelForRowId(null);
    setNewLabelDraft("");
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed placeholder:text-current`;
  const labelClasses = `block text-[11px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  const noGradeSelected = gradeLevel === "";
  const trimmedName = name.trim();

  const isDuplicate =
    !noGradeSelected &&
    trimmedName !== "" &&
    subjects.some(
      (s) =>
        s.gradeLevel === gradeLevel &&
        s.schoolYear === schoolYear &&
        s.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

  const totalWeight = weightDistribution.reduce((sum, row) => sum + row.weight, 0);
  const hasEmptyWeightRow = weightDistribution.some(
    (row) => row.assessmentType.trim() === "" || row.weight <= 0,
  );

  const noGradingTypeSelected = isGraded === null;
  const weightDistributionInvalid =
  isGraded === true && (hasEmptyWeightRow || totalWeight !== 100)

  const canSubmit =
    !saving &&
    !noGradeSelected &&
    trimmedName !== "" &&
    !isDuplicate &&
    !noGradingTypeSelected &&
    !weightDistributionInvalid &&
    addingLabelForRowId === null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleAdd() {
    if (gradeLevel === "") return;
    if (!canSubmit) return;

    void onAdd({
      name: trimmedName,
      gradeLevel,
      isGraded: isGraded === true,
      schoolYear,
      status: "Active",
      weightDistribution: isGraded ? weightDistribution : [],
    });
  }

  return (
    <ModalShell
      title="Add Subject"
      icon={BookOpen}
      onClose={onClose}
      closeDisabled={saving}
      {...theme}
    >

      <div>
        <label className={labelClasses}>Grade Level</label>
        <select
          value={gradeLevel}
          onChange={(e) => handleGradeChange(e.target.value)}
          disabled={saving || loadingGradeLevels}
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
          disabled={saving || noGradeSelected}
          placeholder={
            noGradeSelected ? "Select a grade level first" : "e.g. Filipino, MAPEH"
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
  onClick={() => setIsGraded(true)}
  disabled={saving || noGradeSelected}
  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    isGraded === true
      ? "text-white border-transparent"
      : darkMode
        ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
        : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
  }`}
  style={isGraded === true ? { background: ACCENT } : undefined}
>
  Graded
</button>
<button
  type="button"
  onClick={() => setIsGraded(false)}
  disabled={saving || noGradeSelected}
  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    isGraded === false
      ? "text-white border-transparent"
      : darkMode
        ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
        : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
  }`}
  style={isGraded === false ? { background: ACCENT } : undefined}
>
  Non-graded
</button>
        </div>
      </div>

      {isGraded === true && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${labelClasses} mb-0`}>Weight Distribution</label>
            <button
              type="button"
              onClick={addWeightRow}
              disabled={saving || noGradeSelected}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {weightDistribution.map((row) => (
              <div key={row.id} className="flex gap-2 items-center">
                {addingLabelForRowId === row.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={newLabelDraft}
                    onChange={(e) => setNewLabelDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmNewLabel(row.id);
                      } else if (e.key === "Escape") {
                        cancelNewLabel();
                      }
                    }}
                    onBlur={() => confirmNewLabel(row.id)}
                    placeholder="Type new assessment type…"
                    className={`${inputClasses} flex-[2]`}
                  />
                ) : (
                  <select
                    value={row.assessmentType}
                    onChange={(e) => handleAssessmentTypeSelect(row.id, e.target.value)}
                    disabled={saving || noGradeSelected}
                    className={`${
                      noGradeSelected ? disabledInputClasses : inputClasses
                    } flex-[2]`}
                  >
                    <option value="" disabled>
                      {assessmentTypeOptions.length === 0 ? "No types yet…" : "Select type…"}
                    </option>
                    {assessmentTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value={ADD_NEW_VALUE}>+ Add new type…</option>
                  </select>
                )}

                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.weight === 0 ? "" : row.weight}
                    onChange={(e) => updateWeightRow(row.id, "weight", e.target.value)}
                    disabled={saving || noGradeSelected}
                    placeholder="0"
                    className={`${
                      noGradeSelected ? disabledInputClasses : inputClasses
                    } pr-7`}
                  />
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${textMuted}`}
                  >
                    %
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeWeightRow(row.id)}
                  disabled={saving || noGradeSelected || weightDistribution.length === 1}
                  className={`h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    darkMode
                      ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                      : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <p
            className={`mt-1.5 text-[11px] font-semibold ${
              totalWeight === 100 ? textMuted : "text-[#B91C1C]"
            }`}
          >
            Total: {totalWeight}% {totalWeight !== 100 && "(dapat umabot sa 100%)"}
          </p>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-[#B91C1C]">{error}</p>
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
          disabled={!canSubmit}
          onClick={handleAdd}
          className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${
            !canSubmit ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Add Subject"}
        </button>
      </div>
    </ModalShell>
  );
}