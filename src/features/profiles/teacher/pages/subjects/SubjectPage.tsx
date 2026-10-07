import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "../../../admin/pages/subjects/types/types";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { useAuth } from "../../../../auth/context/authContext";
import {
  Dropdown,
} from "../../../shared/components/DashboardUI";
import {
  assignedSubjectsService,
  type AssignedSubject,
} from "./services/subjects.service";
import { SubjectAssignmentCard } from "../../../shared/components/SubjectAssignmentCard";

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

export function SubjectsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<DisplaySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Grid filter — purely for browsing "what subjects do I teach". Defaults
  // to All Grades so every assigned subject is visible immediately.
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(ALL_GRADES);

  // Whether subjects are clustered into "Grade · Section" groups.
  // Grouped is the default view; the teacher can switch back to one
  // flat list of cards at any time.
  const [groupBySection, setGroupBySection] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await assignedSubjectsService.getAssignedSubjects();
        setSubjects(rows.map(mapToDisplaySubject));
      } catch (err) {
        console.error("Failed to fetch teacher subjects:", err);
        setError("Failed to load your subjects.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user?.id]);

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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const schoolYear = useMemo(() => currentSchoolYearLabel(), []);

  if (loading) {
    return (
      <div className="w-full min-h-full pb-12">
        <div className="w-full">
          <div
            className={`${cardClasses} flex items-center justify-center gap-2 px-5 py-14`}
          >
            <p className={`text-xs font-semibold ${textMuted}`}>
              Loading your subjects...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full pb-0">
      <div className="w-full space-y-6">
        {/* Header — same pattern as TeacherAttendancePage */}
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className={`qed-type-page-title ${textPrimary}`}>
              Subjects
            </h1>
            <p className={`qed-type-page-description mt-0.5 ${textMuted}`}>
              Everything you teach, organized in one place.
            </p>
          </div>
        </div>

        {/* Toolbar — search + subject count, same bar style as attendance page */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
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

          <div className="flex items-center gap-3 shrink-0">
            <p className={`text-xs font-semibold whitespace-nowrap ${textMuted}`}>
              {filteredSubjects.length} subject
              {filteredSubjects.length === 1 ? "" : "s"} shown
            </p>

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
                    ? "bg-[#800000] text-white"
                    : `${textMuted} hover:${darkMode ? "text-white" : "text-gray-700"}`
                }`}
              >
                By Section
              </button>
              <button
                type="button"
                onClick={() => setGroupBySection(false)}
                aria-pressed={!groupBySection}
                className={`qed-filter-control px-3 rounded-lg font-semibold transition-colors ${
                  !groupBySection
                    ? "bg-[#800000] text-white"
                    : `${textMuted} hover:${darkMode ? "text-white" : "text-gray-700"}`
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
          {error ? (
            <p className="px-4 py-10 text-center text-xs font-semibold text-red-500">
              {error}
            </p>
          ) : (
            <>
              <div
                className={`flex items-center justify-between gap-2.5 px-4 pt-4 ${
                  filteredSubjects.length === 0 ? "" : "pb-0"
                }`}
              >
                <span className={`text-sm font-bold ${textPrimary}`}>
                  Grade Level
                </span>
                <Dropdown
                  value={gradeFilter}
                  onChange={(v) => setGradeFilter(v as GradeFilter)}
                  options={GRADE_FILTER_OPTIONS}
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                />
              </div>

              {filteredSubjects.length === 0 ? (
                <p
                  className={`px-4 py-10 text-center text-xs font-medium ${textMuted}`}
                >
                  {isAllGrades
                    ? "No subjects assigned to you yet."
                    : `No subjects assigned to you for ${gradeFilter} yet.`}
                </p>
              ) : groupBySection ? (
                <div className="p-4 space-y-7">
                  {groupedSubjects.map(([sectionLabel, sectionSubjects]) => (
                    <div key={sectionLabel}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-5 w-1 rounded-full bg-[#800000]" />
                        <h4
                          className={`text-xs font-extrabold uppercase tracking-wide ${textPrimary}`}
                        >
                          {sectionLabel}
                        </h4>
                        <span className={`text-xs font-semibold ${textMuted}`}>
                          ({sectionSubjects.length} subject
                          {sectionSubjects.length === 1 ? "" : "s"})
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
                          <SubjectCard
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
                  {filteredSubjects.map((subject) => (
                    <SubjectCard
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SubjectCardProps {
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
    <SubjectAssignmentCard
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
            onClick={onRecordGrades}
            className="h-7 whitespace-nowrap rounded-lg bg-[#800000] px-2 text-xs font-extrabold text-white transition-colors hover:bg-[#650000] sm:px-2.5 sm:text-xs"
          >
            Record Grades
          </button>
          <button
            onClick={onClassList}
            className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-wide transition-colors hover:underline ${darkMode ? "text-white hover:text-white/80" : "text-[#800020] hover:text-[#5A0017]"}`}
          >
            View Class List <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}
