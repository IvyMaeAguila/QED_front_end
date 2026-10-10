import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText, SkeletonAvatar, SkeletonControl } from "@shared/components/SkeletonLoading";
import { skeletonRows, rememberRows, rememberColumns, useColumnReservation, lastKnownCount } from "@shared/loading/reservations";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import {
  CheckCircle2,
  ClipboardList,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { RosterStudent } from "../data";
import type { TemplateDomain } from "../../../../../shared/grading/gradeTemplate.types";
import type { ExamType } from "../types/Grading";

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

const ACCENT = "var(--color-maroon)";

const SCORE_LEGEND = [
  { label: "90% and up", color: "#157F3B" },
  { label: "80-89%", color: "var(--semantic-success)" },
  { label: "75-79%", color: "#B45309" },
  { label: "Below 75%", color: "var(--semantic-error)" },
];

interface AssessmentTabProps {
  loading?: boolean;
  templateLoading?: boolean;
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
  templateDomains?: TemplateDomain[];
  examTypes?: ExamType[];
}

const scoreStyle = (percent: number | null) => {
  if (percent === null) return { color: "#6B7280", background: "var(--surface-page)" };
  if (percent >= 90) return { color: "#157F3B", background: "#EAF8EF" };
  if (percent >= 80) return { color: "var(--semantic-success)", background: "color-mix(in srgb, var(--semantic-success) 8%, white)" };
  if (percent >= 75) return { color: "#B45309", background: "#FFF4DB" };
  return { color: "var(--semantic-error)", background: "color-mix(in srgb, var(--semantic-error) 8%, white)" };
};

export function AssessmentTab({
  loading = false,
  templateLoading = false,
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
  templateDomains = [],
  examTypes,
}: AssessmentTabProps) {
  const view = `subject-${subjectSectionId}-${tab}`;
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



  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const stickyCell = darkMode ? "bg-panel-dark" : "bg-white";
  const groupBand = `px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-brand-light"
  } ${textPrimary}`;
  const toolButton = `flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    darkMode
      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
      : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
  }`;

  const tableRoot = useRef<HTMLDivElement>(null);
  const rowCount = skeletonRows(view, undefined, 44);
  const pendingRoster: GenderedStudent[] = Array.from({ length: rowCount }, (_, index) => ({ id: `pending-${index}`, name: "", gender: index < Math.ceil(rowCount / 2) ? "M" : "F" }));
  const pendingItems: GradeItem[] = Array.from({ length: lastKnownCount(`${view}-items`, 1) }, (_, index) => ({ id: `pending-item-${index}`, tab, date: "2026-01-01", activityName: "", topic: "", format: "", maxItems: 0, gradingPeriodId: null }));
  const columnLabels = [{ label: "Student", typical: "Student full name" }, ...(loading ? pendingItems : tabItems).map(() => ({ label: "", typical: "Assessment topic" }))];
  const columnWidths = useColumnReservation(view, columnLabels, loading);
  function renderStudentRow(student: GenderedStudent, pending = false, visibleItems = tabItems) {
    return (
      <tr
        key={student.id}
        data-sk-region="assessment-student-row" data-sk-variable=""
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
      >
        <td className={`sticky left-0 z-10 px-4 py-2 ${stickyCell}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span data-sk-region="student-avatar" className="inline-flex h-7 w-7 shrink-0">{pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={student.gender} name={student.name} />}</span>
            <span className={`truncate text-xs font-bold ${textPrimary}`}>
              {pending ? <SkeletonText className={Number(student.id.split("-").at(-1)) % 2 === 0 ? "w-[14ch]" : "w-[11ch]"} /> : student.name}
            </span>
          </div>
        </td>
        {visibleItems.map((item) => {
          const value = draftScores[student.id]?.[item.id] ?? null;
          const percent = value !== null ? (value / item.maxItems) * 100 : null;
          const style = scoreStyle(percent);
          return (
            <td key={item.id} className="px-3 py-2 text-center">
              {pending ? <SkeletonControl className="h-7 w-14 rounded-lg mx-auto" /> : <input
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
                className="h-7 w-14 rounded-lg text-center text-xs font-black tabular-nums outline-none transition-colors focus:ring-2"
                style={
                  {
                    backgroundColor:
                      darkMode && value !== null
                        ? `color-mix(in srgb, ${style.color} 14.51%, transparent)`
                        : darkMode
                          ? "#ffffff10"
                          : style.background,
                    color: value !== null ? style.color : "#9CA3AF",
                    "--tw-ring-color": `color-mix(in srgb, ${ACCENT} 33.33%, transparent)`,
                  } as CSSProperties
                }
              />}
            </td>
          );
        })}
      </tr>
    );
  }

  function renderTable(pending: boolean) {
    const visibleRoster = pending ? pendingRoster : filtered;
    const grouped = { male: visibleRoster.filter(student => !isFemale(student)), female: visibleRoster.filter(isFemale) };
    const tabItems = pending ? pendingItems : items.filter(item => item.tab === tab && !roster.some(student => typeof scores[student.id]?.[item.id] === "number"));
    const columnCount = 1 + Math.max(tabItems.length, 1);
      return (!pending && filtered.length === 0 ? (
          <p className={`px-4 py-5 text-center text-xs font-medium ${textMuted}`}>
            No students found matching "{search}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table data-sk-region="assessment-table" className="teacher-user-table w-full min-w-max text-sm">
              {pending && <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
              <thead>
                <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                  <th
                    className={`sticky left-0 z-10 min-w-56 px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${
                      darkMode ? "bg-panel-dark" : "bg-brand-light"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {tabItems.length === 0 ? (
                    <th
                      className={`px-4 py-2 text-left text-xs font-bold ${textMuted}`}
                    >
                      No items yet — tap Add Item
                    </th>
                  ) : (
                    tabItems.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      return (
                        <th key={item.id} className="min-w-32 px-1.5 py-1.5 align-top">
                          <button
                            disabled={pending} onClick={() =>
                              setSelectedItemId(isSelected ? null : item.id)
                            }
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={pending ? undefined : `Select ${item.activityName} on ${formatDisplayDate(item.date)} to enable delete`}
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
                              { "--tw-ring-color": `color-mix(in srgb, ${ACCENT} 33.33%, transparent)` } as CSSProperties
                            }
                          >
                            <div className="relative flex min-h-4 items-center justify-center">
                              <p
                                className={`text-xs font-black leading-none ${textPrimary}`}
                              >
                                {pending ? <SkeletonText className="w-[8ch]" /> : formatDisplayDate(item.date)}
                              </p>
                              <span
                                className={`absolute right-0 shrink-0 rounded-full bg-[#DC2626] px-1.5 py-0.5 text-xs font-black uppercase tracking-wide text-white transition-opacity ${
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
                                className={`mt-1 truncate text-xs font-semibold leading-none ${textMuted}`}
                                title={item.activityName}
                              >
                                {pending ? <SkeletonText className="w-[12ch]" /> : <>{item.activityName} · {item.maxItems} pts</>}
                              </p>
                            )}

                            <p
                              className="mt-1 truncate text-xs font-bold leading-none"
                              style={{ color: "var(--brand-ink)" }}
                              title={item.topic}
                            >
                              {pending ? <SkeletonText className="w-[10ch]" /> : <>{item.topic}{isWrittenWorks ? ` · ${item.maxItems} pts` : ""}</>}
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
                    {grouped.male.map((student) => renderStudentRow(student, pending, tabItems))}
                  </>
                )}

                {grouped.female.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={columnCount} className={groupBand}>
                        Female
                      </td>
                    </tr>
                    {grouped.female.map((student) => renderStudentRow(student, pending, tabItems))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ));
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
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {SCORE_LEGEND.map((entry) => (
            <span
              key={entry.label}
              className="flex items-center gap-1 text-xs font-bold"
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
              disabled={loading} onClick={() => setTopicManagerOpen(true)}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                darkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
              }`}
            >
              <Tag size={12} style={{ color: "var(--brand-ink)" }} />
              Topics
            </button>
          )}
          <button
            disabled={loading} onClick={onOpenRecords}
            className={`flex h-8 items-center gap-1.5 rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light ${
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
              <ClipboardList size={13} style={{ color: "var(--brand-ink)" }} />
              Score Sheet
            </p>
            <p className={`truncate text-xs font-medium ${textMuted}`}>
              <LoadingRegion as="span" loading={loading} name="assessment-metadata" skeleton={<SkeletonText className="w-[20ch]" />}>{<>· {tabItems.length} item{tabItems.length === 1 ? "" : "s"} · {filtered.length} student{filtered.length === 1 ? "" : "s"}</>}</LoadingRegion>
              {isDirty && (
                <span className="ml-1 font-extrabold" style={{ color: "var(--brand-ink)" }}>
                  · Unsaved changes
                </span>
              )}
            </p>
          </div>

          <div role="group" aria-label="Item actions" className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || loading} className={toolButton}>
              {savedFlash ? (
                <CheckCircle2 size={12} className="text-emerald-500" />
              ) : (
                <Save size={12} style={{ color: "var(--brand-ink)" }} />
              )}
              {saving ? "Saving..." : savedFlash ? "Saved" : "Save"}
            </button>

            <button
              onClick={() => selectedItem && setConfirmingDelete(true)}
              disabled={!selectedItem || loading}
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
              className={`flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-extrabold text-[#DC2626] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
              disabled={loading || templateLoading || tabItems.length > 0}
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
              <Plus size={12} style={{ color: "var(--brand-ink)" }} />
              Add Item
            </button>
          </div>
        </div>

        <div ref={tableRoot}><LoadingRegion loading={loading} variable autoColumns name="assessment-roster" retainPrevious hasContent={filtered.length > 0} skeleton={null} frame={renderTable} onSettled={() => { rememberRows(view, filtered.length); rememberColumns(view, tableRoot.current?.querySelector("table") ?? null); rememberRows(`${view}-items`, tabItems.length); }}>{null}</LoadingRegion></div>

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
            templateDomains={templateDomains}
            examTypes={examTypes}
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
