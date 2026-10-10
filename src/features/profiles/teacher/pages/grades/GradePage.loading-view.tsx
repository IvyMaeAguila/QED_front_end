import { FilterDropdown } from "@shared/components/FilterDropdown";
import { SkeletonAvatar,SkeletonText } from "@shared/components/SkeletonLoading";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { LoadingTable } from "@shared/loading/LoadingTable";
import { lastKnownCount,rememberRows,skeletonRows } from "@shared/loading/reservations";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import {
AlertTriangle,
CheckCircle2,
Clock,
Download,
History,
Loader2,
Search,
Send,
} from "lucide-react";
import { Fragment,useMemo,useState } from "react";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import type { GradingPeriod } from "../subjects/detail/types/Grading";
import { fetchGradingPeriods } from "../subjects/services/subjectGrading.service";
import { ParentVisibilitySection } from "./ParentVisibilitySection";
import {
fetchAdvisoryGradebook,
fetchAdvisorySections,
fetchClassSubmissionLogs,
fetchClassSubmissionStatus,
submitClassGrades,
type AdvisoryGradebook,
type AdvisorySectionOption,
type GradebookStudent,
type GradeSubmissionLog,
} from "./services/gradePage.service";

const FILTER_OPTIONS = ["All Students", "Highest Grades", "Lowest Grades", "Boys", "Girls"];

const gradeTextColor = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined) return "text-gray-400 dark:text-gray-500";
  return "text-brand-ink";
};

function studentDisplayName(s: { firstName: string; lastName: string; middleName: string | null }) {
  const mi = s.middleName ? ` ${s.middleName.charAt(0)}.` : "";
  return `${s.lastName}, ${s.firstName}${mi}`;
}

function cellDisplayValue(cell: { status: string; termGrade?: number | null; average: number | null; isOwnAdvisory?: boolean } | undefined): string | number {
  if (!cell) return "Not Submitted";
  if (cell.status === "submitted") return cell.termGrade ?? cell.average ?? "—";
  if (cell.status === "pending") return "Pending";
  return cell.isOwnAdvisory ? "No grades yet" : "Not Submitted";
}

