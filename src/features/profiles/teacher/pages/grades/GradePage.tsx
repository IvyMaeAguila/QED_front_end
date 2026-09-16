import { Fragment, useEffect, useMemo, useState } from "react";
import {
  BookOpen, Search, User, CheckCircle2, AlertTriangle,
  Download, Send, Loader2, Clock,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { FilterDropdown } from "@shared/components/FilterDropdown";
import { fetchGradingPeriods } from "../subjects/services/subjectGrading.service"; 
import {
  fetchAdvisoryGradebook,
  fetchClassSubmissionStatus,
  submitClassGrades,
  type AdvisoryGradebook,
  type GradebookStudent,
} from "./services/gradePage.service";
import type { GradingPeriod } from "../subjects/detail/types/Grading";
import { ParentVisibilitySection } from "./ParentVisibilitySection";

const ACCENT = "#6B0000";
const FILTER_OPTIONS = ["All Students", "Highest Grades", "Lowest Grades", "Boys", "Girls"];

const gradeTextColor = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined) return "text-gray-400 dark:text-gray-500";
  return "text-[#800000]";
};

function studentDisplayName(s: { firstName: string; lastName: string; middleName: string | null }) {
  const mi = s.middleName ? ` ${s.middleName.charAt(0)}.` : "";
  return `${s.lastName}, ${s.firstName}${mi}`;
}

function overallAverage(student: GradebookStudent, subjects: AdvisoryGradebook["subjects"]): number | null {
  const vals = subjects
    .map((s) => student.grades[s.subjectSectionId]?.average)
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}

function cellDisplayValue(cell: { status: string; average: number | null; isOwnAdvisory?: boolean } | undefined): string | number {
  if (!cell) return "Not Submitted";
  if (cell.status === "submitted") return cell.average ?? "—";
  if (cell.status === "pending") return "Pending";
  return cell.isOwnAdvisory ? "No Grades Yet" : "Not Submitted";
}

