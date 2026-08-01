import { useMemo, useState, type CSSProperties } from "react";
import { BookOpen, Filter, Search, User } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { FilterDropdown } from "@shared/components/FilterDropdown";
import { SUBJECTS, seedAcademicRecords, studentFullName, studentSectionLabel } from "./data/academicRecords";

const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"];
const FILTER_OPTIONS = ["All Students", "Highest Grades", "Lowest Grades", "Boys", "Girls"];
const ACCENT = "#6B0000";

const gradeStyle = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined) return { color: "#6B7280", background: "#F3F4F6" };
  if (grade >= 90) return { color: "#157F3B", background: "#EAF8EF" };
  if (grade >= 80) return { color: "#1D70D6", background: "#EAF2FF" };
  if (grade >= 75) return { color: "#B45309", background: "#FFF4DB" };
  return { color: "#C2255C", background: "#FCE7F1" };
};

const WEIGHT_GUIDES = [
  { subjects: "Language, Reading & Literacy, Makabansa, GMRC", weights: ["WW 30%", "PT 50%", "QA 20%"] },
  { subjects: "Mathematics, Science", weights: ["WW 40%", "PT 40%", "QA 20%"] },
  { subjects: "MAPEH, EPP", weights: ["WW 20%", "PT 60%", "QA 20%"] },
];

export function GradesPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { students } = useStudents();
  const [term, setTerm] = useState(TERMS[0]);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState(FILTER_OPTIONS[0]);

  const section = useMemo(() => studentSectionLabel(students[0] ?? {}), [students]);
  const records = useMemo(() => seedAcademicRecords(students), [students]);

  const filtered = useMemo(() => {
    let result = students.filter((student) =>
      studentFullName(student).toLowerCase().includes(search.toLowerCase())
    );

    // Apply category filter (Gender / Grade performance)
    if (studentFilter === "Boys") {
      result = result.filter((s) => s.gender?.toLowerCase() === "male");
    } else if (studentFilter === "Girls") {
      result = result.filter((s) => s.gender?.toLowerCase() === "female");
    } else if (studentFilter === "Highest Grades" || studentFilter === "Lowest Grades") {
      result = [...result].sort((a, b) => {
        const recordA = records[a.id];
        const recordB = records[b.id];
        
        const gradesA = recordA ? Object.values(recordA.grades).filter((g): g is number => typeof g === "number") : [];
        const gradesB = recordB ? Object.values(recordB.grades).filter((g): g is number => typeof g === "number") : [];
        
        const avgA = gradesA.length ? gradesA.reduce((sum, g) => sum + g, 0) / gradesA.length : 0;
        const avgB = gradesB.length ? gradesB.reduce((sum, g) => sum + g, 0) / gradesB.length : 0;

        return studentFilter === "Highest Grades" ? avgB - avgA : avgA - avgB;
      });
    }

    return result;
  }, [students, search, studentFilter, records]);

  const gradeLevel = students[0]?.gradeLevel ?? "";
  const isMatatag = /(?:grade\s*)?[1-3](?!\d)/i.test(gradeLevel);
  const curriculum = isMatatag ? "Matatag Curriculum" : "Intermediate Grades";
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>Advisory class</p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>Gradebook</h1>
          <p className={`mt-2 max-w-2xl text-sm font-medium ${textMuted}`}>
            View subject grades for your advisory class. Grade computation and editing are managed in the dedicated grading module.
          </p>
        </div>
        <span className="w-fit rounded-xl px-3 py-2 text-xs font-extrabold" style={{ backgroundColor: "#F8EDEE", color: ACCENT }}>
          {gradeLevel || "Advisory class"} · {curriculum}
        </span>
      </div>

      <section className={cardClasses} aria-label="Advisory class grades">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}>
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>{section || "Advisory Class"}</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>{term} · {filtered.length} student{filtered.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student"
                className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none transition focus:ring-2 sm:w-48 ${panelBg} ${panelBorder} ${textPrimary}`}
                style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
              />
            </div>
            <FilterDropdown label="Filter" value={studentFilter} options={FILTER_OPTIONS} onChange={setStudentFilter} darkMode={darkMode} />
            <FilterDropdown label="Term" value={term} options={TERMS} onChange={setTerm} darkMode={darkMode} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try changing the search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th className={`sticky left-0 z-1 min-w-60 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"} ${textMuted}`}>Student</th>
                  {SUBJECTS.map((subject) => (
                    <th key={subject.key} className={`min-w-28 px-3 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                      {subject.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => {
                  const record = records[student.id];
                  return (
                    <tr key={student.id} className={`border-t transition-colors ${panelBorder} ${index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""} ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}>
                      <td className={`sticky left-0 z-1 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                            <User size={16} style={{ color: ACCENT }} />
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate font-extrabold ${textPrimary}`}>{studentFullName(student)}</p>
                            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Student ID: {student.id}</p>
                          </div>
                        </div>
                      </td>
                      {SUBJECTS.map((subject) => {
                        const grade = record?.grades[subject.key] ?? null;
                        const style = gradeStyle(grade);
                        return (
                          <td key={subject.key} className="px-3 py-4 text-center">
                            <span className="inline-flex min-w-11 justify-center rounded-lg px-2.5 py-1.5 text-xs font-black tabular-nums" style={{ backgroundColor: darkMode && grade !== null ? `${style.color}25` : style.background, color: style.color }}>
                              {grade ?? "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className={`${cardClasses} p-5 sm:p-6`}>
          <div className="flex items-start gap-3">
            <Filter size={17} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Subjects by curriculum</h2>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>Grade 1–3 follows Matatag Curriculum; Grade 4–6 follows Intermediate Grades.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#EEF6FF] p-4">
              <p className="text-xs font-black text-[#1D70D6]">Grade 1–3 · Matatag</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-[#36536F]">Language · Reading and Literacy · Mathematics · Makabansa · GMRC</p>
            </div>
            <div className="rounded-xl bg-[#F8EDEE] p-4">
              <p className="text-xs font-black" style={{ color: ACCENT }}>Grade 4–6 · Intermediate</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-[#734848]">English & Filipino · Mathematics · Science · Araling Panlipunan · EPP · MAPEH · GMRC</p>
            </div>
          </div>
        </div>

        <div className={`${cardClasses} p-5 sm:p-6`}>
          <h2 className={`font-extrabold ${textPrimary}`}>Summative assessment reference</h2>
          <p className={`mt-1 text-xs font-medium ${textMuted}`}>Weights are shown for reference only; this page does not calculate grades.</p>
          <div className="mt-5 space-y-2">
            {WEIGHT_GUIDES.map((guide) => (
              <div key={guide.subjects} className={`rounded-xl border p-3 ${panelBorder}`}>
                <p className={`text-xs font-bold ${textPrimary}`}>{guide.subjects}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {guide.weights.map((weight) => <span key={weight} className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${darkMode ? "bg-white/[0.07]" : "bg-[#F8FAFC]"} ${textMuted}`}>{weight}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}