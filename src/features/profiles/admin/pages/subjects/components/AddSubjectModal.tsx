import { useState, useEffect } from "react";
import { BookOpen, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import {
  ACCENT,
  type GradeLevel,
  type Subject,
  type NewSubjectInput,
  type SubjectsTheme,
  type WeightDistributionItem,
} from "../types/types";
import { ModalShell } from "./ModalShell";
import { DangerConfirmModal } from "@shared/components/DangerConfirmModal";
import { useGradeLevels } from "../context/gradeLevelsContext";
import { useSubjectsCatalog } from "../context/SubjectsCatalogContext";

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
    id:
      typeof crypto !== "undefined"
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random()}`,
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
  const { darkMode, textMuted, textPrimary, panelBg, panelBorder } = theme;
  const { gradeLevels, loading: loadingGradeLevels } = useGradeLevels();
  const {
    assessmentTypes,
    loadAssessmentTypes,
    addAssessmentType,
    editAssessmentType,
    removeAssessmentType,
    loading: loadingCatalog,
  } = useSubjectsCatalog();

  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [name, setName] = useState("");
  const [isGraded, setIsGraded] = useState<boolean | null>(null);
  const [weightDistribution, setWeightDistribution] = useState<
    WeightDistributionItem[]
  >([makeEmptyRow()]);
  const [addingLabelForRowId, setAddingLabelForRowId] = useState<string | null>(
    null,
  );
  const [openAssessmentRowId, setOpenAssessmentRowId] = useState<string | null>(
    null,
  );
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(
    null,
  );
  const [editingAssessmentName, setEditingAssessmentName] = useState("");
  const [savingAssessmentEdit, setSavingAssessmentEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [newLabelDraft, setNewLabelDraft] = useState("");
  const [savingNewLabel, setSavingNewLabel] = useState(false);
  const [newLabelError, setNewLabelError] = useState<string | null>(null);

  useEffect(() => {
    void loadAssessmentTypes();
  }, [loadAssessmentTypes]);

  useEffect(() => {
    setName("");
    setIsGraded(null);
    setWeightDistribution([makeEmptyRow()]);
    setAddingLabelForRowId(null);
    setNewLabelDraft("");
    setNewLabelError(null);
    setOpenAssessmentRowId(null);
    setEditingAssessmentId(null);
    setEditingAssessmentName("");
  }, [gradeLevel]);

  function handleGradeChange(grade: string) {
    setGradeLevel(grade as GradeLevel | "");
  }

  function addWeightRow() {
    const used = new Set(
      weightDistribution.map((w) => w.assessmentType.trim().toLowerCase()),
    );
    const nextType = assessmentTypes.find(
      (t) => !used.has(t.assessmentName.trim().toLowerCase()),
    );
    setWeightDistribution((prev) => [
      ...prev,
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `row-${Date.now()}-${Math.random()}`,
        assessmentType: nextType?.assessmentName ?? "",
        weight: 0,
      },
    ]);
  }

  function removeWeightRow(id: string) {
    setWeightDistribution((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id),
    );
    if (addingLabelForRowId === id) {
      setAddingLabelForRowId(null);
      setNewLabelDraft("");
      setNewLabelError(null);
    }
    if (openAssessmentRowId === id) setOpenAssessmentRowId(null);
  }

  function updateWeightRow(
    id: string,
    field: "assessmentType" | "weight",
    value: string,
  ) {
    setWeightDistribution((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === "weight"
                  ? Math.max(0, Math.min(100, Number(value) || 0))
                  : value,
            }
          : row,
      ),
    );
  }

  function handleAssessmentTypeSelect(rowId: string, value: string) {
    if (value === ADD_NEW_VALUE) {
      setAddingLabelForRowId(rowId);
      setNewLabelDraft("");
      setNewLabelError(null);
      setOpenAssessmentRowId(null);
      return;
    }
    updateWeightRow(rowId, "assessmentType", value);
    setOpenAssessmentRowId(null);
  }

  async function confirmNewLabel(rowId: string) {
    const label = newLabelDraft.trim();
    if (!label) {
      setAddingLabelForRowId(null);
      return;
    }

    const alreadyExists = assessmentTypes.some(
      (t) => t.assessmentName.trim().toLowerCase() === label.toLowerCase(),
    );

    if (alreadyExists) {
      updateWeightRow(rowId, "assessmentType", label);
      setAddingLabelForRowId(null);
      setNewLabelDraft("");
      return;
    }

    setSavingNewLabel(true);
    setNewLabelError(null);
    try {
      const newType = await addAssessmentType(label);
      updateWeightRow(rowId, "assessmentType", newType.assessmentName);
      setAddingLabelForRowId(null);
      setNewLabelDraft("");
    } catch (err) {
      console.error("Failed to create assessment type:", err);
      setNewLabelError(
        err instanceof Error
          ? err.message
          : "Failed to save new type. Try again.",
      );
    } finally {
      setSavingNewLabel(false);
    }
  }

  function cancelNewLabel() {
    setAddingLabelForRowId(null);
    setNewLabelDraft("");
    setNewLabelError(null);
  }

  async function handleEditAssessmentType(id: number) {
    const trimmed = editingAssessmentName.trim();
    if (!trimmed) return;

    const currentType = assessmentTypes.find((type) => type.id === id);
    if (!currentType) return;

    const duplicate = assessmentTypes.some(
      (type) =>
        type.id !== id &&
        type.assessmentName.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) return;

    try {
      setSavingAssessmentEdit(true);
      const updated = await editAssessmentType(id, trimmed);

      setWeightDistribution((prev) =>
        prev.map((row) =>
          row.assessmentType === currentType.assessmentName
            ? { ...row, assessmentType: updated.assessmentName }
            : row,
        ),
      );
      setEditingAssessmentId(null);
      setEditingAssessmentName("");
    } catch (err) {
      console.error("Failed to update assessment type:", err);
    } finally {
      setSavingAssessmentEdit(false);
    }
  }

  function requestDeleteAssessmentType(id: number) {
    const type = assessmentTypes.find((item) => item.id === id);
    if (!type) return;
    setDeleteTarget({ id: type.id, name: type.assessmentName });
    setOpenAssessmentRowId(null);
  }

  async function confirmDeleteAssessmentType() {
    if (!deleteTarget) return;

    const { id, name: assessmentName } = deleteTarget;

    await removeAssessmentType(id);

    setWeightDistribution((prev) =>
      prev.map((row) =>
        row.assessmentType === assessmentName
          ? { ...row, assessmentType: "" }
          : row,
      ),
    );

    setDeleteTarget(null);
  }

  const inputClasses = `w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors ${darkMode ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]" : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"}`;
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

  const totalWeight = weightDistribution.reduce(
    (sum, row) => sum + row.weight,
    0,
  );
  const hasEmptyWeightRow = weightDistribution.some(
    (row) => row.assessmentType.trim() === "" || row.weight <= 0,
  );
  const noGradingTypeSelected = isGraded === null;
  const weightDistributionInvalid =
    isGraded === true && (hasEmptyWeightRow || totalWeight !== 100);

  const canSubmit =
    !saving &&
    !noGradeSelected &&
    trimmedName !== "" &&
    !isDuplicate &&
    !noGradingTypeSelected &&
    !weightDistributionInvalid &&
    addingLabelForRowId === null &&
    editingAssessmentId === null;

  function handleClose() {
    if (!saving) onClose();
  }

  function handleAdd() {
    if (gradeLevel === "" || !canSubmit) return;
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
    <>
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
              onClick={() => setIsGraded(true)}
              disabled={saving || noGradeSelected}
              className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isGraded === true ? "text-white border-transparent" : darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
              style={isGraded === true ? { background: ACCENT } : undefined}
            >
              Graded
            </button>

            <button
              type="button"
              onClick={() => setIsGraded(false)}
              disabled={saving || noGradeSelected}
              className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isGraded === false ? "text-white border-transparent" : darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
              style={isGraded === false ? { background: ACCENT } : undefined}
            >
              Non-graded
            </button>
          </div>
        </div>

        {isGraded === true && (
          <div
            className={`rounded-xl border p-3 space-y-2.5 ${darkMode ? "border-[#374151] bg-[#0B1120]/60" : "border-[#E5E7EB] bg-[#F8FAFC]"}`}
          >
            <div className="flex items-center justify-between">
              <label className={`${labelClasses} mb-0`}>
                Weight Distribution
              </label>
              <span
                className={`text-[11px] font-bold ${totalWeight === 100 ? textMuted : "text-[#B91C1C]"}`}
              >
                Total: {totalWeight}%
              </span>
            </div>

            {weightDistribution.map((row) => {
              const usedByOthers = new Set(
                weightDistribution
                  .filter((w) => w.id !== row.id)
                  .map((w) => w.assessmentType.trim().toLowerCase()),
              );
              const isMissingFromCatalog =
                row.assessmentType.trim() !== "" &&
                !assessmentTypes.some(
                  (t) =>
                    t.assessmentName.trim().toLowerCase() ===
                    row.assessmentType.trim().toLowerCase(),
                );

              return (
                <div key={row.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {addingLabelForRowId === row.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={newLabelDraft}
                        onChange={(e) => setNewLabelDraft(e.target.value)}
                        disabled={savingNewLabel}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void confirmNewLabel(row.id);
                          }
                          if (e.key === "Escape") cancelNewLabel();
                        }}
                        onBlur={() => void confirmNewLabel(row.id)}
                        placeholder="Type new assessment type…"
                        className={`${inputClasses} flex-1`}
                      />
                    ) : (
                      <div className="relative flex-1">
                        <button
                          type="button"
                          disabled={saving || loadingCatalog}
                          onClick={() =>
                            setOpenAssessmentRowId((prev) =>
                              prev === row.id ? null : row.id,
                            )
                          }
                          className={`w-full h-10 px-3 rounded-xl border text-sm font-semibold outline-none transition-colors text-left flex items-center justify-between ${darkMode ? "bg-[#0B1120] border-[#374151] text-white hover:border-[#6B7280]" : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] hover:border-[#CBD5E1]"}`}
                        >
                          <span className={row.assessmentType ? "" : textMuted}>
                            {loadingCatalog
                              ? "Loading types…"
                              : row.assessmentType || "Select type…"}
                          </span>
                          <span className="text-xs">⌄</span>
                        </button>

                        {openAssessmentRowId === row.id && (
                          <div
                            className={`absolute z-[100] left-0 right-0 mt-1 rounded-xl border shadow-lg overflow-hidden ${darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
                          >
                            <div className="max-h-56 overflow-y-auto">
                              {assessmentTypes.length === 0 ? (
                                <div
                                  className={`px-3 py-3 text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}
                                >
                                  No assessment types yet.
                                </div>
                              ) : (
                                assessmentTypes.map((type) => (
                                  <div
                                    key={type.id}
                                    className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${darkMode ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
                                  >
                                    {editingAssessmentId === type.id ? (
                                      <>
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingAssessmentName}
                                          onChange={(e) =>
                                            setEditingAssessmentName(
                                              e.target.value,
                                            )
                                          }
                                          disabled={savingAssessmentEdit}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              void handleEditAssessmentType(
                                                type.id,
                                              );
                                            }
                                            if (e.key === "Escape") {
                                              setEditingAssessmentId(null);
                                              setEditingAssessmentName("");
                                            }
                                          }}
                                          className={`flex-1 min-w-0 h-8 px-2 rounded-lg border text-sm font-semibold outline-none ${darkMode ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#8B0D0D]" : "bg-white border-[#E5E7EB] text-[#111827] focus:border-[#8B0D0D]"}`}
                                        />

                                        <button
                                          type="button"
                                          disabled={
                                            savingAssessmentEdit ||
                                            !editingAssessmentName.trim()
                                          }
                                          onClick={() =>
                                            void handleEditAssessmentType(
                                              type.id,
                                            )
                                          }
                                          className="h-8 px-3 rounded-lg text-xs font-bold text-white disabled:opacity-40 inline-flex items-center justify-center"
                                          style={{ background: ACCENT }}
                                        >
                                          {savingAssessmentEdit ? (
                                            <Loader2
                                              size={13}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            "Save"
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          disabled={savingAssessmentEdit}
                                          onClick={() => {
                                            setEditingAssessmentId(null);
                                            setEditingAssessmentName("");
                                          }}
                                          className={`h-8 px-2 rounded-lg text-xs font-semibold ${darkMode ? "text-[#9CA3AF] hover:bg-white/10" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          disabled={usedByOthers.has(
                                            type.assessmentName
                                              .trim()
                                              .toLowerCase(),
                                          )}
                                          onClick={() =>
                                            handleAssessmentTypeSelect(
                                              row.id,
                                              type.assessmentName,
                                            )
                                          }
                                          className={`flex-1 min-w-0 text-left px-2 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? "text-[#E5E7EB]" : "text-[#374151]"}`}
                                        >
                                          <span className="truncate block">
                                            {type.assessmentName}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          title="Edit assessment type"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingAssessmentId(type.id);
                                            setEditingAssessmentName(
                                              type.assessmentName,
                                            );
                                          }}
                                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${darkMode ? "text-[#9CA3AF] hover:text-white hover:bg-white/10" : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"}`}
                                        >
                                          <Pencil size={14} />
                                        </button>

                                        <button
                                          type="button"
                                          title="Delete assessment type"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            requestDeleteAssessmentType(
                                              type.id,
                                            );
                                          }}
                                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${darkMode ? "text-[#F87171] hover:bg-red-500/10" : "text-[#DC2626] hover:bg-red-50"}`}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenAssessmentRowId(null);
                                setAddingLabelForRowId(row.id);
                                setNewLabelDraft("");
                                setNewLabelError(null);
                              }}
                              className={`w-full border-t px-3 py-2.5 text-left text-sm font-semibold ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F8FAFC]"}`}
                            >
                              + Add new type…
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PERCENTAGE SA RIGHT END */}
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.weight === 0 ? "" : row.weight}
                        onChange={(e) =>
                          updateWeightRow(row.id, "weight", e.target.value)
                        }
                        disabled={saving}
                        placeholder="0"
                        className={`${inputClasses} pr-7`}
                      />
                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${textMuted}`}
                      >
                        %
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeWeightRow(row.id)}
                      disabled={saving || weightDistribution.length === 1}
                      title="Remove"
                      className={`h-10 w-10 shrink-0 rounded-xl border inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? "border-[#374151] text-[#F87171] hover:bg-white/10" : "border-[#E5E7EB] text-[#B91C1C] hover:bg-[#FEF2F2]"}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {addingLabelForRowId === row.id && newLabelError && (
                    <p className="text-[11px] font-semibold text-[#B91C1C]">
                      {newLabelError}
                    </p>
                  )}
                  {isMissingFromCatalog && (
                    <p className="text-[11px] font-semibold text-[#B91C1C]">
                      This assessment type is no longer available in the
                      catalog.
                    </p>
                  )}
                </div>
              );
            })}

            {/* ADD SA ILALIM */}
            <button
              type="button"
              onClick={addWeightRow}
              disabled={
                saving ||
                assessmentTypes.length === 0 ||
                weightDistribution.length >= assessmentTypes.length
              }
              className={`w-full h-9 rounded-xl border border-dashed text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5" : "border-[#CBD5E1] text-[#374151] hover:bg-white"}`}
            >
              <Plus size={13} /> Add Assessment Type
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold text-[#B91C1C]">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"}`}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleAdd}
            className={`flex-1 h-10 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-opacity ${!canSubmit ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
            style={{ background: ACCENT }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Add Subject"}
          </button>
        </div>
      </ModalShell>

      {deleteTarget && (
        <DangerConfirmModal
          title="Delete Assessment Type?"
          description={
            <>
              This will permanently delete <strong>{deleteTarget.name}</strong>{" "}
              from the assessment type catalog. Any subject weight distribution
              using this type will also lose its selected assessment type.
            </>
          }
          confirmPhrase={deleteTarget.name}
          confirmLabel="Delete Assessment Type"
          successMessage={`Assessment type "${deleteTarget.name}" deleted successfully.`}
          errorMessage="Failed to delete assessment type."
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteAssessmentType}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}
    </>
  );
}
