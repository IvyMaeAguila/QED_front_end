import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Globe2,
  HeartHandshake,
  Languages,
  Music,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
 * Subject "family" — drives the icon shown on each card. Every card
 * uses the same simple maroon header so it renders cleanly on
 * lower-quality screens.
 */
type SubjectFamily =
  | "math"
  | "science"
  | "language"
  | "social"
  | "arts"
  | "values"
  | "practical"
  | "general";

function familyFor(name: string): SubjectFamily {
  const n = name.toLowerCase();
  if (n.includes("math")) return "math";
  if (n.includes("science")) return "science";
  if (
    n.includes("filipino") ||
    n.includes("english") ||
    n.includes("language") ||
    n.includes("reading")
  )
    return "language";
  if (n.includes("araling") || n.includes("panlipunan")) return "social";
  if (n.includes("music") || n.includes("art") || n.includes("mapeh"))
    return "arts";
  if (n.includes("gmrc") || n.includes("values")) return "values";
  if (n.includes("epp") || n.includes("tle")) return "practical";
  return "general";
}

function iconFor(family: SubjectFamily): LucideIcon {
  switch (family) {
    case "math":
      return Calculator;
    case "science":
      return FlaskConical;
    case "language":
      return Languages;
    case "social":
      return Globe2;
    case "arts":
      return Music;
    case "values":
      return HeartHandshake;
    case "practical":
      return Wrench;
    default:
      return BookOpen;
  }
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
        <div className="w-full px-6 lg:px-8 pt-6">
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
      <div className="w-full px-6 lg:px-8 pt-6 space-y-4">
        {/* Header — same pattern as TeacherAttendancePage */}
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-maroon">
            <BookOpen size={28} />
          </span>
          <div>
            <h1 className={`text-lg font-black tracking-tight ${textPrimary}`}>
              Subjects
            </h1>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
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
              className={`w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <p className={`text-[11px] font-semibold whitespace-nowrap ${textMuted}`}>
              {filteredSubjects.length} subject
              {filteredSubjects.length === 1 ? "" : "s"} shown
            </p>

            <div
              className={`flex items-center rounded-lg border p-0.5 ${
                darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
              role="group"
              aria-label="Subject view"
            >
              <button
                type="button"
                onClick={() => setGroupBySection(true)}
                aria-pressed={groupBySection}
                className={`px-2.5 h-6 rounded-md text-[10px] font-bold transition-colors ${
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
                className={`px-2.5 h-6 rounded-md text-[10px] font-bold transition-colors ${
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
                        <span className={`text-[10px] font-semibold ${textMuted}`}>
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
  const family = familyFor(subject.name);
  const Icon = iconFor(family);

  return (
    <div
      className={`group relative rounded-2xl border shadow-card overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg ${panelBg} ${panelBorder}`}
    >
      <div className="relative h-28 bg-linear-to-br from-[#5C0000] to-[#800000] rounded-tl-2xl rounded-tr-2xl rounded-bl-none rounded-br-[42px]">
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-white/15 text-white">
          {schoolYear}
        </span>

        <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#880000] ring-1 ring-[#D4AF37]/60">
          <Icon size={17} />
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5 pt-4 flex-1">
        <div>
          <h3 className={`text-sm font-bold truncate ${textPrimary}`}>
            {subject.name}
          </h3>
          <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${textMuted}`}>
            <GraduationCap size={13} />
            {subject.gradeLevel}
            {subject.section && ` · Section ${subject.section}`}
          </div>
          <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${textMuted}`}>
            <Users size={13} />
            {studentCount} student{studentCount === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex gap-2 pt-1 mt-auto">
          <button
            onClick={onRecordGrades}
            className="flex-1 h-8 rounded-lg bg-[#800000] text-white text-[11px] font-extrabold transition-colors hover:bg-[#650000]"
          >
            Record Grades
          </button>
          <button
            onClick={onClassList}
            className={`flex-1 h-8 rounded-lg border text-[11px] font-extrabold transition-colors ${
              darkMode
                ? "border-[#D4AF37]/30 bg-white/5 text-white hover:bg-white/10"
                : "border-[#D4AF37]/40 bg-white text-[#111827] hover:bg-[#FFFDF5]"
            }`}
          >
            Class List
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#D4AF37]/40 transition-all" />
    </div>
  );
}