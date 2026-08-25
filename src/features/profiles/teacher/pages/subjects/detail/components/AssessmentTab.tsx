import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import type { RosterStudent } from "../data";
import {
  formatDisplayDate,
  type AssessmentTabKey,
  type GradeItem,
  type GradingPeriod,
  type ScoreMap,
} from "../types/Grading";
import { AddItemModal } from "./AddItemModal";
import { TopicManagerModal } from "./TopicManagerModal";
import { ConfirmDialog } from "./ConfirmDialog";

const ACCENT = "#6B0000";

interface AssessmentTabProps {
  subjectSectionId: string;
  subjectName: string;
  tab: AssessmentTabKey;
  roster: RosterStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  terms: GradingPeriod[];
  selectedTerm: string;
  onTermChange: (termId: string) => void;
  onAddItem: (item: GradeItem) => void | Promise<void>;
  onDeleteItem: (itemId: string) => void | Promise<void>;
  onScoreChange: (
    studentId: string,
    itemId: string,
    value: number | null,
  ) => void | Promise<void>;
  onOpenRecords: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const scoreStyle = (percent: number | null) => {
  if (percent === null) return { color: "#6B7280", background: "#F3F4F6" };
  if (percent >= 90) return { color: "#157F3B", background: "#EAF8EF" };
  if (percent >= 80) return { color: "#1D70D6", background: "#EAF2FF" };
  if (percent >= 75) return { color: "#B45309", background: "#FFF4DB" };
  return { color: "#C2255C", background: "#FCE7F1" };
};

export function AssessmentTab({
  subjectSectionId,
  subjectName,
  tab,
  roster,
  items,
  scores,
  selectedTerm,
  onAddItem,
  onDeleteItem,
  onScoreChange,
  onOpenRecords,
  onDirtyChange,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: AssessmentTabProps) {
  const isWrittenWorks = tab === "writtenWorks";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [topicManagerOpen, setTopicManagerOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [draftScores, setDraftScores] = useState<ScoreMap>(scores);
  useEffect(() => {
    setDraftScores(scores);
  }, [scores]);

  const tabItems = items.filter((i) => {
    if (i.tab !== tab) return false;
    const isFullyScored = roster.every(
      (s) => typeof scores[s.id]?.[i.id] === "number",
    );
    return !isFullyScored;
  });

  useEffect(() => {
    if (selectedItemId && !tabItems.some((i) => i.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [tabItems, selectedItemId]);

  const filtered = useMemo(
    () =>
      roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [roster, search],
  );

  const isDirty = useMemo(() => {
    for (const student of roster) {
      for (const item of tabItems) {
        const draftValue = draftScores[student.id]?.[item.id] ?? null;
        const savedValue = scores[student.id]?.[item.id] ?? null;
        if (draftValue !== savedValue) return true;
      }
    }
    return false;
  }, [roster, tabItems, draftScores, scores]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function handleSave() {
    if (saving) return;

    const changes: {
      studentId: string;
      itemId: string;
      value: number | null;
    }[] = [];
    for (const student of roster) {
      for (const item of tabItems) {
        const draftValue = draftScores[student.id]?.[item.id] ?? null;
        const savedValue = scores[student.id]?.[item.id] ?? null;
        if (draftValue !== savedValue) {
          changes.push({
            studentId: student.id,
            itemId: item.id,
            value: draftValue,
          });
        }
      }
    }

    if (changes.length === 0) {
      setToast("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        changes.map((c) => onScoreChange(c.studentId, c.itemId, c.value)),
      );
      setSavedFlash(true);
      setToast("Grades saved to Records.");
      setTimeout(() => setSavedFlash(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedItem = tabItems.find((i) => i.id === selectedItemId) ?? null;

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const toolbarBtn = `inline-flex h-11 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
    darkMode
      ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
      : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
  }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative flex w-full items-center sm:w-auto sm:min-w-88">
          <span className="sr-only">Search student by name</span>
          <Search
            size={15}
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name"
            aria-label="Search student by name"
            className={`h-11 w-full rounded-xl border py-2 pl-10 pr-4 text-sm font-semibold outline-none transition focus:ring-2 ${panelBg} ${panelBorder} ${textPrimary}`}
            style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
          />
        </label>

        <div className="flex items-center gap-2">
          {tab !== "exams" && (
            <button
              onClick={() => setTopicManagerOpen(true)}
              className={toolbarBtn}
            >
              <Tag size={14} />
              Topics
            </button>
          )}
          <button
            onClick={onOpenRecords}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Records
          </button>
        </div>
      </div>

      <section className={cardClasses} aria-label={subjectName}>
        <div
          className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <ClipboardList size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>{subjectName}</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {tabItems.length} item{tabItems.length === 1 ? "" : "s"} ·{" "}
                {filtered.length} student{filtered.length === 1 ? "" : "s"}
                {isDirty && (
                  <span
                    className="ml-2 font-extrabold"
                    style={{ color: ACCENT }}
                  >
                    · Unsaved changes
                  </span>
                )}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Item actions"
            className={`inline-flex h-11 items-stretch overflow-hidden rounded-xl border ${panelBorder}`}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-4 text-xs font-bold transition-colors disabled:opacity-60 ${
                darkMode
                  ? "text-[#D1D5DB] hover:bg-white/10"
                  : "text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              {savedFlash ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "Saving..." : savedFlash ? "Saved" : "Save"}
            </button>

            <div
              className={`w-px ${darkMode ? "bg-[#374151]" : "bg-[#E5E7EB]"}`}
            />

            <button
              onClick={() => selectedItem && setConfirmingDelete(true)}
              disabled={!selectedItem}
              aria-label={
                selectedItem
                  ? `Delete ${selectedItem.activityName}`
                  : "Delete (select an item first)"
              }
              title={
                selectedItem
                  ? `Delete ${selectedItem.activityName}`
                  : "Select an item column to enable delete"
              }
              className="inline-flex items-center gap-1.5 px-4 text-xs font-bold text-[#DC2626] transition-colors enabled:hover:bg-[#DC2626]/10 disabled:opacity-40"
            >
              <Trash2 size={14} />
              Delete
            </button>

            <div
              className={`w-px ${darkMode ? "bg-[#374151]" : "bg-[#E5E7EB]"}`}
            />

            <button
              onClick={() => setModalOpen(true)}
              disabled={tabItems.length > 0}
              aria-label={
                tabItems.length > 0
                  ? "Finish scoring the current item before adding a new one"
                  : "Add item"
              }
              title={
                tabItems.length > 0
                  ? "Finish and save scores for the current item before adding a new one"
                  : "Add item"
              }
              className={`inline-flex items-center gap-1.5 px-4 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                darkMode
                  ? "text-[#D1D5DB] hover:bg-white/10"
                  : "text-[#374151] hover:bg-[#F6F7FB]"
              }`}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>
              Try a different search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-60 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {tabItems.length === 0 ? (
                    <th
                      className={`px-5 py-4 text-left text-[11px] font-bold ${textMuted}`}
                    >
                      No items yet — tap Add
                    </th>
                  ) : (
                    tabItems.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      return (
                        <th
                          key={item.id}
                          className="min-w-36 px-1 py-2 text-center align-top"
                        >
                          <button
                            onClick={() =>
                              setSelectedItemId(isSelected ? null : item.id)
                            }
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Select ${item.activityName} on ${formatDisplayDate(item.date)} to enable delete`}
                            className={`w-full rounded-xl border-2 px-2 py-2.5 text-center transition-colors focus:outline-none focus-visible:ring-2 ${
                              isSelected
                                ? darkMode
                                  ? "border-[#F87171] bg-[#F87171]/10"
                                  : "border-[#DC2626] bg-[#FEF2F2]"
                                : "border-transparent hover:border-dashed hover:border-current"
                            }`}
                            style={
                              {
                                "--tw-ring-color": `${ACCENT}55`,
                              } as CSSProperties
                            }
                          >
                            <div className="relative flex min-h-4 items-center justify-center">
                              <p
                                className={`text-xs font-extrabold leading-none ${textPrimary}`}
                              >
                                {formatDisplayDate(item.date)}
                              </p>
                              <span
                                className={`absolute right-0 shrink-0 rounded-full bg-[#DC2626] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white transition-opacity ${
                                  isSelected
                                    ? "opacity-100"
                                    : "pointer-events-none opacity-0"
                                }`}
                              >
                                Selected
                              </span>
                            </div>

                            {!isWrittenWorks && (
                              <p
                                className={`mt-1 truncate text-[10px] font-semibold leading-none ${textMuted}`}
                                title={item.activityName}
                              >
                                {item.activityName} · {item.maxItems} pts
                              </p>
                            )}

                            <p
                              className="mt-1 truncate text-[9px] font-bold uppercase leading-none tracking-wide"
                              style={{ color: ACCENT }}
                              title={item.topic}
                            >
                              {item.topic}
                              {isWrittenWorks ? ` · ${item.maxItems} pts` : ""}
                            </p>
                          </button>
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-t transition-colors ${panelBorder} ${
                      index % 2 === 1
                        ? darkMode
                          ? "bg-white/1.5"
                          : "bg-black/[0.012]"
                        : ""
                    } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                  >
                    <td
                      className={`sticky left-0 z-10 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}
                        >
                          <User size={16} style={{ color: ACCENT }} />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`truncate font-extrabold ${textPrimary}`}
                          >
                            {student.name}
                          </p>
                          <p
                            className={`mt-0.5 text-xs font-medium ${textMuted}`}
                          >
                            Student ID: {student.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    {tabItems.map((item) => {
                      const value = draftScores[student.id]?.[item.id] ?? null;
                      const percent =
                        value !== null ? (value / item.maxItems) * 100 : null;
                      const style = scoreStyle(percent);
                      return (
                        <td key={item.id} className="px-3 py-4 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.maxItems}
                            value={value ?? ""}
                            aria-label={`${student.name} score for ${item.activityName}, out of ${item.maxItems}`}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setDraftScores((prev) => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  [item.id]:
                                    raw === ""
                                      ? null
                                      : Math.max(
                                          0,
                                          Math.min(item.maxItems, Number(raw)),
                                        ),
                                },
                              }));
                            }}
                            placeholder="—"
                            className="h-9 w-16 rounded-lg text-center text-xs font-black tabular-nums outline-none transition-colors"
                            style={{
                              backgroundColor:
                                darkMode && value !== null
                                  ? `${style.color}25`
                                  : style.background,
                              color: style.color,
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <AddItemModal
            subjectSectionId={subjectSectionId}
            subjectName={subjectName}
            tab={tab}
            term={selectedTerm}
            onClose={() => setModalOpen(false)}
            onConfirm={async (item) => {
              await onAddItem(item as GradeItem);
              setModalOpen(false);
              setToast(`Item added. Enter scores, then click Save.`);
            }}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textMuted={textMuted}
          />
        )}

        {confirmingDelete && selectedItem && (
          <ConfirmDialog
            title="Delete this item?"
            message="This removes the item and every student's score for it. This can't be undone."
            confirmLabel="Delete"
            danger
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={async () => {
              await onDeleteItem(selectedItem.id);
              setConfirmingDelete(false);
              setSelectedItemId(null);
              setToast("Item deleted.");
            }}
            darkMode={darkMode}
          />
        )}

        {topicManagerOpen && (
          <TopicManagerModal
            subjectSectionId={subjectSectionId}
            onClose={() => setTopicManagerOpen(false)}
            onTopicsChanged={() => {
            }}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textMuted={textMuted}
          />
        )}
        {toast && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl"
          >
            {toast}
          </div>
        )}
      </section>
    </div>
  );
}
