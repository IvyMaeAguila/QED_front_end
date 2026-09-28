import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, School, Search } from "lucide-react";
import { useClasses } from "./context/ClassesContext";
import { ClassCard } from "./components/ClassCard";
import { Dropdown } from "../studentrecords/components/Studentsfilterbar";
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "../studentrecords/types/Students";
import type { AdminThemeContext } from "../AdminLayout";
import { DangerConfirmModal } from "@shared/components/DangerConfirmModal";

export function ClassesPage() {
  const navigate = useNavigate();
  const { classes, deleteClass } = useClasses();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();

  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "All Grades">(
    "All Grades",
  );
  const [search, setSearch] = useState("");

  const [classToDelete, setClassToDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (gradeFilter !== "All Grades" && c.gradeLevel !== gradeFilter)
        return false;
      if (q) {
        const haystack =
          `${c.gradeLevel} ${c.section ?? ""} ${c.adviserName ?? ""} ${c.room ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [classes, gradeFilter, search]);

  // Tinatanggap ang class id na kasalukuyang naka-set sa classToDelete.
  // I-null out lang ang state kapag tagumpay — kung mag-throw ito,
  // hahawakan ng DangerConfirmModal ang error at hindi ito magsasara.
  async function handleDeleteClass() {
    if (!classToDelete) return;
    await deleteClass(classToDelete.id);
    setClassToDelete(null);
  }

  return (
    <div className="w-full min-h-full space-y-4 px-6 pb-12 pt-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
              Classes Management
            </h1>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
              {filtered.length} of {classes.length} class
              {classes.length === 1 ? "" : "es"} shown
            </p>
          </div>
        </div>
      </div>

      {/* Search bar with grade filter + add button beside it */}
      <div
        className={`relative z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border px-3 py-2 ${panelBg} ${panelBorder}`}
      >
        <div className="relative w-full sm:w-80 sm:shrink-0">
          <span className="absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 pointer-events-none text-gray-400">
            <Search size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className={`relative w-full h-8 pl-8 pr-2.5 rounded-lg border text-[11px] font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${
              darkMode ? "text-white" : "text-[#111827]"
            } placeholder:text-gray-400 focus:border-maroon`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Dropdown
            label="Grade level filter"
            value={gradeFilter}
            options={["All Grades", ...GRADE_LEVELS]}
            onChange={setGradeFilter}
            darkMode={darkMode}
          />
          <button
            onClick={() => navigate("new")}
            className="h-8 px-3 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1.5 shrink-0 transition-colors hover:bg-[#6B0000]"
            style={{ background: "#8B0D0D" }}
          >
            <Plus size={13} />
            Add Class
          </button>
        </div>
      </div>

      <main>
        {filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className={`text-sm font-semibold ${textMuted}`}>
              No classes match the current filters.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((c) => {
              const studentCount = (c as any).studentCount ?? 0;

              return (
                <ClassCard
                  key={c.id}
                  schoolClass={c}
                  adviserName={c.adviserName || "Unassigned"}
                  room={c.room || "Unasigned"}
                  studentCount={studentCount}
                  darkMode={darkMode}
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  onView={() => navigate(c.id)}
                  onEdit={() => navigate(`${c.id}/edit`)}
                  onDelete={() =>
                    setClassToDelete({
                      id: c.id,
                      label: c.section
                        ? `${c.gradeLevel} - ${c.section}`
                        : c.gradeLevel,
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </main>
      {classToDelete && (
        <DangerConfirmModal
          title="Delete this class?"
          description={
            <>
              This will also delete all schedules, subjects, grades, attendance,
              and holistic ratings tied to {classToDelete.label}. This can't be
              undone.
            </>
          }
          confirmPhrase="EUCandelaria"
          confirmLabel="Delete class"
          successMessage="Class deleted successfully!"
          errorMessage="Failed to delete class."
          onClose={() => setClassToDelete(null)}
          onConfirm={handleDeleteClass}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      )}
    </div>
  );
}