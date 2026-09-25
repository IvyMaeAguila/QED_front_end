import { Fragment, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, User, Loader2, CheckSquare, Square } from "lucide-react";
import {
  fetchGradeVisibility,
  setGradeVisibility,
  type VisibilityStudent,
} from "./services/gradePage.service";

const ACCENT = "#6B0000";

interface ParentVisibilitySectionProps {
  gradingPeriodId: string;
  classId?: string; // NEW: which advisory section this panel operates on
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
  classId,
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
    fetchGradeVisibility(gradingPeriodId, classId)
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
  }, [gradingPeriodId, classId]);

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
        classId,
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

  const cardClasses = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const groupBand = `px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
    darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
  } ${textPrimary}`;

  return (
    <section className={cardClasses} aria-label="Parent grade visibility">
      <div className={`flex flex-col gap-2.5 border-b px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Parent Visibility</p>
          <p className={`truncate text-[11px] font-medium ${textMuted}`}>
            {termLabel} · Choose which students' grades parents can currently see
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyVisibility(true)}
            disabled={selected.size === 0 || applying !== null}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold text-[#157F3B] transition-colors disabled:opacity-50 ${
              darkMode ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-black/5"
            }`}
          >
            {applying === "show" ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
            Show to Parents{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
          <button
            onClick={() => applyVisibility(false)}
            disabled={selected.size === 0 || applying !== null}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-colors disabled:opacity-50 ${
              darkMode
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-black/10 bg-white text-[#111827] hover:bg-black/5"
            }`}
          >
            {applying === "hide" ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />}
            Hide from Parents{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-16 text-center">
          <Loader2 size={18} className={`mx-auto animate-spin ${textMuted}`} />
        </div>
      ) : error ? (
        <p className="px-4 py-16 text-center text-xs font-bold text-red-500">{error}</p>
      ) : students.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className={`text-sm font-bold ${textPrimary}`}>No students found</p>
          <p className={`mt-1 text-xs ${textMuted}`}>There are no students on record for this advisory class.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
                <th className="w-10 px-4 py-2">
                  <button onClick={toggleAll} aria-label="Select all students" className="flex items-center">
                    {allSelected ? (
                      <CheckSquare size={15} style={{ color: ACCENT }} />
                    ) : someSelected ? (
                      <CheckSquare size={15} style={{ color: ACCENT, opacity: 0.5 }} />
                    ) : (
                      <Square size={15} className={textMuted} />
                    )}
                  </button>
                </th>
                <th className={`px-3 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>
                  Student
                </th>
                <th className={`px-3 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>
                  Parent/Guardian
                </th>
                <th className={`px-3 py-2 text-center text-[11px] font-black uppercase tracking-wider ${textMuted}`}>
                  Visible to Parents
                </th>
                <th className={`px-3 py-2 text-left text-[11px] font-black uppercase tracking-wider ${textMuted}`}>
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedStudents.map((group) => (
                <Fragment key={group.label}>
                  <tr>
                    <td colSpan={5} className={groupBand}>
                      {group.label} · {group.students.length} student{group.students.length === 1 ? "" : "s"}
                    </td>
                  </tr>
                  {group.students.map((student) => (
                    <tr
                      key={student.studentId}
                      className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}
                    >
                      <td className="px-4 py-2">
                        <button
                          onClick={() => toggleOne(student.studentId)}
                          aria-label={`Select ${studentDisplayName(student)}`}
                          className="flex items-center"
                        >
                          {selected.has(student.studentId) ? (
                            <CheckSquare size={15} style={{ color: ACCENT }} />
                          ) : (
                            <Square size={15} className={textMuted} />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                              darkMode ? "bg-white/10" : "bg-black/5"
                            } ${textMuted}`}
                          >
                            <User size={13} />
                          </span>
                          <span className={`truncate text-xs font-bold ${textPrimary}`}>
                            {studentDisplayName(student)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {student.parentName ? (
                          <div className="min-w-0">
                            <p className={`truncate text-xs font-bold ${textPrimary}`}>{student.parentName}</p>
                            {student.parentContactNumber && (
                              <p className={`text-[11px] font-medium ${textMuted}`}>
                                {student.parentContactNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className={`text-[11px] italic font-medium ${textMuted}`}>No parent linked</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {student.isVisible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#157F3B]">
                            <Eye size={12} /> Visible
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${textMuted}`}>
                            <EyeOff size={12} /> Hidden
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-[11px] font-medium ${textMuted}`}>
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