function toCSV(gradebook: AdvisoryGradebook) {
  const header = ["Student", "Student ID", ...gradebook.subjects.map((s) => s.subjectName), "Overall Average"];
  const rows: (string | number)[][] = [header];

  const male = gradebook.students
    .filter((s) => s.gender === "M")
    .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
  const female = gradebook.students
    .filter((s) => s.gender === "F")
    .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));

  const groups: { label: "Male" | "Female"; students: typeof gradebook.students }[] = [];
  if (male.length) groups.push({ label: "Male", students: male });
  if (female.length) groups.push({ label: "Female", students: female });

  groups.forEach((group) => {
    rows.push([group.label, "", ...gradebook.subjects.map(() => ""), ""]);
    group.students.forEach((student) => {
      rows.push([
        studentDisplayName(student),
        student.studentId,
        ...gradebook.subjects.map((s) => cellDisplayValue(student.grades[s.subjectSectionId])),
        overallAverage(student, gradebook.subjects) ?? "",
      ]);
    });
  });

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function GradesPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { students } = useStudents();

  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState(FILTER_OPTIONS[0]);

  const [gradebook, setGradebook] = useState<AdvisoryGradebook | null>(null);
  const [gradebookLoading, setGradebookLoading] = useState(true);
  const [gradebookError, setGradebookError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<"gradebook" | "visibility">("gradebook");

  // Load real grading periods (reused from subjectGrading.service)
  useEffect(() => {
    fetchGradingPeriods()
      .then((periods) => {
        setTerms(periods);
        const active = periods.find((p) => p.isActive) ?? periods[0];
        if (active) setSelectedTermId(active.id);
      })
      .catch((err) => console.error("Failed to load grading periods:", err));
  }, []);

  // Load real gradebook once we know the term (section comes from the JWT server-side)
  useEffect(() => {
    if (!selectedTermId) return;
    let cancelled = false;
    setGradebookLoading(true);
    setGradebookError(null);
    fetchAdvisoryGradebook(selectedTermId)
      .then((data) => !cancelled && setGradebook(data))
      .catch((err) => {
        console.error("Failed to load advisory gradebook:", err);
        if (!cancelled) setGradebookError("Failed to load grade records for this term.");
      })
      .finally(() => !cancelled && setGradebookLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedTermId]);

  // Load submission status
  useEffect(() => {
    if (!selectedTermId) return;
    let cancelled = false;
    fetchClassSubmissionStatus(selectedTermId)
      .then((status) => {
        if (cancelled) return;
        setSubmitted(status.submitted);
        setSubmittedAt(status.submittedAt);
      })
      .catch((err) => console.error("Failed to load submission status:", err));
    return () => {
      cancelled = true;
    };
  }, [selectedTermId]);

  // "Complete" now means every subject has actually been SUBMITTED by its
  // subject teacher — not just that scores are fully entered. A subject
  // that's fully scored but sitting at "pending" (not yet submitted) does
  // NOT count as complete here; that's the whole point of the
  // submission-based sync rule.
  const allComplete = useMemo(() => {
    if (!gradebook) return false;
    return gradebook.students.every((student) =>
      gradebook.subjects.every((s) => student.grades[s.subjectSectionId]?.status === "submitted")
    );
  }, [gradebook]);

  const incompleteSubjectCount = useMemo(() => {
    if (!gradebook) return 0;
    return gradebook.subjects.filter(
      (s) => !gradebook.students.every((student) => student.grades[s.subjectSectionId]?.status === "submitted")
    ).length;
  }, [gradebook]);

  async function handleSubmit() {
    if (!selectedTermId) return;
    setSubmitting(true);
    try {
      await submitClassGrades(selectedTermId);
      setSubmitted(true);
      setSubmittedAt(new Date().toISOString());
    } catch (err) {
      console.error("Failed to submit class grades:", err);
    } finally {
      setSubmitting(false);
      setShowForceConfirm(false);
    }
  }

  function handleExport() {
    if (!gradebook) return;
    const termLabel = terms.find((t) => t.id === selectedTermId)?.label ?? "term";
    downloadCSV(toCSV(gradebook), `${gradebook.sectionName || "advisory"}_${termLabel.replace(/\s+/g, "_")}_gradebook.csv`);
  }

  const filteredStudents = useMemo(() => {
    if (!gradebook) return [];
    let result = gradebook.students.filter((s) =>
      studentDisplayName(s).toLowerCase().includes(search.toLowerCase())
    );

    if (studentFilter === "Highest Grades" || studentFilter === "Lowest Grades") {
      result = [...result].sort((a, b) => {
        const diff = (overallAverage(b, gradebook.subjects) ?? 0) - (overallAverage(a, gradebook.subjects) ?? 0);
        return studentFilter === "Highest Grades" ? diff : -diff;
      });
    } else if (studentFilter === "Boys" || studentFilter === "Girls") {
      const wanted = studentFilter === "Boys" ? "M" : "F";
      result = result.filter((s) => s.gender === wanted);
    }

    return result;
  }, [gradebook, search, studentFilter]);

  const groupedStudents = useMemo(() => {
    const male = filteredStudents
      .filter((s) => s.gender === "M")
      .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
    const female = filteredStudents
      .filter((s) => s.gender === "F")
      .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));

    const groups: { label: "Male" | "Female"; students: GradebookStudent[] }[] = [];
    if (male.length) groups.push({ label: "Male", students: male });
    if (female.length) groups.push({ label: "Female", students: female });
    return groups;
  }, [filteredStudents]);

  const gradeLevel = gradebook?.gradeLevel ?? students[0]?.gradeLevel ?? "";
  const isMatatag = /(?:grade\s*)?[1-3](?!\d)/i.test(gradeLevel);
  const curriculum = isMatatag ? "Matatag Curriculum" : "Intermediate Grades";
  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;
  const columnCount = 2 + (gradebook?.subjects.length ?? 0);

  return (
    <div className="w-full min-h-full pb-12">
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
              <BookOpen size={28} />
            </span>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>Gradebook</h1>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {gradeLevel || "Advisory class"} · {curriculum}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center self-start rounded-lg border p-0.5 sm:self-center ${panelBg} ${panelBorder}`}
          >
            <button
              onClick={() => setActiveTab("gradebook")}
              className={`h-7 rounded-md px-3 text-[11px] font-bold transition-colors ${
                activeTab === "gradebook" ? "bg-[#800000] text-white" : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Gradebook
            </button>
            <button
              onClick={() => setActiveTab("visibility")}
              className={`h-7 rounded-md px-3 text-[11px] font-bold transition-colors ${
                activeTab === "visibility" ? "bg-[#800000] text-white" : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Parent Visibility
            </button>
          </div>
        </div>

        {activeTab === "gradebook" ? (
          <>
            {/* Completeness + Submit + Export strip */}
            <div
              className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {gradebookLoading ? (
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold ${textMuted}`}>
                    <Loader2 size={12} className="animate-spin" /> Checking records…
                  </span>
                ) : allComplete ? (
                  <span
                    className="flex items-center gap-1.5 rounded-lg border border-[#157F3B]/25 bg-[#157F3B]/5 px-2.5 py-1 text-[11px] font-bold text-[#157F3B]"
                  >
                    <CheckCircle2 size={12} /> Official · All subjects submitted
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1.5 rounded-lg border border-[#C2255C]/25 bg-[#C2255C]/5 px-2.5 py-1 text-[11px] font-bold text-[#C2255C]"
                  >
                    <AlertTriangle size={12} />
                    Not yet official · {incompleteSubjectCount} subject{incompleteSubjectCount === 1 ? "" : "s"} not submitted
                  </span>
                )}
                {submitted && (
                  <span className={`text-[11px] font-medium ${textMuted}`}>
                    Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={!gradebook}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-colors disabled:opacity-50 ${
                    darkMode
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
                  }`}
                >
                  <Download size={12} /> Export CSV
                </button>
                <button
                  onClick={() => (allComplete ? handleSubmit() : setShowForceConfirm(true))}
                  disabled={submitting || gradebookLoading || !gradebook}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000] disabled:opacity-60 ${
                    darkMode ? "border-white/10" : "border-black/10"
                  }`}
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {submitted ? "Re-submit Class Grades" : "Submit Class Grades"}
                </button>
              </div>
            </div>

            {showForceConfirm && (
              <div className={`rounded-xl border px-4 py-3 ${panelBg} ${panelBorder}`}>
                <p className={`text-xs font-bold ${textPrimary}`}>Submit incomplete grades?</p>
                <p className={`mt-1 text-[11px] font-medium ${textMuted}`}>
                  One or more subjects still haven't been submitted by their subject teacher yet. You can submit
                  now and reconcile later, or cancel and follow up with the subject teachers first.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => setShowForceConfirm(false)}
                    className={`flex h-8 items-center rounded-lg border px-3 text-[11px] font-bold transition-colors ${
                      darkMode
                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex h-8 items-center rounded-lg bg-[#800000] px-3 text-[11px] font-extrabold text-white transition-colors hover:bg-[#650000]"
                  >
                    Submit anyway
                  </button>
                </div>
              </div>
            )}

            {/* Search + filter + term strip */}
            <div
              className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}
            >
              <div className="relative w-full lg:w-64">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                  <Search size={13} />
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student..."
                  aria-label="Search student by name"
                  className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-[11px] font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterDropdown label="Filter" value={studentFilter} options={FILTER_OPTIONS} onChange={setStudentFilter} darkMode={darkMode} />
                <FilterDropdown
                  label="Term"
                  value={terms.find((t) => t.id === selectedTermId)?.label ?? ""}
                  options={terms.map((t) => t.label)}
                  onChange={(label) => {
                    const match = terms.find((t) => t.label === label);
                    if (match) setSelectedTermId(match.id);
                  }}
                  darkMode={darkMode}
                />
              </div>
            </div>

            <section className={cardClasses} aria-label="Advisory class grades">
              <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textPrimary}`}>
                    <BookOpen size={13} style={{ color: ACCENT }} />
                    {gradebook?.sectionName || "Advisory Class"}
                  </p>
                  <p className={`truncate text-[11px] font-medium ${textMuted}`}>
                    · {terms.find((t) => t.id === selectedTermId)?.label ?? "—"} · {filteredStudents.length} student
                    {filteredStudents.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {gradebookLoading ? (
                <div className="px-4 py-16 text-center">
                  <Loader2 size={18} className={`mx-auto animate-spin ${textMuted}`} />
                </div>
              ) : gradebookError ? (
                <p className="px-4 py-16 text-center text-xs font-bold text-red-500">{gradebookError}</p>
              ) : !gradebook || filteredStudents.length === 0 ? (
                <p className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>
                  No records found matching "{search}".
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
                        {gradebook.subjects.map((subject) => (
                          <th
                            key={subject.subjectSectionId}
                            className={`min-w-28 px-3 py-2 text-center text-[11px] font-black uppercase tracking-wider ${textMuted}`}
                          >
                            {subject.subjectName}
                          </th>
                        ))}
                        <th className={`min-w-28 px-3 py-2 text-center text-[11px] font-black uppercase tracking-wider ${textMuted}`}>
                          Overall Average
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedStudents.map((group) => (
                        <Fragment key={group.label}>
                          <tr>
                            <td colSpan={columnCount} className={groupBand}>
                              {group.label} · {group.students.length} student{group.students.length === 1 ? "" : "s"}
                            </td>
                          </tr>
                          {group.students.map((student) => (
                            <tr
                              key={student.studentId}
                              className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
                            >
                              <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                      darkMode ? "bg-white/10" : "bg-black/5"
                                    } ${textMuted}`}
                                  >
                                    <User size={13} />
                                  </span>
                                  <span className={`truncate text-xs font-bold ${textPrimary}`}>
                                    {studentDisplayName(student)}
                                  </span>
                                </div>
                              </td>
                              {gradebook.subjects.map((subject) => {
                                const cell = student.grades[subject.subjectSectionId];
                                const status = cell?.status ?? "not_submitted";

                                return (
                                  <td key={subject.subjectSectionId} className="px-3 py-2 text-center">
                                    {status === "submitted" ? (
                                      <span
                                        className={`text-[13px] font-black tabular-nums ${gradeTextColor(cell?.average ?? null)}`}
                                        title={cell?.submittedByName ? `Submitted by ${cell.submittedByName}` : undefined}
                                      >
                                        {cell?.average ?? "—"}
                                      </span>
                                    ) : status === "pending" ? (
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#B45309]"
                                        title="Scores are complete but the subject teacher hasn't submitted yet"
                                      >
                                        <Clock size={10} /> Pending
                                      </span>
                                    ) : cell?.isOwnAdvisory ? (
                                      <span
                                        className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}
                                        title="No grades recorded yet for this subject"
                                      >
                                        No Grades Yet
                                      </span>
                                    ) : (
                                      <span
                                        className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}
                                        title="This subject's grade has not been submitted yet"
                                      >
                                        Not Submitted
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`text-[13px] font-black tabular-nums ${gradeTextColor(overallAverage(student, gradebook.subjects))}`}
                                >
                                  {overallAverage(student, gradebook.subjects) ?? "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <ParentVisibilitySection
            gradingPeriodId={selectedTermId}
            termLabel={terms.find((t) => t.id === selectedTermId)?.label ?? "—"}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        )}
      </div>
    </div>
  );
}