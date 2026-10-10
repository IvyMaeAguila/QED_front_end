import { AccountSelect } from "@shared/components/AccountSelect";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { Calendar, Tag, Plus, ListChecks } from "lucide-react";
import { ModalBody, ModalFooter, ModalFrame, ModalHeader } from "@shared/components/modal";
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
import type { TemplateDomain } from "../../../../../shared/grading/gradeTemplate.types";


interface AddItemModalProps {
  subjectSectionId: string;
  subjectName: string;
  tab: AssessmentTabKey;
  term: string;
  initialItem?: GradeItem;
  onClose: () => void;
  onConfirm: (item: Omit<GradeItem, "id" | "gradingPeriodId"> & { id?: string }) => void | Promise<void>;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
  templateDomains?: TemplateDomain[];
  examTypes?: ExamType[];
}

export function AddItemModal({
  subjectSectionId,
  subjectName,
  tab,
  initialItem,
  onClose,
  onConfirm,
  darkMode,
  panelBorder,
  textMuted,
  templateDomains = [],
  examTypes = EXAM_TYPES,
}: AddItemModalProps) {
  const isExam = tab === "exams";
  const isWrittenWorks = tab === "writtenWorks";
  const isEdit = !!initialItem;
  const textPrimary = darkMode ? "text-white" : "text-[#111827]";

  const [date, setDate] = useState(initialItem?.date ?? todayISO());
  const [templateDomainId, setTemplateDomainId] = useState(initialItem?.templateDomainId ?? templateDomains[0]?.id ?? "");

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

  async function handleConfirm() {
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
    setError(null);
    try {
      await onConfirm({
        id: initialItem?.id,
        tab,
        date,
        activityName: finalActivityName,
        format: isExam ? "Quiz" : isWrittenWorks ? "Written Work" : "Activity",
        topic: isExam ? "Exam" : selectedTopic!.topicName,
        topicId: isExam ? undefined : selectedTopic!.id,
        templateDomainId: !isExam ? (templateDomainId || undefined) : undefined,
        examType: isExam ? examType : undefined,
        maxItems: totalItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this assessment item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldRow = `flex h-10 w-full items-center gap-2.5 rounded-lg border px-3 outline-none transition-colors ${
    darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-brand-light"
  }`;
  const inputBare = `flex-1 bg-transparent outline-none ${
    darkMode ? "text-white placeholder:text-[#6B7280]" : "text-[#111827] placeholder:text-[#9CA3AF]"
  }`;

  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="md" zIndexClass="z-[1000]" ariaLabel={`${isEdit ? "Edit" : "Add"} ${ASSESSMENT_TAB_LABELS[tab]}`}>
        <ModalHeader
          title={subjectName}
          subtitle={`${isEdit ? "Edit" : "Add"} ${ASSESSMENT_TAB_LABELS[tab]}`}
          titleClassName={`${textPrimary} truncate uppercase`}
          subtitleClassName={textMuted}
          onClose={onClose}
          closeDarkMode={darkMode}
          className={`items-center border-b px-5 py-4 ${panelBorder}`}
        />

        <ModalBody className="space-y-3 p-5">
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
              <AccountSelect data-account-select="" data-dropdown-dark={darkMode}
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className={`flex-1 bg-transparent outline-none ${textPrimary}`}
              >
                {examTypes.map((t) => (
                  <option key={t} value={t}>
                    {t} — {EXAM_TYPE_LABELS[t]}
                  </option>
                ))}
              </AccountSelect>
            </label>
          )}

          {!isExam && templateDomains.length > 1 && (
            <label className={`${fieldRow} justify-between`}>
              <span className={`qed-type-label ${textMuted}`}>Template domain</span>
              <AccountSelect data-account-select="" data-dropdown-dark={darkMode} value={templateDomainId} onChange={(e) => setTemplateDomainId(e.target.value)} className={`${inputBare} text-right`}>
                {templateDomains.map((domain) => <option key={domain.id} value={domain.id}>{domain.label} ({domain.weightPercent}%)</option>)}
              </AccountSelect>
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
                  className="shrink-0 rounded-md bg-maroon px-2 py-1 qed-type-button text-white transition-colors hover:bg-maroon-light disabled:opacity-40"
                >
                  Save
                </button>
                {topics.length > 0 && (
                  <button
                    onClick={() => setNewTopicMode(false)}
                  className={`shrink-0 ${textMuted}`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className={fieldRow}>
                <Tag size={13} className={textMuted} />
                <AccountSelect data-account-select="" data-dropdown-dark={darkMode}
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
                </AccountSelect>
                <button
                  onClick={() => setNewTopicMode(true)}
                  className={`flex shrink-0 items-center gap-1 qed-type-button ${textMuted}`}
                >
                  <Plus size={12} />
                  New
                </button>
              </div>
            ))}

          <label className={fieldRow}>
            <span className={`shrink-0 qed-type-label uppercase tracking-wide ${textMuted}`}>
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
              className={`min-w-0 flex-1 bg-transparent text-right outline-none ${textPrimary}`}
            />
          </label>

          {error && <p className="text-xs font-bold text-[#DC2626]">{error}</p>}

        </ModalBody>
        <ModalFooter className={`border-t-0 px-5 pb-5 pt-0 ${panelBorder}`}>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-maroon qed-type-button text-white transition-colors hover:bg-maroon-light disabled:opacity-60"
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Confirm"}
          </button>
        </ModalFooter>
    </ModalFrame>
  );
}
