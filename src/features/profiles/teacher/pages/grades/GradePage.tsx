import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Search, User, CheckCircle2, AlertTriangle,
  Download, Send, Loader2,
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

const FILTER_OPTIONS = ["All Students", "Highest Grades", "Lowest Grades", "Boys", "Girls"];

const gradeClasses = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined)
    return "text-gray-500 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400";
  if (grade >= 90) return "text-[#157F3B] bg-[#EAF8EF] dark:bg-[#157F3B]/20 dark:text-[#157F3B]";
  if (grade >= 80) return "text-[#1D70D6] bg-[#EAF2FF] dark:bg-[#1D70D6]/20 dark:text-[#1D70D6]";
  if (grade >= 75) return "text-[#B45309] bg-[#FFF4DB] dark:bg-[#B45309]/20 dark:text-[#B45309]";
  return "text-[#C2255C] bg-[#FCE7F1] dark:bg-[#C2255C]/20 dark:text-[#C2255C]";
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
        ...gradebook.subjects.map((s) => {
          const cell = student.grades[s.subjectSectionId];
          return cell?.average ?? "";
        }),
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

  const allComplete = useMemo(() => {
    if (!gradebook) return false;
    return gradebook.students.every((student) =>
      gradebook.subjects.every((s) => student.grades[s.subjectSectionId]?.isComplete)
    );
  }, [gradebook]);

  const incompleteSubjectCount = useMemo(() => {
    if (!gradebook) return 0;
    return gradebook.subjects.filter(
      (s) => !gradebook.students.every((student) => student.grades[s.subjectSectionId]?.isComplete)
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

  // Group into Male section first, then Female section.
  // Within each group, students are sorted alphabetically by "Last name, First name".
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
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#6B0000]">Advisory class</p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>Gradebook</h1>
          <p className={`mt-2 max-w-2xl text-sm font-medium ${textMuted}`}>
            Final per-term grade records pulled from each subject teacher's recorded scores.
          </p>
        </div>
        <span className="w-fit rounded-xl bg-[#F8EDEE] px-3 py-2 text-xs font-extrabold text-[#6B0000]">
          {gradeLevel || "Advisory class"} · {curriculum}
        </span>
      </div>

      {/* Completeness + Submit + Export bar */}
      <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <div className="flex flex-wrap items-center gap-3">
          {gradebookLoading ? (
            <span className={`flex items-center gap-2 text-xs font-medium ${textMuted}`}>
              <Loader2 size={14} className="animate-spin" /> Checking records…
            </span>
          ) : allComplete ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-3 py-1.5 text-xs font-extrabold text-[#157F3B]">
              <CheckCircle2 size={14} /> Official · All subjects complete
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-[#FCE7F1] px-3 py-1.5 text-xs font-extrabold text-[#C2255C]">
              <AlertTriangle size={14} />
              Not yet official · {incompleteSubjectCount} subject{incompleteSubjectCount === 1 ? "" : "s"} incomplete
            </span>
          )}
          {submitted && (
            <span className={`text-xs font-medium ${textMuted}`}>
              Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!gradebook}
            className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-50 ${
              darkMode ? "border-white/15 text-white/80 hover:bg-white/10" : "border-black/10 text-black/70 hover:bg-black/4"
            }`}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => (allComplete ? handleSubmit() : setShowForceConfirm(true))}
            disabled={submitting || gradebookLoading || !gradebook}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#6B0000] px-4 text-xs font-bold text-white transition disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitted ? "Re-submit Class Grades" : "Submit Class Grades"}
          </button>
        </div>
      </div>

      {showForceConfirm && (
        <div className={`rounded-2xl border p-4 ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-bold ${textPrimary}`}>Submit incomplete grades?</p>
          <p className={`mt-1 text-xs font-medium ${textMuted}`}>
            One or more subjects are still missing ST1, ST2, or TE scores for some students. You can submit
            now and reconcile later, or cancel and follow up with the subject teachers first.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowForceConfirm(false)}
              className={`h-9 rounded-lg border px-4 text-xs font-bold ${panelBorder} ${textMuted}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="h-9 rounded-lg bg-[#6B0000] px-4 text-xs font-bold text-white"
            >
              Submit anyway
            </button>
          </div>
        </div>
      )}

      <section className={cardClasses} aria-label="Advisory class grades">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B0000] text-white">
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>{gradebook?.sectionName || "Advisory Class"}</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {terms.find((t) => t.id === selectedTermId)?.label ?? "—"} · {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student"
                className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none transition focus:ring-2 focus:ring-[#6B000055] sm:w-48 ${panelBg} ${panelBorder} ${textPrimary}`}
              />
            </div>
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

        {gradebookLoading ? (
          <div className="px-5 py-16 text-center">
            <Loader2 size={20} className={`mx-auto animate-spin ${textMuted}`} />
          </div>
        ) : gradebookError ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-bold text-red-500">{gradebookError}</p>
          </div>
        ) : !gradebook || filteredStudents.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No records found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try changing the search, filter, or term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th className={`sticky left-0 z-1 min-w-60 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"} ${textMuted}`}>Student</th>
                  {gradebook.subjects.map((subject) => {
                    const subjectComplete = filteredStudents.every(
                      (s) => s.grades[subject.subjectSectionId]?.isComplete
                    );
                    return (
                      <th key={subject.subjectSectionId} className={`min-w-32 px-3 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{subject.subjectName}</span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${subjectComplete ? "bg-[#157F3B]" : "bg-[#C2255C]"}`}
                            title={subjectComplete ? "ST1/ST2/TE complete" : "Missing ST1, ST2, or TE for one or more students"}
                          />
                        </div>
                      </th>
                    );
                  })}
                  <th className={`min-w-32 px-3 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                    Overall Average
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedStudents.map((group) => (
                  <>
                    <tr key={`group-${group.label}`} className={darkMode ? "bg-white/5" : "bg-[#F8EDEE]"}>
                      <td
                        colSpan={2 + gradebook.subjects.length}
                        className="sticky left-0 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#6B0000]"
                      >
                        {group.label} · {group.students.length} student{group.students.length === 1 ? "" : "s"}
                      </td>
                    </tr>
                    {group.students.map((student, index) => (
                      <tr key={student.studentId} className={`border-t transition-colors ${panelBorder} ${index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""} ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}>
                        <td className={`sticky left-0 z-1 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                              <User size={16} className="text-[#6B0000]" />
                            </span>
                            <div className="min-w-0">
                              <p className={`truncate font-extrabold ${textPrimary}`}>{studentDisplayName(student)}</p>
                              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Student ID: {student.studentId}</p>
                            </div>
                          </div>
                        </td>
                        {gradebook.subjects.map((subject) => {
                          const cell = student.grades[subject.subjectSectionId];
                          return (
                            <td key={subject.subjectSectionId} className="px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`inline-flex min-w-11 justify-center rounded-lg px-2.5 py-1.5 text-xs font-black tabular-nums ${gradeClasses(cell?.average ?? null)}`}
                                >
                                  {cell?.average ?? "—"}
                                </span>
                                {!cell?.isComplete && (
                                  <span className="text-[10px] font-bold text-[#C2255C]">Incomplete</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex min-w-11 justify-center rounded-lg px-2.5 py-1.5 text-xs font-black tabular-nums ${gradeClasses(overallAverage(student, gradebook.subjects))}`}
                          >
                            {overallAverage(student, gradebook.subjects) ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}