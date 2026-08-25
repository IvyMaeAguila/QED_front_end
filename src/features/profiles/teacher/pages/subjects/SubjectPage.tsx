import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
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
import { useAuth } from "@shared/AuthContext";
import { FilterDropdown } from "@shared/components/FilterDropdown";
import {
  assignedSubjectsService,
  type AssignedSubject,
} from "./services/subjects.service";

type ViewMode = "subjects" | "graph";

interface DisplaySubject {
  id: number;
  name: string;
  gradeLevel: string;
  section: string;
}

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

function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("math")) return Calculator;
  if (n.includes("science")) return FlaskConical;
  if (
    n.includes("filipino") ||
    n.includes("english") ||
    n.includes("language") ||
    n.includes("reading")
  )
    return Languages;
  if (n.includes("araling") || n.includes("panlipunan")) return Globe2;
  if (n.includes("music") || n.includes("art") || n.includes("mapeh"))
    return Music;
  if (n.includes("gmrc") || n.includes("values")) return HeartHandshake;
  if (n.includes("epp") || n.includes("tle")) return Wrench;
  return BookOpen;
}

function codeFor(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const short =
    letters.length >= 2 ? letters.slice(0, 4) : name.slice(0, 4).toUpperCase();
  return `${short}101`;
}

const ACCENT = "#6B0000";
const ACCENT_SOFT = "rgba(107,0,0,0.08)";
const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const CARD_SHADOW =
  "0 1px 2px rgba(0,0,0,0.04), 0 12px 28px -12px rgba(0,0,0,0.10)";
const CARD_SHADOW_HOVER =
  "0 1px 2px rgba(0,0,0,0.04), 0 24px 48px -16px rgba(0,0,0,0.16)";

