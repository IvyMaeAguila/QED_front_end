import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FlaskConical,
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
// Temporarily avoid depending on the admin subjects context (module not present)
// Provide an empty subjects array so the page renders without the missing module.
import { GRADE_LEVELS, type GradeLevel } from "../../../admin/pages/subjects/types";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { useAuth } from "@shared/AuthContext";
import { FilterDropdown } from "@shared/components/FilterDropdown";

type ViewMode = "subjects" | "graph";

function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("math")) return Calculator;
  if (n.includes("science")) return FlaskConical;
  if (n.includes("filipino") || n.includes("english") || n.includes("language") || n.includes("reading"))
    return Languages;
  if (n.includes("araling") || n.includes("panlipunan")) return Globe2;
  if (n.includes("music") || n.includes("art") || n.includes("mapeh")) return Music;
  if (n.includes("gmrc") || n.includes("values")) return HeartHandshake;
  if (n.includes("epp") || n.includes("tle")) return Wrench;
  return BookOpen;
}

export function SubjectsPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const subjects: any[] = [];
  const { students } = useStudents();
  const { user } = useAuth();

  const [view, setView] = useState<ViewMode>("subjects");
  const [search, setSearch] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(GRADE_LEVELS[0]);

  // Only the subjects assigned to this teacher, and only active ones.
  // ASSUMPTION: user.id matches Subject.teacherId. Adjust the field name
  // below if your AuthContext exposes the teacher's id differently.
  const mySubjects = useMemo(
    () =>
      subjects.filter(
        (s) => s.status === "Active" && (!user?.id || s.teacherId === user.id)
      ),
    [subjects, user]
  );

  const gradeStudents = useMemo(
    () => students.filter((s) => s.gradeLevel === gradeLevel),
    [students, gradeLevel]
  );

  const filteredSubjects = useMemo(
    () =>
      mySubjects.filter(
        (s) =>
          s.gradeLevel === gradeLevel &&
          s.name.toLowerCase().includes(search.toLowerCase())
      ),
    [mySubjects, gradeLevel, search]
  );

  const inputBg = darkMode ? "bg-[#0B1120]" : "bg-[#F8FAFC]";
  const border = panelBorder;
  const accent = "#8B0D0D";

  const maxCount = Math.max(1, gradeStudents.length);

  return (
    <div>
      {/* Header row: summary cards + view toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div
            className={`rounded-2xl border px-6 py-4 min-w-[180px] ${panelBg} ${border}`}
            style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
          >
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              <BookOpen size={15} style={{ color: accent }} />
              Total Subjects
            </div>
            <p className={`text-3xl font-black mt-2 ${textPrimary}`}>{filteredSubjects.length}</p>
          </div>
          <div
            className={`rounded-2xl border px-6 py-4 min-w-[180px] ${panelBg} ${border}`}
            style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
          >
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              <Users size={15} style={{ color: accent }} />
              Total Student
            </div>
            <p className={`text-3xl font-black mt-2 ${textPrimary}`}>{gradeStudents.length}</p>
          </div>
        </div>

        <div className={`inline-flex rounded-xl border p-1 ${panelBg} ${border}`}>
          {(["subjects", "graph"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-5 h-9 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                view === mode ? "text-white" : textMuted
              }`}
              style={{ background: view === mode ? accent : "transparent" }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Advisory section banner */}
      <button
        onClick={() => navigate("/teacher/advisory")}
        className={`w-full flex items-center justify-between rounded-2xl border px-6 py-5 mb-6 text-left transition-colors ${panelBg} ${border} hover:border-[#8B0D0D]/40`}
      >
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: accent }}>
            ADVISORY
          </h2>
          <span className={`text-2xl font-light ${textMuted}`}>{gradeLevel}</span>
        </div>
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: accent }}
        >
          <ArrowRight size={18} className="text-white" />
        </span>
      </button>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject"
            className={`h-9 pl-9 pr-4 w-full text-xs font-semibold rounded-xl border outline-none focus:border-[#8B0D0D] ${inputBg} ${border} ${textPrimary}`}
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

      {/* Subjects grid or graph */}
      {view === "subjects" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => {
            const Icon = iconFor(subject.name);
            return (
              <div
                key={subject.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ boxShadow: "0 8px 24px -4px rgba(85,0,0,0.2)" }}
              >
                <div
                  className="p-6 text-white flex-1"
                  style={{ background: "linear-gradient(135deg, #5C0000 0%, #8B0D0D 100%)" }}
                >
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold leading-snug">{subject.name}</h3>
                  <p className="text-xs font-semibold text-white/70 mt-0.5">
                    {subject.gradeLevel}
                    {subject.section && ` - ${subject.section}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-white/80">
                    <Users size={13} />
                    {gradeStudents.length} students
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/teacher/subjects/${subject.id}`)}
                  className={`w-full py-3 text-xs font-bold uppercase tracking-wider ${panelBg} hover:bg-black/5 transition-colors`}
                  style={{ color: accent }}
                >
                  View Details
                </button>
              </div>
            );
          })}
          {filteredSubjects.length === 0 && (
            <div
              className={`col-span-full rounded-2xl border py-16 text-center ${panelBg} ${border}`}
            >
              <p className={`text-xs font-semibold ${textMuted}`}>
                No subjects assigned to you for {gradeLevel} yet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-6 ${panelBg} ${border}`}
          style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
        >
          <p className={`text-xs font-bold uppercase tracking-wider mb-5 ${textMuted}`}>
            Students per Subject — {gradeLevel}
          </p>
          <div className="flex flex-col gap-3">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-56 truncate ${textPrimary}`}>
                  {subject.name}
                </span>
                <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${inputBg}`}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(gradeStudents.length / maxCount) * 100}%`,
                      background: accent,
                    }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 text-right ${textPrimary}`}>
                  {gradeStudents.length}
                </span>
              </div>
            ))}
            {filteredSubjects.length === 0 && (
              <p className={`text-xs font-semibold ${textMuted}`}>No subjects to chart yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}