import { SkeletonAvatar,SkeletonText } from "@shared/components/SkeletonLoading";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberColumns,rememberRows,skeletonRows,useColumnReservation } from "@shared/loading/reservations";
import { ArrowLeft,Download,Search,Users } from "lucide-react";
import { Fragment,useMemo,useRef,useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
subjectClassListService,
type SubjectClassListStudent,
} from "./services/subjectClassList.service";


function middleInitial(middleName?: string | null) {
  return middleName ? `${middleName.charAt(0)}.` : "";
}

function sortByName(a: SubjectClassListStudent, b: SubjectClassListStudent) {
  return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
}

function useSubjectClassListPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { subjectSectionId } = useParams<{ subjectSectionId: string }>();

  const [subjectName, setSubjectName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [students, setStudents] = useState<SubjectClassListStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const table = useRef<HTMLTableElement>(null);

  const [search, setSearch] = useState("");

  const matchesSearch = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (s: SubjectClassListStudent) => {
      const name = `${s.firstName} ${s.middleName ?? ""} ${s.lastName}`.toLowerCase();
      return !query || name.includes(query) || s.studentNumber.toLowerCase().includes(query);
    };
  }, [search]);

  const maleRoster = useMemo(
    () => students.filter((s) => s.gender === "Male").filter(matchesSearch).sort(sortByName),
    [students, matchesSearch]
  );

  const femaleRoster = useMemo(
    () => students.filter((s) => s.gender === "Female").filter(matchesSearch).sort(sortByName),
    [students, matchesSearch]
  );

  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;
  const filteredCount = maleRoster.length + femaleRoster.length;

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const displaySectionName = sectionName ? `${gradeLevel} · Section ${sectionName}` : gradeLevel;

  const handleExport = async () => {
    const { default: ExcelJSRuntime } = await import("exceljs");
    const workbook = new ExcelJSRuntime.Workbook();
    const sheet = workbook.addWorksheet("Class List");
    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "M.I.", key: "mi", width: 8 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Student ID", key: "id", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };

    const exportRoster = [...maleRoster, ...femaleRoster];
    exportRoster.forEach((s, index) =>
      sheet.addRow({
        no: index + 1,
        lastName: s.lastName,
        firstName: s.firstName,
        mi: middleInitial(s.middleName),
        gender: s.gender,
        id: s.studentNumber,
      })
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${subjectName || "class"}-roster.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const view = `subject-class-list:${subjectSectionId}:${search}`;
  const columns = [{ label: "No.", typical: "99", reservedWidth: 48 }, { label: "Name", typical: "Maria Alexandra Santos" }, { label: "Student ID", typical: "2026-000000" }];
  const widths = useColumnReservation(view, columns, loading);
  function renderStudentRow(student: SubjectClassListStudent, index: number, pending: boolean) {
    return (
      <tr
        key={student.studentId}
        data-sk-item="" data-sk-region="subject-class-student-row"
        className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
      >
        <td data-sk-region="subject-class-row-number" className={`px-4 py-2 text-xs font-bold tabular-nums ${textMuted}`}>{pending ? <SkeletonText width="2ch" /> : index + 1}</td>
        <td className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5" data-sk-region="subjectclasslistpage-div-field-2">
            {pending ? <SkeletonAvatar className="h-7 w-7" /> : <StudentAvatar gender={student.gender} name={`${student.lastName}, ${student.firstName}`} />}
            <span className={`truncate text-xs font-bold ${textPrimary}`} data-sk-region="subjectclasslistpage-span-field-3">
              {pending ? <SkeletonText width={`${14 + index % 3 * 2}ch`} /> : <>{student.lastName}, {student.firstName} {middleInitial(student.middleName)}</>}
            </span>
          </div>
        </td>
        <td className={`px-4 py-2 text-xs font-medium tabular-nums ${textMuted}`} data-sk-region="subjectclasslistpage-td-field-4">
          {pending ? <SkeletonText width="11ch" /> : student.studentNumber}
        </td>
      </tr>
    );
  }

  function renderRoster(pending: boolean) {
    const reservations: SubjectClassListStudent[] = pending ? Array.from({ length: skeletonRows(view) }, (_, index) => ({ studentId: -index - 1, studentNumber: "", firstName: "", lastName: "", middleName: null, gender: index % 2 ? "Female" : "Male" })) : [];
    const groups = [{ label: "Male", rows: pending ? reservations.filter(row => row.gender === "Male") : maleRoster }, { label: "Female", rows: pending ? reservations.filter(row => row.gender === "Female") : femaleRoster }];
    return <div className="overflow-x-auto"><table ref={pending ? undefined : table} className="teacher-user-table w-full min-w-max text-sm">
      {pending && <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
      <thead data-sk-region="subject-class-table-header"><tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>{columns.map((column, index) => <th key={column.label} data-sk-static="" data-sk-region={`subject-class-column-${index}`} className={`${index === 0 ? "w-12 " : ""}px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${textMuted}`}>{column.label}</th>)}</tr></thead>
      <tbody>{!pending && filteredCount === 0 ? <tr><td colSpan={3} className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}>No students found matching "{search}".</td></tr> : groups.filter(group => group.rows.length > 0).map(group => <Fragment key={group.label}>{renderGroup(group.label, group.rows, pending)}</Fragment>)}</tbody>
    </table></div>;
  }
  function renderGroup(label: string, rows: SubjectClassListStudent[], pending: boolean) {
    return <><tr><td colSpan={3} data-sk-static="" data-sk-region={`subject-class-group-${label}`} className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider ${darkMode ? "bg-white/10" : "bg-brand-light"} ${textPrimary}`}>{label}</td></tr>{rows.map((student, index) => renderStudentRow(student, index, pending))}</>;
  }

  return { content: ((
    <div className="w-full min-h-full pb-12">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className={`system-back-button mt-1 shrink-0 border ${panelBg} ${panelBorder} ${textMuted}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.18em]"
                style={{ color: "var(--brand-ink)" }}
              >
                <LoadingRegion as="span" name="subject-class-section" loading={loading} variable skeleton={<SkeletonParagraph field={`${view}:section`} typical={2} />}><span data-sk-field={`${view}:section`}>{displaySectionName}</span></LoadingRegion>
              </p>
              <h1 className={`qed-type-page-title mt-1 ${textPrimary}`}>
                <LoadingRegion as="span" name="subject-class-title" loading={loading} variable skeleton={<SkeletonParagraph field={`${view}:subject`} typical={2} />}><span data-sk-field={`${view}:subject`}>{subjectName || "Class List"}</span></LoadingRegion>
              </h1>
              <p className={`qed-type-page-description mt-1 ${textMuted}`}>
                <LoadingRegion as="span" name="subject-class-summary" loading={loading} variable skeleton={<SkeletonText width="24ch" />}>{students.length} student{students.length === 1 ? "" : "s"} · {maleCount} male · {femaleCount} female</LoadingRegion>
              </p>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || !!error || students.length === 0}
            className={`flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border bg-maroon px-3 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light disabled:opacity-40 sm:self-center ${
              darkMode ? "border-white/10" : "border-black/10"
            }`} data-sk-region="subjectclasslistpage-export-to-excel" data-sk-static=""
          >
            <Download size={12} />
            Export to Excel
          </button>
        </div>

                <div className={`flex flex-col gap-2.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`} data-sk-region="subject-class-toolbar">
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400"><Search size={13} /></span>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search student..." aria-label="Search student by name or ID" className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-maroon ${panelBg} ${panelBorder} ${textPrimary}`} />
          </div>
          <p className={`text-xs font-bold ${textMuted}`}><LoadingRegion as="span" name="subject-class-totals" loading={loading} variable skeleton={<SkeletonText width="16ch" />}>Showing {filteredCount} of {students.length}</LoadingRegion></p>
        </div>
        <div className={cardClasses}>
          <div className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${panelBorder}`}>
            <Users size={13} style={{ color: "var(--brand-ink)" }} />
            <p data-sk-static="" data-sk-region="subject-class-list-label" className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Class List</p>
          </div>
          <LoadingRegion name="subject-class-roster" loading={loading} error={error} retry={() => setAttempt(value => value + 1)} variable autoColumns frame={renderRoster} skeleton={null} retainPrevious hasContent={filteredCount > 0} onSettled={() => { rememberRows(view, filteredCount); rememberColumns(view, table.current); }}>{null}</LoadingRegion>
        </div>
      </div>
    </div>
  )), scope: { subjectSectionId, setLoading, setError, subjectClassListService, setSubjectName, setGradeLevel, setSectionName, setStudents, attempt } };
}


export type SubjectClassListPageEffectScope = ReturnType<typeof useSubjectClassListPageState>["scope"];
export type SubjectClassListPageRouteProps = Record<string, never>;
export function SubjectClassListPageComposition(props: object & { effects?: (scope: SubjectClassListPageEffectScope) => import("react").ReactNode }) {
 const state = useSubjectClassListPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
