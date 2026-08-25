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

  const fieldRow = `w-full h-12 px-3.5 rounded-xl border text-sm font-semibold outline-none transition-colors flex items-center gap-2.5 ${
    darkMode ? "bg-[#0B1120] border-[#374151]" : "bg-[#F1F1F1] border-transparent"
  }`;
  const inputBare = `flex-1 bg-transparent outline-none ${darkMode ? "text-white placeholder:text-[#6B7280]" : "text-[#111827] placeholder:text-[#9CA3AF]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-xl ${panelBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 relative" style={{ background: ACCENT }}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={15} className="text-white" />
          </button>
          <h3 className="text-white text-2xl font-black">{subjectName}</h3>
          <p className="text-white/70 text-sm font-semibold mt-0.5">
            {isEdit ? "Edit" : "Add"} {ASSESSMENT_TAB_LABELS[tab]}
          </p>
        </div>

        <div className="p-6 space-y-3">
          <div className={fieldRow}>
            <Calendar size={16} className={textMuted} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputBare} font-bold`}
            />
          </div>

          {isExam && (
            <div className={fieldRow}>
              <ListChecks size={16} className={textMuted} />
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
            </div>
          )}

          {!isExam &&
            (newTopicMode ? (
              <div className={fieldRow}>
                <Tag size={16} className={textMuted} />
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
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: ACCENT }}
                >
                  Save
                </button>
                {topics.length > 0 && (
                  <button onClick={() => setNewTopicMode(false)} className={`shrink-0 text-xs font-bold ${textMuted}`}>
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className={fieldRow}>
                <Tag size={16} className={textMuted} />
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
                  className={`shrink-0 flex items-center gap-1 text-xs font-bold ${textMuted} hover:${textPrimary}`}
                >
                  <Plus size={13} />
                  New
                </button>
              </div>
            ))}

          <label className={fieldRow}>
            <span className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>
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

          {error && <p className="text-xs font-bold text-[#DC2626]">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 mt-2 disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}