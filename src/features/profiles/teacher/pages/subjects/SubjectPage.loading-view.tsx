import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows,skeletonRows } from "@shared/loading/reservations";
import { ChevronRight,Search } from "lucide-react";
import { useMemo,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { useAuth } from "../../../../auth/context/authContext";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import {
GRADE_LEVELS,
type GradeLevel,
} from "../../../admin/pages/subjects/types/types";
import { Dropdown } from "../../../admin/pages/studentrecords/components/Studentsfilterbar";
import { SubjectAssignmentCard } from "../../../shared/components/SubjectAssignmentCard";
import {
assignedSubjectsService,
type AssignedSubject,
} from "./services/subjects.service";

interface DisplaySubject {
  id: number;
  name: string;
  gradeLevel: string;
  section: string;
}

const ALL_GRADES = "All Grades" as const;
type GradeFilter = GradeLevel | typeof ALL_GRADES;
const GRADE_FILTER_OPTIONS: string[] = [ALL_GRADES, ...GRADE_LEVELS];

function mapToDisplaySubject(row: AssignedSubject): DisplaySubject {
  return {
    id: row.subjectSectionId,
    name: row.subjectName,
    gradeLevel: row.gradeLevel,
    section: row.sectionName,
  };
}

function gradeLevelToId(gradeLevel: string): number {
  const match = gradeLevel.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * School year label, e.g. "SY 2026–2027". Philippine school years run
 * roughly June–March, so before June we're still in the year that
 * started the previous calendar year.
 */
function currentSchoolYearLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = January
  const startYear = month >= 5 ? year : year - 1;
  return `SY ${startYear}–${startYear + 1}`;
}

function useSubjectsPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<DisplaySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");

  // Grid filter — purely for browsing "what subjects do I teach". Defaults
  // to All Grades so every assigned subject is visible immediately.
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(ALL_GRADES);

  // Whether subjects are clustered into "Grade · Section" groups.
  // Grouped is the default view; the teacher can switch back to one
  // flat list of cards at any time.
  const [groupBySection, setGroupBySection] = useState(true);

  const isAllGrades = gradeFilter === ALL_GRADES;
  const gradeLevelId = useMemo(
    () => (isAllGrades ? null : gradeLevelToId(gradeFilter)),
    [gradeFilter, isAllGrades],
  );

  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (s) =>
          (isAllGrades || gradeLevelToId(s.gradeLevel) === gradeLevelId) &&
          s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [subjects, gradeLevelId, isAllGrades, search],
  );

  // Group the filtered subjects by "Grade Level · Section" so subjects
  // taught to different sections don't blur together in one flat grid.
  const groupedSubjects = useMemo(() => {
    const groups = new Map<string, DisplaySubject[]>();

    for (const subject of filteredSubjects) {
      const key = subject.section
        ? `${subject.gradeLevel} · Section ${subject.section}`
        : subject.gradeLevel;

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(subject);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSubjects]);

  const studentsForSubject = useMemo(
    () => (subject: DisplaySubject) => {
      const subjectGradeId = gradeLevelToId(subject.gradeLevel);
      return students.filter(
        (s) => s.gradeLevelId === subjectGradeId && s.section === subject.section,
      );
    },
    [students],
  );

  const schoolYear = useMemo(() => currentSchoolYearLabel(), []);

  

  const viewKey = `teacher/subjects/${gradeFilter}/${groupBySection}/${search}`;
  const renderSubjects = (pending: boolean) => {
    const visibleSubjects: DisplaySubject[] = pending ? Array.from({ length: skeletonRows(viewKey, undefined, 218) }, (_, index) => ({ id: -index - 1, name: "", gradeLevel: " ", section: "" })) : filteredSubjects;
    const visibleGroups: [string, DisplaySubject[]][] = pending ? [["", visibleSubjects]] : groupedSubjects;
    return (visibleSubjects.length === 0 ? (
                <p
                  className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}
                >
                  {isAllGrades
                    ? "No subjects assigned to you yet."
                    : `No subjects assigned to you for ${gradeFilter} yet.`}
                </p>
              ) : groupBySection ? (
                <div className="p-4 space-y-7" data-sk-region="subjectpage-div-field-1">
                  {visibleGroups.map(([sectionLabel, sectionSubjects]) => (
                    <div key={sectionLabel}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-5 w-1 rounded-full bg-maroon" />
                        <h4
                          className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`} data-sk-region="subjectpage-h4-field-2"
                        >
                          {pending ? <SkeletonText width="10rem"/> : sectionLabel}
                        </h4>
                        <span className={`text-xs font-semibold ${textMuted}`} data-sk-region="subjectpage-span-field-3">
                          {pending ? <SkeletonText width="4ch"/> : <>({sectionSubjects.length} subject{sectionSubjects.length === 1 ? "" : "s"})</>}
                        </span>
                        <span
                          className={`h-px flex-1 ${
                            darkMode ? "bg-white/10" : "bg-gray-200"
                          }`}
                        />
                      </div>

                      {/* Subject cards for this section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {sectionSubjects.map((subject) => (
                          <SubjectCard loading={pending}
                            key={subject.id}
                            subject={subject}
                            schoolYear={schoolYear}
                            darkMode={darkMode}
                            panelBg={panelBg}
                            panelBorder={panelBorder}
                            textPrimary={textPrimary}
                            textMuted={textMuted}
                            studentCount={studentsForSubject(subject).length}
                            onRecordGrades={() =>
                              navigate(`/teacher/subjects/${subject.id}`)
                            }
                            onClassList={() =>
                              navigate(`/teacher/subjects/${subject.id}/students`)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {visibleSubjects.map((subject) => (
                    <SubjectCard loading={pending}
                      key={subject.id}
                      subject={subject}
                      schoolYear={schoolYear}
                      darkMode={darkMode}
                      panelBg={panelBg}
                      panelBorder={panelBorder}
                      textPrimary={textPrimary}
                      textMuted={textMuted}
                      studentCount={studentsForSubject(subject).length}
                      onRecordGrades={() => navigate(`/teacher/subjects/${subject.id}`)}
                      onClassList={() =>
                        navigate(`/teacher/subjects/${subject.id}/students`)
                      }
                    />
                  ))}
                </div>
              ));
  };

  return { content: ((
    <div className="w-full min-h-full pb-0">
      <div className="w-full space-y-6">
        {/* Header — same pattern as TeacherAttendancePage */}
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className={`qed-type-page-title ${textPrimary}`} data-sk-region="subjectpage-subjects" data-sk-static="">
              Subjects
            </h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`} data-sk-region="subjectpage-everything-you-teach-organized-in-one-place-" data-sk-static="">
              Everything you teach, organized in one place.
            </p>
          </div>
        </div>

        {/* Toolbar — search + subject count, same bar style as attendance page */}
        <div
          className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
        >
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject..."
              className={`qed-filter-control w-full pl-8 pr-2.5 rounded-lg border font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className={`w-full text-xs font-semibold whitespace-nowrap sm:w-auto ${textMuted}`}>
              {filteredSubjects.length} subject
              {filteredSubjects.length === 1 ? "" : "s"} shown
            </p>

            <Dropdown
              label="Grade level filter"
              value={gradeFilter}
              onChange={(value) => setGradeFilter(value as GradeFilter)}
              options={GRADE_FILTER_OPTIONS}
              darkMode={darkMode}
            />
            <div
              className={`qed-segmented-control flex h-8 items-center box-border rounded-lg p-0 ${
                darkMode
                  ? "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                  : "bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]"
              }`}
              role="group"
              aria-label="Subject view"
            >
              <button
                type="button"
                onClick={() => setGroupBySection(true)}
                aria-pressed={groupBySection}
                className={`qed-filter-control px-3 rounded-lg font-semibold transition-colors ${
                  groupBySection
                    ? "bg-maroon text-white"
                    : `${textMuted} hover:${darkMode ? "text-white" : "text-gray-700"}`
                }`} data-sk-region="subjectpage-by-section" data-sk-static=""
              >
                By Section
              </button>
              <button
                type="button"
                onClick={() => setGroupBySection(false)}
                aria-pressed={!groupBySection}
                className={`qed-filter-control px-3 rounded-lg font-semibold transition-colors ${
                  !groupBySection
                    ? "bg-maroon text-white"
                    : `${textMuted} hover:${darkMode ? "text-white" : "text-gray-700"}`
                }`} data-sk-region="subjectpage-all" data-sk-static=""
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
          {(
            <>
              {(<LoadingRegion name="teacher-subject-collection" loading={loading} variable error={error} retry={() => setRefresh(value => value + 1)} retainPrevious hasContent={filteredSubjects.length > 0} frame={renderSubjects} onSettled={() => rememberRows(viewKey, filteredSubjects.length)} skeleton={renderSubjects(true)}>{renderSubjects(false)}</LoadingRegion>)}
            </>
          )}
        </div>
      </div>
    </div>
  )), scope: { user, setLoading, setError, assignedSubjectsService, setSubjects, mapToDisplaySubject, refresh } };
}

interface SubjectCardProps {
  loading?: boolean;
  subject: DisplaySubject;
  schoolYear: string;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  studentCount: number;
  onRecordGrades: () => void;
  onClassList: () => void;
}

/** Single subject card — shared by both the grouped and flat views. */
function SubjectCard({
  loading = false,
  subject,
  schoolYear,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  studentCount,
  onRecordGrades,
  onClassList,
}: SubjectCardProps) {
  return (
    <SubjectAssignmentCard loading={loading}
      schoolYearLoading={false}
      statusLoading={false}
      schoolYear={schoolYear}
      status="Active"
      title={subject.name}
      subtitle={`${subject.gradeLevel}${subject.section ? ` · ${subject.section}` : ""}`}
      studentCount={studentCount}
      showStudentCount={false}
      darkMode={darkMode}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      textMuted={textMuted}
      actions={
        <>
          <button
            disabled={loading}
            onClick={onRecordGrades}
            className="h-7 whitespace-nowrap rounded-lg bg-maroon px-2 text-xs font-extrabold text-white transition-colors hover:bg-maroon-light sm:px-2.5 sm:text-xs" data-sk-region="subjectpage-record-grades" data-sk-static=""
          >
            Record Grades
          </button>
          <button
            disabled={loading}
            onClick={onClassList}
            className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-wide transition-colors hover:underline ${darkMode ? "text-white hover:text-white/80" : "text-brand-ink hover:text-[#5A0017]"}`} data-sk-region="subjectpage-view-class-list" data-sk-static=""
          >
            View Class List <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}


export type SubjectsPageEffectScope = ReturnType<typeof useSubjectsPageState>["scope"];
export type SubjectsPageRouteProps = Record<string, never>;
export function SubjectsPageComposition(props: object & { effects?: (scope: SubjectsPageEffectScope) => import("react").ReactNode }) {
 const state = useSubjectsPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