export function SubjectsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<DisplaySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("subjects");
  const [search, setSearch] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(GRADE_LEVELS[0]);

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

  const gradeLevelId = useMemo(() => gradeLevelToId(gradeLevel), [gradeLevel]);

  const assignedSectionNames = useMemo(
    () =>
      Array.from(
        new Set(
          subjects
            .filter((s) => s.gradeLevel === gradeLevel)
            .map((s) => s.section),
        ),
      ),
    [subjects, gradeLevel],
  );

  const gradeStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.gradeLevelId === gradeLevelId &&
          assignedSectionNames.includes(s.section),
      ),
    [students, gradeLevelId, assignedSectionNames],
  );

  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (s) =>
          s.gradeLevel === gradeLevel &&
          s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [subjects, gradeLevel, search],
  );

  const studentsForSubject = useMemo(
    () => (subject: DisplaySubject) =>
      students.filter(
        (s) => s.gradeLevelId === gradeLevelId && s.section === subject.section,
      ),
    [students, gradeLevelId],
  );

  const inputBg = darkMode ? "bg-white/[0.06]" : "bg-black/[0.03]";
  const border = panelBorder;
  const cardClasses = `rounded-[28px] border ${panelBg} ${border}`;

  const sheetBg = darkMode ? "#111111" : "#FFFFFF";

  const shimmer = `relative overflow-hidden rounded-xl ${darkMode ? "bg-white/[0.06]" : "bg-black/[0.05]"}`;
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

  const maxCount = Math.max(
    1,
    ...filteredSubjects.map((s) => studentsForSubject(s).length),
  );

  return (
    <div className="space-y-16 pb-20" style={{ fontFamily: SYSTEM_FONT }}>
      {loading && (
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
          @keyframes riseIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}

      <div className="pt-2 text-center sm:text-left">
        <p
          className="text-[13px] font-semibold uppercase tracking-[0.14em] mb-3"
          style={{ color: ACCENT }}
        >
          Teacher Workspace
        </p>
        <h1
          className={`text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight ${textPrimary}`}
        >
          Subjects.
        </h1>
        <p className={`mt-3 text-lg sm:text-xl font-normal ${textMuted}`}>
          Everything you teach, organized in one place.
        </p>
      </div>

      <div
        className={`flex flex-wrap gap-x-12 gap-y-6 border-y ${border} py-8`}
      >
        {loading ? (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="min-w-35">
                <Bone className="h-3 w-24 rounded-full" />
                <Bone className="h-9 w-14 mt-3" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="min-w-35">
              <div
                className={`flex items-center gap-2 text-[13px] font-medium ${textMuted}`}
              >
                <BookOpen size={14} style={{ color: ACCENT }} />
                Total Subjects
              </div>
              <p
                className={`text-4xl font-semibold tracking-tight mt-1 ${textPrimary}`}
              >
                {filteredSubjects.length}
              </p>
            </div>
            <div className="min-w-35">
              <div
                className={`flex items-center gap-2 text-[13px] font-medium ${textMuted}`}
              >
                <Users size={14} style={{ color: ACCENT }} />
                Total Students
              </div>
              <p
                className={`text-4xl font-semibold tracking-tight mt-1 ${textPrimary}`}
              >
                {gradeStudents.length}
              </p>
            </div>
          </>
        )}

        <div className="ml-auto self-center">
          <div
            className={`inline-flex rounded-full border p-1 ${panelBg} ${border}`}
          >
            {(["subjects", "graph"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-5 h-8 rounded-full text-[12px] font-semibold capitalize tracking-tight transition-colors duration-200 ${
                  view === mode ? "text-white" : textMuted
                }`}
                style={{ background: view === mode ? ACCENT : "transparent" }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/teacher/advisory")}
        className="group relative w-full overflow-hidden rounded-4xl px-8 py-14 sm:px-14 sm:py-20 text-left transition-transform duration-500 ease-out hover:scale-[1.01]"
        style={{
          background: `radial-gradient(120% 140% at 15% 20%, ${ACCENT} 0%, #2a0000 55%, #0a0a0a 100%)`,
        }}
      >
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/60 mb-4">
          Your Advisory Class
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-[40px] sm:text-[64px] leading-[1.02] font-semibold tracking-tight text-white">
            {gradeLevel}
          </h2>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 h-11 text-[13px] font-semibold transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: ACCENT }}
          >
            View class
            <ArrowRight size={15} />
          </span>
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-xs">
          <Search
            size={15}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject"
            className={`h-11 pl-10 pr-4 w-full text-[13px] font-medium rounded-full border outline-none transition focus:ring-2 ${inputBg} ${border} ${textPrimary}`}
            style={{ "--tw-ring-color": `${ACCENT}40` } as React.CSSProperties}
          />
        </div>
        <FilterDropdown
          label="Grade"
          value={gradeLevel}
          options={[...GRADE_LEVELS]}
          onChange={(v) => setGradeLevel(v as GradeLevel)}
          darkMode={darkMode}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-64 rounded-[28px] border p-7 ${panelBg} ${border}`}
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex items-start justify-between">
                <Bone className="w-12 h-12 rounded-2xl" />
                <Bone className="h-5 w-14 rounded-full" />
              </div>
              <Bone className="h-7 w-3/4 mt-6" />
              <Bone className="h-4 w-1/2 mt-4" />
              <Bone className="h-4 w-2/3 mt-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={`${cardClasses} py-16 text-center`}>
          <p className="text-[13px] font-medium text-red-500">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        (view === "subjects" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredSubjects.map((subject, index) => {
              const Icon = iconFor(subject.name);
              const subjectStudentCount = studentsForSubject(subject).length;
              const solidIcon = index % 2 === 0;

              return (
                <div
                  key={subject.id}
                  className={`group relative h-64 overflow-hidden rounded-[28px] border transition-[box-shadow,transform] duration-500 ease-out ${panelBg} ${border} hover:-translate-y-1`}
                  style={{
                    boxShadow: CARD_SHADOW,
                    animation: "riseIn 0.5s ease-out both",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = CARD_SHADOW;
                  }}
                >
                  <div className="p-7">
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundColor: solidIcon
                            ? ACCENT
                            : darkMode
                              ? `${ACCENT}25`
                              : ACCENT_SOFT,
                          color: solidIcon ? "#fff" : ACCENT,
                        }}
                      >
                        <Icon size={20} />
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                          darkMode
                            ? "bg-white/6 text-white/50"
                            : "bg-black/4 text-black/45"
                        }`}
                      >
                        {codeFor(subject.name)}
                      </span>
                    </div>

                    <h3
                      className={`mt-5 text-2xl font-semibold tracking-tight truncate ${textPrimary}`}
                    >
                      {subject.name}
                    </h3>

                    <div className="mt-3 space-y-1.5">
                      <div
                        className={`flex items-center gap-2 text-[13px] font-medium ${textMuted}`}
                      >
                        <Users size={14} />
                        {subjectStudentCount} student
                        {subjectStudentCount === 1 ? "" : "s"}
                      </div>
                      <div
                        className={`flex items-center gap-2 text-[13px] font-medium ${textMuted}`}
                      >
                        <GraduationCap size={14} />
                        {subject.gradeLevel}
                        {subject.section && ` · Section ${subject.section}`}
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(17,17,17,0.85)"
                        : "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    <div
                      className="pointer-events-none h-6 w-full"
                      style={{
                        background: `linear-gradient(to bottom, transparent, ${sheetBg}00)`,
                      }}
                    />
                    <div className="flex flex-col gap-2 px-7 pb-7 pt-1">
                      <button
                        onClick={() =>
                          navigate(`/teacher/subjects/${subject.id}`)
                        }
                        className="h-11 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: ACCENT }}
                      >
                        Record Grades
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/teacher/subjects/${subject.id}/students`)
                        }
                        className={`h-11 rounded-full border text-[13px] font-semibold transition-colors ${
                          darkMode
                            ? "border-white/15 text-white/80 hover:bg-white/10"
                            : "border-black/10 text-black/70 hover:bg-black/4"
                        }`}
                      >
                        View Class List
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredSubjects.length === 0 && (
              <div className={`col-span-full ${cardClasses} py-16 text-center`}>
                <p className={`text-[13px] font-medium ${textMuted}`}>
                  No subjects assigned to you for {gradeLevel} yet.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`${cardClasses} p-8`}
            style={{ boxShadow: CARD_SHADOW }}
          >
            <p
              className={`text-[13px] font-semibold uppercase tracking-wider mb-6 ${textMuted}`}
            >
              Students per Subject — {gradeLevel}
            </p>
            <div className="flex flex-col gap-4">
              {filteredSubjects.map((subject) => {
                const subjectStudentCount = studentsForSubject(subject).length;
                return (
                  <div key={subject.id} className="flex items-center gap-4">
                    <span
                      className={`text-[13px] font-medium w-56 truncate ${textPrimary}`}
                    >
                      {subject.name}
                      {subject.section && ` (${subject.section})`}
                    </span>
                    <div
                      className={`flex-1 h-2 rounded-full overflow-hidden ${inputBg}`}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${(subjectStudentCount / maxCount) * 100}%`,
                          background: ACCENT,
                        }}
                      />
                    </div>
                    <span
                      className={`text-[13px] font-semibold w-8 text-right ${textPrimary}`}
                    >
                      {subjectStudentCount}
                    </span>
                  </div>
                );
              })}
              {filteredSubjects.length === 0 && (
                <p className={`text-[13px] font-medium ${textMuted}`}>
                  No subjects to chart yet.
                </p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
