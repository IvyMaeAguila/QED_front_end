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

type GenderedStudent = RosterStudent & { gender?: "M" | "F" };
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

const SCORE_LEGEND = [
  { label: "90% and up", color: "#157F3B" },
  { label: "80-89%", color: "#1D70D6" },
  { label: "75-79%", color: "#B45309" },
  { label: "Below 75%", color: "#C2255C" },
];

interface AssessmentTabProps {
  subjectSectionId: string;
  subjectName: string;
  tab: AssessmentTabKey;
  roster: GenderedStudent[];
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

  // An item stays on this working Score Sheet only until it has been
  // saved at least once. It does NOT need to be scored for every student
  // to leave — the teacher's flow is: add an item, score whoever you have
  // scores for right now, hit Save, and the item hands off entirely to
  // the Full Records page (which has its own edit mode) for anyone still
  // blank. Gating this on "every student scored" instead used to trap the
  // item here indefinitely whenever even one student was missing a score,
  // which looked like "my save didn't work" even though it had.
  //
  // This reads off `scores` (the committed/persisted map), not
  // `draftScores` (in-progress typing), so an item you haven't saved yet
  // correctly stays visible even if you've typed values into every box.
  const tabItems = items.filter((i) => {
    if (i.tab !== tab) return false;
    const hasAnySavedScore = roster.some(
      (s) => typeof scores[s.id]?.[i.id] === "number",
    );
    return !hasAnySavedScore;
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

  function isFemale(student: GenderedStudent): boolean {
    const g = String(student.gender ?? "").trim().toUpperCase();
    return g === "F" || g === "FEMALE";
  }

  const grouped = useMemo(() => {
    const female = filtered.filter((s) => isFemale(s));
    const male = filtered.filter((s) => !isFemale(s));
    return { male, female };
  }, [filtered]);

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

  const columnCount = 1 + Math.max(tabItems.length, 1);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const stickyCell = darkMode ? "bg-[#111827]" : "bg-white";
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;
  const toolButton = `flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    darkMode
      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
      : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
  }`;

  function renderStudentRow(student: GenderedStudent) {
    return (
      <tr
        key={student.id}
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
      >
        <td className={`sticky left-0 z-10 px-4 py-2 ${stickyCell}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                darkMode ? "bg-white/10" : "bg-black/5"
              } ${textMuted}`}
            >
              <User size={13} />
            </span>
            <span className={`truncate text-xs font-bold ${textPrimary}`}>
              {student.name}
            </span>
          </div>
        </td>
        {tabItems.map((item) => {
          const value = draftScores[student.id]?.[item.id] ?? null;
          const percent = value !== null ? (value / item.maxItems) * 100 : null;
          const style = scoreStyle(percent);
          return (
            <td key={item.id} className="px-3 py-2 text-center">
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
                          : Math.max(0, Math.min(item.maxItems, Number(raw))),
                    },
                  }));
                }}
                placeholder="—"
                className="h-7 w-14 rounded-lg text-center text-[11px] font-black tabular-nums outline-none transition-colors focus:ring-2"
                style={
                  {
                    backgroundColor:
                      darkMode && value !== null
                        ? `${style.color}25`
                        : darkMode
                          ? "#ffffff10"
                          : style.background,
                    color: value !== null ? style.color : "#9CA3AF",
                    "--tw-ring-color": `${ACCENT}55`,
                  } as CSSProperties
                }
              />
            </td>
          );
        })}
      </tr>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search + legend + Topics / Full Records */}
      <div
        className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}
      >
        <div className="relative w-full lg:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            aria-label="Search student by name"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-[11px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {SCORE_LEGEND.map((entry) => (
            <span
              key={entry.label}
              className="flex items-center gap-1 text-[11px] font-bold"
              style={{ color: entry.color }}
            >
              <i
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </span>
          ))}

          <span
            className={`hidden h-5 w-px lg:block ${darkMode ? "bg-white/10" : "bg-black/10"}`}
          />

          {tab !== "exams" && (
            <button
              onClick={() => setTopicManagerOpen(true)}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-colors ${
                darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
              }`}
            >
              <Tag size={12} style={{ color: ACCENT }} />
              Topics
            </button>
          )}
          <button
            onClick={onOpenRecords}
            className={`flex h-8 items-center gap-1.5 rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            <ClipboardList size={12} />
            Full Records
          </button>
        </div>
      </div>

      {/* Score sheet */}
      <section className={cardClasses} aria-label={subjectName}>
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}
            >
              <ClipboardList size={13} style={{ color: ACCENT }} />
              Score Sheet
            </p>
            <p className={`truncate text-[11px] font-medium ${textMuted}`}>
              · {tabItems.length} item{tabItems.length === 1 ? "" : "s"} ·{" "}
              {filtered.length} student{filtered.length === 1 ? "" : "s"}
              {isDirty && (
                <span className="ml-1 font-extrabold" style={{ color: ACCENT }}>
                  · Unsaved changes
                </span>
              )}
            </p>
          </div>

          <div role="group" aria-label="Item actions" className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className={toolButton}>
              {savedFlash ? (
                <CheckCircle2 size={12} className="text-emerald-500" />
              ) : (
                <Save size={12} style={{ color: ACCENT }} />
              )}
              {saving ? "Saving..." : savedFlash ? "Saved" : "Save"}
            </button>

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
              className={`flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-extrabold text-[#DC2626] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                darkMode
                  ? "border-white/10 bg-white/5 enabled:hover:bg-[#DC2626]/15"
                  : "border-black/10 bg-white enabled:hover:bg-[#FEF2F2]"
              }`}
            >
              <Trash2 size={12} />
              Delete
            </button>

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
                  ? "Save scores for the current item before adding a new one"
                  : "Add item"
              }
              className={toolButton}
            >
              <Plus size={12} style={{ color: ACCENT }} />
              Add Item
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>
            No students found matching "{search}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-56 px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {tabItems.length === 0 ? (
                    <th
                      className={`px-4 py-2 text-left text-[11px] font-bold ${textMuted}`}
                    >
                      No items yet — tap Add Item
                    </th>
                  ) : (
                    tabItems.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      return (
                        <th key={item.id} className="min-w-32 px-1.5 py-1.5 align-top">
                          <button
                            onClick={() =>
                              setSelectedItemId(isSelected ? null : item.id)
                            }
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Select ${item.activityName} on ${formatDisplayDate(item.date)} to enable delete`}
                            className={`w-full rounded-lg border px-2 py-1.5 text-center transition-colors focus:outline-none focus-visible:ring-2 ${
                              isSelected
                                ? darkMode
                                  ? "border-[#F87171] bg-[#F87171]/10"
                                  : "border-[#DC2626] bg-[#FEF2F2]"
                                : darkMode
                                  ? "border-white/10 hover:bg-white/5"
                                  : "border-black/10 hover:bg-black/5"
                            }`}
                            style={
                              { "--tw-ring-color": `${ACCENT}55` } as CSSProperties
                            }
                          >
                            <div className="relative flex min-h-4 items-center justify-center">
                              <p
                                className={`text-[11px] font-black leading-none ${textPrimary}`}
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
                              className="mt-1 truncate text-[10px] font-bold leading-none"
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
                {grouped.male.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={columnCount} className={groupBand}>
                        Male
                      </td>
                    </tr>
                    {grouped.male.map((student) => renderStudentRow(student))}
                  </>
                )}

                {grouped.female.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={columnCount} className={groupBand}>
                        Female
                      </td>
                    </tr>
                    {grouped.female.map((student) => renderStudentRow(student))}
                  </>
                )}
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
            onTopicsChanged={() => {}}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textMuted={textMuted}
          />
        )}

        {toast && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl"
          >
            {toast}
          </div>
        )}
      </section>
    </div>
  );
}