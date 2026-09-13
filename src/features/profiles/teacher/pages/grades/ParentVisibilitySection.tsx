import { Fragment, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, User, Loader2, CheckSquare, Square } from "lucide-react";
import {
  fetchGradeVisibility,
  setGradeVisibility,
  type VisibilityStudent,
} from "./services/gradePage.service";

interface ParentVisibilitySectionProps {
  gradingPeriodId: string;
  termLabel: string;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function studentDisplayName(s: { firstName: string; lastName: string; middleName: string | null }) {
  const mi = s.middleName ? ` ${s.middleName.charAt(0)}.` : "";
  return `${s.lastName}, ${s.firstName}${mi}`;
}

export function ParentVisibilitySection({
  gradingPeriodId,
  termLabel,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: ParentVisibilitySectionProps) {
  const [students, setStudents] = useState<VisibilityStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<"show" | "hide" | null>(null);

  useEffect(() => {
    if (!gradingPeriodId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGradeVisibility(gradingPeriodId)
      .then((data) => {
        if (cancelled) return;
        setStudents(data);
        setSelected(new Set());
      })
      .catch((err) => {
        console.error("Failed to load grade visibility:", err);
        if (!cancelled) setError("Failed to load visibility settings for this term.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [gradingPeriodId]);

  const groupedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
    const male = sorted.filter((s) => s.gender === "M");
    const female = sorted.filter((s) => s.gender === "F");
    const groups: { label: "Male" | "Female"; students: VisibilityStudent[] }[] = [];
    if (male.length) groups.push({ label: "Male", students: male });
    if (female.length) groups.push({ label: "Female", students: female });
    return groups;
  }, [students]);

  const allSelected = students.length > 0 && selected.size === students.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.studentId)));
  }

  async function applyVisibility(visible: boolean) {
    if (selected.size === 0) return;
    setApplying(visible ? "show" : "hide");
    try {
      const applyToAll = selected.size === students.length;
      await setGradeVisibility({
        gradingPeriodId,
        visible,
        applyToAll,
        studentIds: applyToAll ? undefined : Array.from(selected),
      });
      setStudents((prev) =>
        prev.map((s) =>
          selected.has(s.studentId)
            ? { ...s, isVisible: visible, updatedAt: new Date().toISOString() }
            : s
        )
      );
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to update grade visibility:", err);
      setError("Failed to update visibility. Please try again.");
    } finally {
      setApplying(null);
    }
  }

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <section className={cardClasses} aria-label="Parent grade visibility">
      <div className={`flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
        <div>
          <h2 className={`font-extrabold ${textPrimary}`}>Parent Visibility</h2>
          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
            {termLabel} · Choose which students' grades parents can currently see
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyVisibility(true)}
            disabled={selected.size === 0 || applying !== null}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#157F3B] px-4 text-xs font-bold text-white transition disabled:opacity-50"
          >
            {applying === "show" ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Show to Parents{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
          <button
            onClick={() => applyVisibility(false)}
            disabled={selected.size === 0 || applying !== null}
            className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-50 ${
              darkMode ? "border-white/15 text-white/80 hover:bg-white/10" : "border-black/10 text-black/70 hover:bg-black/4"
            }`}
          >
            {applying === "hide" ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
            Hide from Parents{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-16 text-center">
          <Loader2 size={20} className={`mx-auto animate-spin ${textMuted}`} />
        </div>
      ) : error ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-bold text-red-500">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className={`font-bold ${textPrimary}`}>No students found</p>
          <p className={`mt-1 text-sm ${textMuted}`}>There are no students on record for this advisory class.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                <th className="w-12 px-5 py-4">
                  <button onClick={toggleAll} aria-label="Select all students" className="flex items-center">
                    {allSelected ? (
                      <CheckSquare size={16} className="text-[#6B0000]" />
                    ) : someSelected ? (
                      <CheckSquare size={16} className="text-[#6B0000] opacity-50" />
                    ) : (
                      <Square size={16} className={textMuted} />
                    )}
                  </button>
                </th>
                <th className={`px-3 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>Student</th>
                <th className={`px-3 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>Parent/Guardian</th>
                <th className={`px-3 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>Visible to Parents</th>
                <th className={`px-3 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {groupedStudents.map((group) => (
                <Fragment key={group.label}>
                  <tr className={darkMode ? "bg-white/5" : "bg-[#F8EDEE]"}>
                    <td colSpan={5} className="px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#6B0000]">
                      {group.label} · {group.students.length} student{group.students.length === 1 ? "" : "s"}
                    </td>
                  </tr>
                  {group.students.map((student, index) => (
                    <tr
                      key={student.studentId}
                      className={`border-t transition-colors ${panelBorder} ${
                        index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""
                      } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                    >
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleOne(student.studentId)}
                          aria-label={`Select ${studentDisplayName(student)}`}
                          className="flex items-center"
                        >
                          {selected.has(student.studentId) ? (
                            <CheckSquare size={16} className="text-[#6B0000]" />
                          ) : (
                            <Square size={16} className={textMuted} />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                            <User size={16} className="text-[#6B0000]" />
                          </span>
                          <p className={`font-extrabold ${textPrimary}`}>{studentDisplayName(student)}</p>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {student.parentName ? (
                          <div>
                            <p className={`font-bold ${textPrimary}`}>{student.parentName}</p>
                            {student.parentContactNumber && (
                              <p className={`text-xs ${textMuted}`}>{student.parentContactNumber}</p>
                            )}
                          </div>
                        ) : (
                          <span className={`text-xs italic ${textMuted}`}>No parent linked</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        {student.isVisible ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-3 py-1.5 text-xs font-extrabold text-[#157F3B]">
                            <Eye size={12} /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-extrabold text-gray-500 dark:bg-gray-500/20 dark:text-gray-400">
                            <EyeOff size={12} /> Hidden
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-4 text-xs font-medium ${textMuted}`}>
                        {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}