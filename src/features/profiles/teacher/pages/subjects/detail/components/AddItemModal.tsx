import { useEffect, useState } from "react";
import { X, Calendar, Tag, Plus, ListChecks } from "lucide-react";
import {
  ASSESSMENT_TAB_LABELS,
  EXAM_TYPES,
  EXAM_TYPE_LABELS,
  todayISO,
  type AssessmentTabKey,
  type ExamType,
  type GradeItem,
} from "../types/Grading";
import { createTopic, fetchTopics, type Topic } from "../../services/subjectGrading.service";

const ACCENT = "#6B0000";

interface AddItemModalProps {
  subjectSectionId: string;
  subjectName: string;
  tab: AssessmentTabKey;
  term: string;
  initialItem?: GradeItem;
  onClose: () => void;
  onConfirm: (item: Omit<GradeItem, "id" | "gradingPeriodId"> & { id?: string }) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

export function AddItemModal({
  subjectSectionId,
  subjectName,
  tab,
  initialItem,
  onClose,
  onConfirm,
  darkMode,
  panelBg,
  panelBorder,
  textMuted,
}: AddItemModalProps) {
  const isExam = tab === "exams";
  const isWrittenWorks = tab === "writtenWorks";
  const isEdit = !!initialItem;
  const textPrimary = darkMode ? "text-white" : "text-[#111827]";

  const [date, setDate] = useState(initialItem?.date ?? todayISO());

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialItem?.topicId ?? "");
  const [newTopicMode, setNewTopicMode] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  const [examType, setExamType] = useState<ExamType>(initialItem?.examType ?? "ST1");
  const [maxItems, setMaxItems] = useState(initialItem ? String(initialItem.maxItems) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isExam) {
      setTopicsLoading(false);
      return;
    }
    fetchTopics(subjectSectionId)
      .then((data) => {
        setTopics(data);
        if (data.length === 0) setNewTopicMode(true);
      })
      .catch((err) => console.error("Failed to load topics:", err))
      .finally(() => setTopicsLoading(false));
  }, [subjectSectionId, isExam]);

  async function handleCreateTopicInline() {
    const name = newTopicName.trim();
    if (!name) return;

    setCreatingTopic(true);
    setError(null);
    try {
      const { id } = await createTopic(subjectSectionId, name);
      const updated = await fetchTopics(subjectSectionId);
      setTopics(updated);
      setSelectedTopicId(id);
      setNewTopicMode(false);
      setNewTopicName("");
    } catch (err) {
      console.error("Failed to create topic:", err);
      setError(err instanceof Error ? err.message : "Failed to create topic.");
    } finally {
      setCreatingTopic(false);
    }
  }

  function handleConfirm() {
    if (submitting) return;

    const selectedTopic = isExam
      ? { id: "", topicName: "Exam" }
      : topics.find((t) => t.id === selectedTopicId);
    if (!isExam && !selectedTopic) {
      return setError("Pick a topic — this is what powers mastery and intervention tracking.");
    }

    const finalActivityName = isExam ? EXAM_TYPE_LABELS[examType] : selectedTopic!.topicName;

    const totalItems = Number(maxItems);
    if (!Number.isInteger(totalItems) || totalItems <= 0) {
      return setError("Total items must be a whole number greater than 0.");
    }
    if (!date) return setError("Date is required.");

    setSubmitting(true);
    onConfirm({
      id: initialItem?.id,
      tab,
      date,
      activityName: finalActivityName,
      format: isExam ? "Quiz" : isWrittenWorks ? "Written Work" : "Activity",
      topic: isExam ? "Exam" : selectedTopic!.topicName,
      topicId: isExam ? undefined : selectedTopic!.id,
      examType: isExam ? examType : undefined,
      maxItems: totalItems,
    });
  }

  const fieldRow = `flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-[11px] font-bold outline-none transition-colors ${
    darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-[#F8FAFC]"
  }`;
  const inputBare = `flex-1 bg-transparent outline-none ${
    darkMode ? "text-white placeholder:text-[#6B7280]" : "text-[#111827] placeholder:text-[#9CA3AF]"
  }`;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,10,15,0.56)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${panelBorder}`}>
          <div className="min-w-0">
            <p className={`truncate text-xs font-bold uppercase tracking-wide ${textPrimary}`}>{subjectName}</p>
            <p className={`text-[11px] font-medium ${textMuted}`}>
              {isEdit ? "Edit" : "Add"} {ASSESSMENT_TAB_LABELS[tab]}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-black/5"
            }`}
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2 p-4">
          <label className={fieldRow}>
            <Calendar size={13} className={textMuted} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputBare}
            />
          </label>

          {isExam && (
            <label className={fieldRow}>
              <ListChecks size={13} className={textMuted} />
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className={`flex-1 bg-transparent outline-none ${textPrimary}`}
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} — {EXAM_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!isExam &&
            (newTopicMode ? (
              <div className={fieldRow}>
                <Tag size={13} className={textMuted} />
                <input
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTopicInline();
                  }}
                  placeholder="New topic name, e.g. Fractions"
                  className={inputBare}
                  autoFocus
                />
                <button
                  onClick={handleCreateTopicInline}
                  disabled={creatingTopic || !newTopicName.trim()}
                  className="shrink-0 rounded-md bg-[#800000] px-2 py-1 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-40"
                >
                  Save
                </button>
                {topics.length > 0 && (
                  <button
                    onClick={() => setNewTopicMode(false)}
                    className={`shrink-0 text-[11px] font-bold ${textMuted}`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className={fieldRow}>
                <Tag size={13} className={textMuted} />
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${textPrimary}`}
                  disabled={topicsLoading}
                >
                  <option value="" disabled>
                    {topicsLoading ? "Loading topics..." : "Select a topic"}
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topicName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setNewTopicMode(true)}
                  className={`flex shrink-0 items-center gap-1 text-[11px] font-bold ${textMuted}`}
                >
                  <Plus size={12} />
                  New
                </button>
              </div>
            ))}

          <label className={fieldRow}>
            <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${textMuted}`}>
              {isExam ? "Score" : "Total items"}
            </span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={maxItems}
              onChange={(event) => setMaxItems(event.target.value)}
              placeholder="e.g. 25"
              className={`min-w-0 flex-1 bg-transparent text-right font-black outline-none ${textPrimary}`}
            />
          </label>

          {error && <p className="text-[11px] font-bold text-[#DC2626]">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="mt-1 flex h-9 w-full items-center justify-center rounded-lg bg-[#800000] text-xs font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-60"
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}