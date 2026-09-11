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
  OverviewCard,
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
 * Subject "family" — still drives the icon and the abstract orb motif,
 * so each card's visual identity is grounded in what the subject is.
 * Color, however, no longer varies by family: every card lives on the
 * same maroon → gold brand palette, with only subtle depth differences
 * (gradient angle / stop position) so the grid doesn't look flat.
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
 * Brand palette. Every family shares these three colors — only the
 * gradient direction/stops and the orb's gold intensity shift slightly,
 * so cards feel differentiated without breaking the maroon/white/gold
 * identity.
 */
const MAROON_DEEP = "#4A0000";
const MAROON = "#6B0000";
const MAROON_BRIGHT = "#8B0000";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0D68F";
const CREAM = "#FFFDF5";

const FAMILY_THEME: Record<
  SubjectFamily,
  { gradient: string; orbFrom: string; orbTo: string; orbCore: string }
> = {
  math: {
    gradient: "from-[#4A0000] via-[#6B0000] to-[#B8860B]",
    orbFrom: GOLD_LIGHT,
    orbTo: MAROON_DEEP,
    orbCore: CREAM,
  },
  science: {
    gradient: "from-[#5C0000] via-[#7A0000] to-[#C9A227]",
    orbFrom: GOLD_LIGHT,
    orbTo: MAROON,
    orbCore: CREAM,
  },
  language: {
    gradient: "from-[#4A0000] via-[#800000] to-[#D4AF37]",
    orbFrom: "#F5E1A4",
    orbTo: MAROON_DEEP,
    orbCore: CREAM,
  },
  social: {
    gradient: "from-[#5C0000] via-[#8B0000] to-[#C9A227]",
    orbFrom: GOLD_LIGHT,
    orbTo: MAROON,
    orbCore: CREAM,
  },
  arts: {
    gradient: "from-[#6B0000] via-[#9C1C1C] to-[#D4AF37]",
    orbFrom: "#F5E1A4",
    orbTo: MAROON_BRIGHT,
    orbCore: CREAM,
  },
  values: {
    gradient: "from-[#4A0000] via-[#800000] to-[#B8860B]",
    orbFrom: GOLD_LIGHT,
    orbTo: MAROON_DEEP,
    orbCore: CREAM,
  },
  practical: {
    gradient: "from-[#3D0000] via-[#6B0000] to-[#A67C00]",
    orbFrom: "#E9D19A",
    orbTo: MAROON_DEEP,
    orbCore: "#FDF8EF",
  },
  general: {
    gradient: "from-[#5C0000] via-[#800000] to-[#C9A227]",
    orbFrom: GOLD_LIGHT,
    orbTo: MAROON,
    orbCore: CREAM,
  },
};

/** Abstract line motif drawn inside the orb, one per family — always
 *  rendered in gold so it reads clearly against the maroon orb base. */