function toCSV(gradebook: AdvisoryGradebook) {
  const header = ["Student", "Student ID", ...gradebook.subjects.map((s) => `${s.subjectName} Term Grade`), "Overall Average"];
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
        student.overallAverage ?? "",
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

function useGradesPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { students } = useStudents();

  const [termsLoading, setTermsLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsAttempt, setLogsAttempt] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [terms, setTerms] = useState<GradingPeriod[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState(FILTER_OPTIONS[0]);

  // NEW: advisory section picker (only rendered when a teacher has more than one).
  const [sections, setSections] = useState<AdvisorySectionOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [gradebook, setGradebook] = useState<AdvisoryGradebook | null>(null);
  const [gradebookLoading, setGradebookLoading] = useState(true);
  const [gradebookError, setGradebookError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submissionLogs, setSubmissionLogs] = useState<GradeSubmissionLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<"gradebook" | "visibility" | "history">("gradebook");

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
    setSubmitError(null);
    try {
      await submitClassGrades(selectedTermId, selectedClassId);
      setSubmitted(true);
      setSubmittedAt(new Date().toISOString());
      setSubmissionLogs(await fetchClassSubmissionLogs(selectedTermId, selectedClassId));
    } catch (err) {
      console.error("Failed to submit class grades:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit class grades. Please try again.");
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
        const diff = (b.overallAverage ?? 0) - (a.overallAverage ?? 0);
        return studentFilter === "Highest Grades" ? diff : -diff;
      });
    } else if (studentFilter === "Boys" || studentFilter === "Girls") {
      const wanted = studentFilter === "Boys" ? "M" : "F";
      result = result.filter((s) => s.gender === wanted);
    }

    return result;
  }, [gradebook, search, studentFilter]);

  const groupedStudents = useMemo(() => {
    if (studentFilter === "Highest Grades" || studentFilter === "Lowest Grades") {
      return [{
        label: studentFilter === "Highest Grades" ? "Highest score ranking" : "Lowest score ranking",
        students: filteredStudents,
      }];
    }

    const male = filteredStudents
      .filter((s) => s.gender === "M")
      .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
    const female = filteredStudents
      .filter((s) => s.gender === "F")
      .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));

    const groups: { label: string; students: GradebookStudent[] }[] = [];
    if (male.length) groups.push({ label: "Male", students: male });
    if (female.length) groups.push({ label: "Female", students: female });
    return groups;
  }, [filteredStudents, studentFilter]);

  const gradeLevel = gradebook?.gradeLevel ?? students[0]?.gradeLevel ?? "";
  const isMatatag = /(?:grade\s*)?[1-3](?!\d)/i.test(gradeLevel);
  const curriculum = isMatatag ? "Matatag Curriculum" : "Intermediate Grades";
  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const groupBand = `px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-brand-light"
  } ${textPrimary}`;
  const columnCount = 2 + (gradebook?.subjects.length ?? 0);


  const dataLoading = !metadataError && (termsLoading || sectionsLoading || gradebookLoading);
  const tableError = metadataError || gradebookError;
  const tablePending = dataLoading && !tableError;
  const view = `teacher-grades-table-${selectedClassId}-${selectedTermId}-${studentFilter}-${search}`;
  const subjectCount = lastKnownCount("teacher-grades-subjects",2);
  const displayBook: AdvisoryGradebook = tablePending ? {sectionName:"",gradeLevel:"",subjects:gradebook?.subjects ?? Array.from({length:subjectCount},(_,i)=>({subjectSectionId:String(i),subjectId:i,subjectName:"",submitted:false,submittedByName:null,submittedAt:null,isOwnAdvisory:false})),students:[]} : gradebook ?? {sectionName:"",gradeLevel:"",subjects:[],students:[]};
  const [columnReservation,setColumnReservation] = useState(()=>({loading:dataLoading,subjects:displayBook.subjects}));
  if(dataLoading !== columnReservation.loading)setColumnReservation({loading:dataLoading,subjects:dataLoading?displayBook.subjects:columnReservation.subjects});
  const renderRows=(pending:boolean)=>{
    const groups: {label:string;students:GradebookStudent[]}[] = pending ? [{label:"Male",students:Array.from({length:skeletonRows(view,undefined,44)},(_,i)=>({studentId:String(i),firstName:"",lastName:"",middleName:null,gender:"M" as const,grades:{},overallAverage:null}))}] : groupedStudents;
    if(!pending && (!gradebook || filteredStudents.length===0))return <tr><td colSpan={columnCount} className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No records found matching "{search}".</td></tr>;
    return <>{groups.map((group) => (
                        <Fragment key={group.label}>
                          <tr>
                            <td colSpan={pending ? 2+displayBook.subjects.length : columnCount} className={groupBand}>
                              {group.label} · {pending ? <SkeletonText width="2ch" className="inline-block align-top" /> : group.students.length} student{group.students.length === 1 ? "" : "s"}
                            </td>
                          </tr>
                          {group.students.map((student) => (
                            <tr
                              key={student.studentId} data-sk-region="teacher-grade-row" data-sk-variable=""
                              className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
                            >
                              <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-panel-dark" : "bg-white"}`}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span data-sk-region="teacher-grade-avatar" className="h-7 w-7 shrink-0">{pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={student.gender} name={studentDisplayName(student)} />}</span>
                                  <span className={`qed-type-table-body truncate ${textPrimary}`}>
                                    {pending ? <SkeletonText width="18ch" /> : studentDisplayName(student)}
                                  </span>
                                </div>
                              </td>
                              {displayBook.subjects.map((subject) => {
                                const cell = student.grades[subject.subjectSectionId];
                                const status = cell?.status ?? "not_submitted";
                                const grade = cell?.termGrade ?? cell?.average;

                                return (
                                  <td key={subject.subjectSectionId} className="px-3 py-2 text-center">
                                    {pending ? <SkeletonText width="4ch" className="mx-auto qed-type-table-grade" /> : status === "submitted" ? (
                                      grade != null ? (
                                          <span
                                            className={`qed-type-table-grade ${gradeTextColor(grade)}`}
                                            title={cell?.submittedByName ? `Submitted by ${cell.submittedByName}` : undefined}
                                          >
                                            {grade}
                                          </span>
                                        )
                                        : <span className="qed-type-table-empty-value">—</span>
                                    ) : status === "pending" ? (
                                      <span
                                        className="qed-type-badge inline-flex items-center gap-1 uppercase tracking-wide text-[#B45309]"
                                        title="Scores are complete but the subject teacher hasn't submitted yet"
                                      >
                                        <Clock size={10} /> Pending
                                      </span>
                                    ) : cell?.isOwnAdvisory ? (
                                      <span
                                        className="qed-type-table-empty-value"
                                        title="No grades recorded yet for this subject"
                                      >
                                        No grades yet
                                      </span>
                                    ) : (
                                      <span
                                        className={`qed-type-badge uppercase tracking-wide ${textMuted}`}
                                        title="This subject's grade has not been submitted yet"
                                      >
                                        Not Submitted
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">
                                {pending ? <SkeletonText width="3ch" className="mx-auto qed-type-table-grade" /> : student.overallAverage == null ? (
                                  <span className="qed-type-table-empty-value">—</span>
                                ) : (
                                  <span className={`qed-type-table-grade ${gradeTextColor(student.overallAverage)}`}>
                                    {student.overallAverage}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
</>;
  };
  const tableHeader = (pending: boolean) => <><thead>
                      <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
                        <th
                          className={`qed-type-table-header sticky left-0 z-10 min-w-56 px-4 py-2 text-left uppercase tracking-wider ${
                            darkMode ? "bg-panel-dark" : "bg-brand-light"
                          } ${textMuted}`}
                        >
                          Student
                        </th>
                        {(pending ? columnReservation.subjects : displayBook.subjects).map((subject) => (
                          <th
                            key={subject.subjectSectionId}
                            className={`qed-type-table-header min-w-28 px-3 py-2 text-center uppercase tracking-wider ${textMuted}`}
                          >
                            <span>{pending && !subject.subjectName ? <SkeletonText width="12ch" /> : subject.subjectName}</span>
                          </th>
                        ))}
                        <th className={`qed-type-table-header min-w-28 px-3 py-2 text-center uppercase tracking-wider ${textMuted}`}>
                          Overall Average
                        </th>
                      </tr>
                    </thead></>;

  return { content: ((
    <div className="w-full min-h-full pb-12">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div>
              <h1 className={`qed-type-page-title ${textPrimary}`}>Gradebook</h1>
              <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
                {!tableError && (<LoadingRegion as="span" loading={dataLoading && !gradeLevel} variable name="teacher-grade-level" skeleton={<SkeletonText width="24ch" className="inline-block align-top" />}>{gradeLevel || "Advisory class"} · {curriculum}</LoadingRegion>)}
              </p>
            </div>
          </div>

          <div
            className={`qed-segmented-control flex items-center self-start rounded-lg p-0 ${darkMode ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "shadow-[inset_0_0_0_1px_#e5e7eb]"} ${panelBg} ${panelBorder} sm:self-center`}
          >
            <button
              onClick={() => setActiveTab("gradebook")}
              className={`rounded-lg px-3 text-xs font-bold transition-colors ${
                activeTab === "gradebook" ? "bg-maroon text-white" : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Gradebook
            </button>
            <button
              onClick={() => setActiveTab("visibility")}
              className={`rounded-lg px-3 text-xs font-bold transition-colors ${
                activeTab === "visibility" ? "bg-maroon text-white" : `${textMuted} hover:${textPrimary}`
              }`}
            >
              Parent Visibility
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                activeTab === "history" ? "bg-maroon text-white" : `${textMuted} hover:${textPrimary}`
              }`}
            >
              <History size={12} /> Submission History
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
                {!tableError && (<LoadingRegion as="span" loading={dataLoading} variable retainPrevious hasContent={Boolean(gradebook)} name="teacher-grade-completeness" skeleton={<SkeletonText width="24ch" className="text-xs font-bold" />}>{allComplete ? (
                  <span
                    className="flex items-center gap-1.5 rounded-lg border border-[#157F3B]/25 bg-[#157F3B]/5 px-2.5 py-1 text-xs font-bold text-[#157F3B]"
                  >
                    <CheckCircle2 size={12} /> Official · All subjects submitted
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/5 px-2.5 py-1 text-xs font-bold text-warning"
                  >
                    <AlertTriangle size={12} />
                    Not yet official · {incompleteSubjectCount} subject{incompleteSubjectCount === 1 ? "" : "s"} not submitted
                  </span>
                )}</LoadingRegion>)}
                {!tableError && (<LoadingRegion as="span" loading={statusLoading && (termsLoading || sectionsLoading || Boolean(selectedClassId))} error={statusError} retry={()=>setStatusAttempt(value=>value+1)} variable name="teacher-grade-submission-status" skeleton={<SkeletonText width="18ch" className="text-xs" />}>{submitted && (
                  <span className={`text-xs font-medium ${textMuted}`}>
                    Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ""}
                  </span>
                )}</LoadingRegion>)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={!gradebook}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition-colors disabled:opacity-50 ${
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
                  className={`flex h-8 items-center gap-1.5 rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light disabled:opacity-60 ${
                    darkMode ? "border-white/10" : "border-black/10"
                  }`}
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {submitted ? "Re-submit Class Grades" : "Submit Class Grades"}
                </button>
              </div>
            </div>

            {submitError && (
              <div
                className={`flex items-center gap-2 rounded-xl border border-error/25 bg-error/5 px-4 py-2.5 text-xs font-bold text-error`}
                role="alert"
              >
                <AlertTriangle size={12} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {showForceConfirm && (
              <div className={`rounded-xl border px-4 py-3 ${panelBg} ${panelBorder}`}>
                <p className={`text-xs font-bold ${textPrimary}`}>Submit incomplete grades?</p>
                <p className={`mt-1 text-xs font-medium ${textMuted}`}>
                  One or more subjects still haven't been submitted by their subject teacher yet. You can submit
                  now and reconcile later, or cancel and follow up with the subject teachers first.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => setShowForceConfirm(false)}
                    className={`flex h-8 items-center rounded-lg border px-3 text-xs font-bold transition-colors ${
                      darkMode
                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex h-8 items-center rounded-lg bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light"
                  >
                    Submit anyway
                  </button>
                </div>
              </div>
            )}

            {/*
              Search + filter + term + section strip.
              FIX: this row needs to sit in its OWN stacking context that is
              higher than the table section below it, otherwise any dropdown
              popup rendered by FilterDropdown gets painted UNDER the table
              (the table's sticky header/cells use z-10, and this row was not
              a positioned element at all, so its old "z-10" class on a
              non-positioned div did nothing).
            */}
            <div
              className={`relative z-20 flex flex-col gap-2.5 rounded-xl border px-3 py-2 lg:flex-row lg:items-center lg:justify-between ${panelBg} ${panelBorder}`}
            >
              <div className="relative w-full lg:w-64">
                <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
                  <Search size={13} />
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student..."
                  aria-label="Search student by name"
                  className={`qed-filter-control w-full rounded-lg border pl-8 pr-2.5 font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`}
                />
              </div>
              <div className="relative z-20 flex flex-wrap items-center gap-2">
                {/* NEW: only shown when the teacher advises more than one class */}
                {!tableError && (<LoadingRegion loading={sectionsLoading && !sections.length} variable name="teacher-grade-section-filter" skeleton={<FilterDropdown compact label="Section" value="" options={[]} loading onChange={()=>{}} darkMode={darkMode} />}>{sections.length > 1 && (
                  <FilterDropdown compact
                    label="Section"
                    value={
                      sections.find((s) => s.classId === selectedClassId)?.sectionName ??
                      sections.find((s) => s.classId === selectedClassId)?.gradeLevel ??
                      ""
                    }
                    options={sections.map((s) => s.sectionName ?? s.gradeLevel)}
                    onChange={(label) => {
                      const match = sections.find((s) => (s.sectionName ?? s.gradeLevel) === label);
                      if (match) setSelectedClassId(match.classId);
                    }}
                    darkMode={darkMode}
                  />
                )}
                </LoadingRegion>)}
                <FilterDropdown compact label="Filter" value={studentFilter} options={FILTER_OPTIONS} onChange={setStudentFilter} darkMode={darkMode} />
                <FilterDropdown compact
                  label="Term" loading={tableError ? undefined : termsLoading && !terms.length}
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

            {/* FIX: give the table section a lower explicit stacking context (z-0)
                so it never competes with the filter row above it, regardless of
                DOM order. relative + z-0 keeps it a normal stacking context that
                sits below the filter strip's z-20. */}
            <section className={`relative z-0 ${cardClasses}`} aria-label="Advisory class grades">
              <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${panelBorder}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <p className={`qed-type-table-group flex items-center gap-1.5 uppercase ${textPrimary}`}>
                    {!tableError && (<LoadingRegion as="span" loading={dataLoading && !gradebook} variable name="teacher-grade-section-name" skeleton={<SkeletonParagraph field="teacher-grade-section-name" typical={2} width="14ch" />}><span data-sk-field="teacher-grade-section-name">{gradebook?.sectionName || "Advisory Class"}</span></LoadingRegion>)}
                  </p>
                  <p className={`truncate text-xs font-medium ${textMuted}`}>
                    {!tableError && (<LoadingRegion as="span" loading={dataLoading && !gradebook} variable preserveStatic name="teacher-grade-summary" skeleton={<><span>· </span><SkeletonText width="6ch" className="inline-block align-top" /><span> · </span><SkeletonText width="2ch" className="inline-block align-top" /><span> students</span></>}>· {terms.find((t) => t.id === selectedTermId)?.label ?? "—"} · {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}</LoadingRegion>)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto"><LoadingTable name="teacher-grades-table:table-body" staticRows view={view} loading={dataLoading} error={tableError} retry={()=>setAttempt(value=>value+1)} columns={[{label:"Student",typical:"Last name, First name"},...displayBook.subjects.map(subject=>({label:subject.subjectName,typical:"Not Submitted"})),{label:"Overall Average",typical:"100"}]} header={tableHeader} skeleton={renderRows(true)} count={filteredStudents.length} className="teacher-user-table w-full min-w-max text-sm">{renderRows(false)}</LoadingTable></div>

            </section>
          </>
        ) : activeTab === "visibility" ? (
          <ParentVisibilitySection prerequisitesLoading={termsLoading || sectionsLoading} prerequisitesError={metadataError} retryPrerequisites={()=>setAttempt(value=>value+1)}
            gradingPeriodId={selectedTermId}
            classId={selectedClassId}
            termLabel={terms.find((t) => t.id === selectedTermId)?.label ?? "—"}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />
        ) : (
          <section className={`overflow-hidden rounded-xl border ${panelBg} ${panelBorder}`} aria-label="Grade submission history">
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${panelBorder}`}>
              <div className="flex items-center gap-2">
                <History size={15} className={textMuted} />
                <h2 className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Submission History</h2>
              </div>
              <span className={`text-xs font-semibold ${textMuted}`}>
                {!metadataError && !logsError && (<LoadingRegion as="span" loading={logsLoading && (termsLoading || sectionsLoading || Boolean(selectedClassId))} name="teacher-grade-history-count" skeleton={<SkeletonText width="2ch" className="inline-block align-top" />}>{submissionLogs.length}</LoadingRegion>)} record{submissionLogs.length === 1 ? "" : "s"}
              </span>
            </div>
            <LoadingRegion loading={logsLoading && (termsLoading || sectionsLoading || Boolean(selectedClassId))} error={metadataError || logsError} retry={()=>metadataError ? setAttempt(value=>value+1) : setLogsAttempt(value=>value+1)} variable retainPrevious hasContent={submissionLogs.length>0} name="teacher-grade-history" skeleton={null} frame={pending=><>            {(pending || submissionLogs.length) ? (
              <ol className="divide-y divide-black/5">
                {(pending ? Array.from({length:skeletonRows("teacher-grade-history",undefined,44)},(_,i)=>({id:i,label:"",type:"advisory",submittedByName:null,submittedAt:""})) : submissionLogs).map((log) => (
                  <li key={log.id} data-sk-region="teacher-grade-history-row" data-sk-variable="" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                    <span className={`text-xs font-semibold ${textPrimary}`}>
                      {pending ? <SkeletonText width="14ch" /> : log.label} <span className={textMuted}>· {pending ? <SkeletonText width="12ch" /> : log.type === "advisory" ? "Class submission" : "Subject submission"}</span>
                    </span>
                    <span className={`text-xs font-medium ${textMuted}`}>
                      {pending ? <SkeletonText width="24ch" /> : <>{log.submittedByName ? `${log.submittedByName} · ` : ""}{new Date(log.submittedAt).toLocaleString()}</>}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={`px-4 py-8 text-center text-xs ${textMuted}`}>No grades have been submitted for this term yet.</p>
            )}</>}>{null}</LoadingRegion>
          </section>
        )}
      </div>
    </div>
  )), scope: { setTermsLoading, setSectionsLoading, setMetadataError, fetchGradingPeriods, setTerms, setSelectedTermId, fetchAdvisorySections, setSections, setSelectedClassId, attempt, selectedTermId, selectedClassId, termsLoading, sectionsLoading, setGradebookLoading, setGradebookError, fetchAdvisoryGradebook, setGradebook, setLogsLoading, setLogsError, fetchClassSubmissionLogs, setSubmissionLogs, logsAttempt, setStatusLoading, setStatusError, fetchClassSubmissionStatus, setSubmitted, setSubmittedAt, statusAttempt, gradebook, gradebookLoading, rememberRows } };
}


export type GradesPageEffectScope = ReturnType<typeof useGradesPageState>["scope"];
export type GradesPageRouteProps = Record<string, never>;
export function GradesPageComposition(props: object & { effects?: (scope: GradesPageEffectScope) => import("react").ReactNode }) {
 const state = useGradesPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
