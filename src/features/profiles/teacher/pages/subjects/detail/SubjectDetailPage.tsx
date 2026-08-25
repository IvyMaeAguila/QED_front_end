import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { RosterStudent } from "./data";
import type {
  AttendanceMap,
  GradeItem,
  GradingPeriod,
  HolisticAxisKey,
  HolisticMap,
  ScoreMap,
} from "./types/Grading";
import { TabNav, type SubjectDetailTab } from "./components/TabNav";
import { AttendanceTab } from "./components/AttendanceTab";
import { AssessmentTab } from "./components/AssessmentTab";
import { HolisticTab } from "./components/HolisticTab";
import { ConfirmDialog } from "./components/ConfirmDialog";
import {
  fetchSubjectSectionInfo,
  fetchAttendance,
  saveAttendance,
  fetchItems,
  addItem as addItemApi,
  deleteItem,
  fetchScores,
  saveScore,
  fetchHolistic,
  saveHolistic,
  fetchGradingPeriods,
} from "../services/subjectGrading.service";
import {
  getCachedSubjectDetail,
  setCachedSubjectDetail,
  patchCachedSubjectDetail,
} from "../services/subjectDetailCache.service";
import { inferSubjectCategory } from "./utils/GradeWeights";


export function SubjectDetailPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();

  const [activeTab, setActiveTab] = useState<SubjectDetailTab>("attendance");

  const [subjectName, setSubjectName] = useState<string>("");
  const [subjectCode, setSubjectCode] = useState<string>("");
  const [subjectCategory, setSubjectCategory] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [items, setItems] = useState<GradeItem[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [holistic, setHolistic] = useState<HolisticMap>({});
  const [holisticWeekStartDate, setHolisticWeekStartDate] =
    useState<string>("");
  const [holisticTermNumber] = useState(1);
  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  function guardedNavigate(action: () => void) {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    setPendingAction(() => action);
  }

  function handleBack() {
    guardedNavigate(() => navigate(-1));
  }

  function handleTabChange(next: SubjectDetailTab) {
    guardedNavigate(() => setActiveTab(next));
  }

  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;

    const cached = getCachedSubjectDetail(subjectId);
    if (cached) {
      setSubjectName(cached.subjectName);
      setSubjectCode(cached.subjectCode);
      setSubjectCategory(cached.subjectCategory);
      setGradeLevel(cached.gradeLevel);
      setRoster(cached.roster);
      setAttendance(cached.attendance);
      setItems(cached.items);
      setScores(cached.scores);
      setHolistic(cached.holistic);
      setHolisticWeekStartDate(cached.holisticWeekStartDate);
      setTerms(cached.terms);
      setSelectedTerm(cached.selectedTerm);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const loadAll = async () => {
      setLoading(true);
      setError(null);

      const [
        infoResult,
        termsResult,
        itemsResult,
        scoresResult,
        holisticResult,
      ] = await Promise.allSettled([
        fetchSubjectSectionInfo(subjectId),
        fetchGradingPeriods(),
        fetchItems(subjectId, { allPeriods: true }),
        fetchScores(subjectId),
        fetchHolistic(subjectId),
      ]);

      if (cancelled) return;

      if (infoResult.status === "rejected") {
        console.error("Failed to load subject info:", infoResult.reason);
        setError("Failed to load this class. You may not have access to it.");
        setLoading(false);
        return;
      }

      const info = infoResult.value;
      const nextSubjectName = info.subjectName.toUpperCase();
      const nextSubjectCode = `${info.subjectName.replace(/\s+/g, "").toUpperCase().slice(0, 4)}101`;
      const nextSubjectCategory = inferSubjectCategory(info.subjectName);
      const nextGradeLevel = info.gradeLevel;
      const nextRoster = info.roster;

      setSubjectName(nextSubjectName);
      setSubjectCode(nextSubjectCode);
      setSubjectCategory(nextSubjectCategory);
      setGradeLevel(nextGradeLevel);
      setRoster(nextRoster);

      let nextTerms: GradingPeriod[] = [];
      let nextSelectedTerm = "";
      if (termsResult.status === "fulfilled") {
        nextTerms = termsResult.value;
        nextSelectedTerm =
          nextTerms.find((t) => t.isActive)?.id ?? nextTerms[0]?.id ?? "";
        setTerms(nextTerms);
        setSelectedTerm(nextSelectedTerm);
      } else {
        console.error("Failed to load grading periods:", termsResult.reason);
      }

      let nextItems: GradeItem[] = [];
      if (itemsResult.status === "fulfilled") {
        nextItems = itemsResult.value;
        setItems(nextItems);
      } else {
        console.error("Failed to load items:", itemsResult.reason);
      }

      let nextScores: ScoreMap = {};
      if (scoresResult.status === "fulfilled") {
        nextScores = scoresResult.value;
        setScores(nextScores);
      } else {
        console.error("Failed to load scores:", scoresResult.reason);
      }

      let nextHolistic: HolisticMap = {};
      let nextHolisticWeekStartDate = "";
      if (holisticResult.status === "fulfilled") {
        nextHolistic = holisticResult.value.data;
        nextHolisticWeekStartDate = holisticResult.value.weekStartDate;
        setHolistic(nextHolistic);
        setHolisticWeekStartDate(nextHolisticWeekStartDate);
      } else {
        console.error(
          "Failed to load holistic ratings:",
          holisticResult.reason,
        );
      }

      let nextAttendance: AttendanceMap = {};
      try {
        const att = await fetchAttendance(subjectId);
        if (cancelled) return;
        nextAttendance = att.data;
        setAttendance(nextAttendance);
      } catch (err) {
        console.error("Failed to load attendance:", err);
      }

      if (cancelled) return;

      setCachedSubjectDetail(subjectId, {
        subjectName: nextSubjectName,
        subjectCode: nextSubjectCode,
        subjectCategory: nextSubjectCategory,
        gradeLevel: nextGradeLevel,
        roster: nextRoster,
        attendance: nextAttendance,
        items: nextItems,
        scores: nextScores,
        holistic: nextHolistic,
        holisticWeekStartDate: nextHolisticWeekStartDate,
        terms: nextTerms,
        selectedTerm: nextSelectedTerm,
      });

      setLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  async function handleAttendanceChange(
    studentId: string,
    dateISO: string,
    status: AttendanceMap[string][string],
  ) {
    setAttendance((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...prev[studentId], [dateISO]: status },
      };
      if (subjectId) patchCachedSubjectDetail(subjectId, { attendance: next });
      return next;
    });

    if (!subjectId) return;
    try {
      await saveAttendance(subjectId, studentId, dateISO, status);
    } catch (err) {
      console.error("Failed to save attendance:", err);
    }
  }

  async function handleAddItem(item: GradeItem) {
    if (!subjectId) return;
    try {
      const { id } = await addItemApi(subjectId, {
        tab: item.tab,
        date: item.date,
        activityName: item.activityName,
        topic: item.topic,
        topicId: item.topicId,
        format: item.format,
        examType: item.examType,
        maxItems: item.maxItems,
        term: selectedTerm,
      });
      setItems((prev) => {
        const next = [...prev, { ...item, id, gradingPeriodId: selectedTerm }];
        patchCachedSubjectDetail(subjectId, { items: next });
        return next;
      });
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      if (subjectId) patchCachedSubjectDetail(subjectId, { items: next });
      return next;
    });

    if (!subjectId) return;

    try {
      await deleteItem(subjectId, itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
      try {
        const refreshed = await fetchItems(subjectId, { allPeriods: true });
        setItems(refreshed);
        patchCachedSubjectDetail(subjectId, { items: refreshed });
      } catch (refetchErr) {
        console.error(
          "Failed to refresh items after failed delete:",
          refetchErr,
        );
      }
    }
  }

  async function handleScoreChange(
    studentId: string,
    itemId: string,
    value: number | null,
  ) {
    setScores((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...prev[studentId], [itemId]: value },
      };
      if (subjectId) patchCachedSubjectDetail(subjectId, { scores: next });
      return next;
    });

    if (!subjectId) return;
    try {
      await saveScore(subjectId, studentId, itemId, value);
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  }

  async function handleHolisticRate(
    studentId: string,
    axis: HolisticAxisKey,
    value: number,
  ) {
    setHolistic((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...prev[studentId], [axis]: value },
      };
      if (subjectId) patchCachedSubjectDetail(subjectId, { holistic: next });
      return next;
    });

    if (!subjectId) return;
    try {
      await saveHolistic(subjectId, studentId, axis, value, holisticTermNumber);
    } catch (err) {
      console.error("Failed to save holistic rating:", err);
    }
  }

  function openRecords() {
    guardedNavigate(() => {
      navigate(`/teacher/subjects/${subjectId}/records`, {
        state: {
          subjectName,
          subjectCategory,
          gradeLevel,
          tab: activeTab,
          roster,
          items,
          scores,
          attendance,
          holistic,
          terms,
          selectedTerm,
        },
      });
    });
  }

  const shimmer = `relative overflow-hidden rounded-lg ${darkMode ? "bg-white/[0.06]" : "bg-black/[0.06]"}`;
  const shimmerSweep = (
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
      style={{
        background: darkMode
          ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
      }}
    />
  );

  const Bone = ({ className = "" }: { className?: string }) => (
    <div className={`${shimmer} ${className}`}>{shimmerSweep}</div>
  );

  if (loading) {
    const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="flex items-center gap-4">
          <div className={`shrink-0 ${textMuted}`}>
            <ArrowLeft size={22} className="opacity-30" />
          </div>
          <div className="min-w-0 flex-1">
            <Bone className="h-8 w-64" />
            <Bone className="h-4 w-24 mt-2" />
          </div>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Bone className="h-9 w-9 rounded-xl" />
                  <Bone className="h-3 w-16" />
                </div>
              ))}
            </div>
            <Bone className="h-3 w-28 mt-3" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Bone className="h-11 w-40 rounded-xl" />
            <Bone className="h-11 w-24 rounded-xl" />
          </div>
        </div>

        <section className={cardClasses}>
          <div
            className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}
          >
            <div className="flex items-start gap-3">
              <Bone className="h-10 w-10 rounded-xl shrink-0" />
              <div>
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-40 mt-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bone className="h-10 w-44 rounded-xl" />
              <Bone className="h-10 w-10 rounded-xl shrink-0" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-60 px-5 py-4 text-left ${darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"}`}
                  >
                    <Bone className="h-3 w-16" />
                  </th>
                  <th className="min-w-28 px-3 py-4 text-center">
                    <Bone className="h-3 w-14 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map((row) => (
                  <tr key={row} className={`border-t ${panelBorder}`}>
                    <td
                      className={`sticky left-0 z-10 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Bone className="h-9 w-9 rounded-full shrink-0" />
                        <div className="min-w-0">
                          <Bone className="h-4 w-32" />
                          <Bone className="h-3 w-20 mt-1.5" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Bone className="h-7 w-11 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-bold ${textMuted}`}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div
          className={`rounded-2xl border p-8 text-center ${panelBg} ${panelBorder}`}
        >
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!subjectId) {
    return (
      <div className={`max-w-6xl mx-auto p-8 ${textPrimary}`}>
        No subject selected.
      </div>
    );
  }

  const holisticLocked = [0, 6].includes(new Date().getDay());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className={`shrink-0 transition-colors ${textMuted} hover:${textPrimary}`}
        >
          <ArrowLeft size={22} />
        </button>

        <div className="min-w-0">
          <h1
            className={`text-3xl font-black tracking-tight truncate ${textPrimary}`}
          >
            {subjectName}
          </h1>
          <p className={`text-sm font-medium mt-0.5 ${textMuted}`}>
            {subjectCode}
          </p>
        </div>
      </div>

      <TabNav
        active={activeTab}
        onChange={handleTabChange}
        darkMode={darkMode}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      {activeTab === "attendance" && (
        <AttendanceTab
          roster={roster}
          attendance={attendance}
          onChange={handleAttendanceChange}
          onOpenRecords={openRecords}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {(activeTab === "writtenWorks" ||
        activeTab === "performanceTask" ||
        activeTab === "exams") && (
        <AssessmentTab
          subjectSectionId={subjectId}
          subjectName={subjectName}
          tab={activeTab}
          roster={roster}
          items={items}
          scores={scores}
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onScoreChange={handleScoreChange}
          onOpenRecords={openRecords}
          onDirtyChange={setHasUnsavedChanges}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {activeTab === "holistic" && (
        <HolisticTab
          roster={roster}
          ratings={holistic}
          weekStartDate={holisticWeekStartDate}
          termNumber={holisticTermNumber}
          locked={holisticLocked}
          onRate={handleHolisticRate}
          onOpenRecords={openRecords}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          title="Leave without saving?"
          message="You have scores that haven't been saved yet. If you leave now, those changes will be lost."
          confirmLabel="Leave anyway"
          danger
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            action();
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