function OrbMotif({ family }: { family: SubjectFamily }) {
  const stroke = GOLD_LIGHT;
  switch (family) {
    case "math":
      // grid of coordinate ticks
      return (
        <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
          <line x1="16" y1="34" x2="34" y2="34" />
          <line x1="22" y1="16" x2="22" y2="34" />
          <circle cx="27" cy="22" r="1.6" fill={stroke} stroke="none" />
          <circle cx="30" cy="27" r="1.6" fill={stroke} stroke="none" />
        </g>
      );
    case "science":
      // molecule
      return (
        <g stroke={stroke} strokeWidth="1.4">
          <line x1="17" y1="30" x2="25" y2="18" />
          <line x1="25" y1="18" x2="33" y2="26" />
          <circle cx="17" cy="30" r="2.6" fill={stroke} stroke="none" />
          <circle cx="25" cy="18" r="2.6" fill={stroke} stroke="none" />
          <circle cx="33" cy="26" r="2.6" fill={stroke} stroke="none" />
        </g>
      );
    case "language":
      // speech wave
      return (
        <g stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M15 26 Q20 16 25 26 T35 26" />
        </g>
      );
    case "social":
      // latitude lines on a globe
      return (
        <g stroke={stroke} strokeWidth="1.3" fill="none">
          <circle cx="25" cy="25" r="10" />
          <ellipse cx="25" cy="25" rx="4" ry="10" />
          <line x1="15" y1="25" x2="35" y2="25" />
        </g>
      );
    case "arts":
      // sound ripple bars
      return (
        <g stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <line x1="17" y1="28" x2="17" y2="20" />
          <line x1="22" y1="31" x2="22" y2="15" />
          <line x1="27" y1="27" x2="27" y2="23" />
          <line x1="32" y1="30" x2="32" y2="18" />
        </g>
      );
    case "values":
      // soft heart
      return (
        <path
          d="M25 32c-6-4.5-10-8-10-12.5A5.5 5.5 0 0 1 25 17a5.5 5.5 0 0 1 10 2.5c0 4.5-4 8-10 12.5Z"
          fill={stroke}
        />
      );
    case "practical":
      // gear hint
      return (
        <g stroke={stroke} strokeWidth="1.4" fill="none">
          <circle cx="25" cy="25" r="6" />
          <line x1="25" y1="14" x2="25" y2="17" />
          <line x1="25" y1="33" x2="25" y2="36" />
          <line x1="14" y1="25" x2="17" y2="25" />
          <line x1="33" y1="25" x2="36" y2="25" />
        </g>
      );
    default:
      // loose sparkle
      return (
        <g fill={stroke}>
          <circle cx="22" cy="22" r="2" />
          <circle cx="30" cy="29" r="1.3" />
        </g>
      );
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
  const [gradeLevel, setGradeLevel] = useState<GradeFilter>(GRADE_LEVELS[0]);

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

  const isAllGrades = gradeLevel === ALL_GRADES;
  const gradeLevelId = useMemo(
    () => (isAllGrades ? null : gradeLevelToId(gradeLevel)),
    [gradeLevel, isAllGrades],
  );

  // Pairs of "gradeId|section" this teacher is actually assigned to — used
  // instead of bare section names so sections that share a name across
  // different grade levels don't get conflated when "All Grades" is active.
  const assignedGradeSectionPairs = useMemo(
    () =>
      new Set(
        subjects.map((s) => `${gradeLevelToId(s.gradeLevel)}|${s.section}`),
      ),
    [subjects],
  );

  const gradeStudents = useMemo(
    () =>
      students.filter((s) => {
        if (!isAllGrades && s.gradeLevelId !== gradeLevelId) return false;
        return assignedGradeSectionPairs.has(
          `${s.gradeLevelId}|${s.section ?? ""}`,
        );
      }),
    [students, gradeLevelId, isAllGrades, assignedGradeSectionPairs],
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

        {/* Advisory banner */}
        <div className="rounded-2xl overflow-hidden shadow-primary bg-maroon-gradient">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-6 sm:p-7">
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Users size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                  Your Advisory Class
                </p>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 truncate">
                  {gradeLevel}
                </h2>
                <p className="text-xs font-medium text-white/70 mt-1">
                  {gradeStudents.length} student
                  {gradeStudents.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/teacher/advisory")}
              className="h-10 px-5 rounded-xl bg-white text-[#6B0000] text-[11px] font-extrabold uppercase tracking-wide transition-colors hover:bg-white/90 shrink-0"
            >
              View Advisory Class
            </button>
          </div>
        </div>

        {/* Toolbar — search + subject count, same bar style as attendance page */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
        >
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
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

          <p className={`text-[11px] font-semibold px-1 ${textMuted}`}>
            {filteredSubjects.length} subject
            {filteredSubjects.length === 1 ? "" : "s"} shown
          </p>
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
                  value={gradeLevel}
                  onChange={(v) => setGradeLevel(v as GradeFilter)}
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
                    : `No subjects assigned to you for ${gradeLevel} yet.`}
                </p>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredSubjects.map((subject) => {
                    const family = familyFor(subject.name);
                    const Icon = iconFor(family);
                    const theme = FAMILY_THEME[family];
                    const subjectStudentCount = studentsForSubject(subject).length;
                    const gradientId = `subject-orb-${subject.id}`;

                    return (
                      <div
                        key={subject.id}
                        className={`group relative rounded-2xl border shadow-card overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg ${panelBg} ${panelBorder}`}
                      >
                        {/* Banner — maroon-to-gold brand gradient, scooped
                            bottom-right corner reveals the panel background
                            beneath it, like a card cut from a single sheet
                            rather than a stacked block. A thin gold seam
                            along the bottom marks the transition. */}
                        <div
                          className={`relative h-28 bg-linear-to-br ${theme.gradient} rounded-tl-2xl rounded-tr-2xl rounded-bl-none rounded-br-[42px]`}
                        >
                          {/* soft abstract fog shapes — warm gold glow instead
                              of a neutral shadow, to keep the palette on-brand */}
                          <div className="absolute -left-4 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                          <div className="absolute right-6 bottom-2 h-14 w-14 rounded-full bg-[#D4AF37]/25 blur-lg" />

                          {/* hairline gold seam under the scoop */}
                          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#D4AF37]/70 to-transparent" />

                          {/* school year badge */}
                          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-white/15 text-[#FFFFFF] backdrop-blur-sm">
                            {schoolYear}
                          </span>

                          {/* abstract glass orb, motif keyed to the subject,
                              rendered in cream-to-maroon with a gold core */}
                          <svg
                            viewBox="0 0 50 50"
                            className="absolute -right-3 top-4 h-16 w-16 drop-shadow-md"
                          >
                            <defs>
                              <radialGradient
                                id={gradientId}
                                cx="35%"
                                cy="30%"
                                r="75%"
                              >
                                <stop offset="0%" stopColor={theme.orbCore} />
                                <stop offset="45%" stopColor={theme.orbFrom} />
                                <stop offset="100%" stopColor={theme.orbTo} />
                              </radialGradient>
                            </defs>
                            <circle
                              cx="25"
                              cy="25"
                              r="22"
                              fill={`url(#${gradientId})`}
                              opacity="0.94"
                            />
                            <circle
                              cx="25"
                              cy="25"
                              r="22"
                              fill="none"
                              stroke="#D4AF37"
                              strokeOpacity="0.45"
                              strokeWidth="0.8"
                            />
                            <ellipse
                              cx="18"
                              cy="16"
                              rx="8"
                              ry="4.5"
                              fill="white"
                              opacity="0.35"
                            />
                            <OrbMotif family={family} />
                          </svg>

                          <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#880000] ring-1 ring-[#D4AF37]/60 backdrop-blur-sm">
                            <Icon size={17} />
                          </span>
                        </div>

                        {/* Content panel */}
                        <div className="flex flex-col gap-3 p-5 pt-4 flex-1">
                          <div>
                            <h3 className={`text-sm font-bold truncate ${textPrimary}`}>
                              {subject.name}
                            </h3>
                            <div
                              className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${textMuted}`}
                            >
                              <GraduationCap size={13} />
                              {subject.gradeLevel}
                              {subject.section && ` · Section ${subject.section}`}
                            </div>
                            <div
                              className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${textMuted}`}
                            >
                              <Users size={13} />
                              {subjectStudentCount} student
                              {subjectStudentCount === 1 ? "" : "s"}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 mt-auto">
                            <button
                              onClick={() => navigate(`/teacher/subjects/${subject.id}`)}
                              className="flex-1 h-8 rounded-lg bg-[#800000] text-white text-[11px] font-extrabold transition-colors hover:bg-[#650000]"
                            >
                              Record Grades
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/teacher/subjects/${subject.id}/students`)
                              }
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

                        {/* gold ring on hover, subtle premium touch */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#D4AF37]/40 transition-all" />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}