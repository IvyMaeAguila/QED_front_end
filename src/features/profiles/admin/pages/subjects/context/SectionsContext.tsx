import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Section, GRADE_LEVEL_IDS, GRADE_LEVEL_BY_ID } from "../types";
import type { GradeLevel } from "../types";
import { fetchSectionsByGrade, createSection, deleteSection, type SectionRow } from "../services/section.service";

type AddSectionResult = { ok: true } | { ok: false; error: string };

interface SectionsContextValue {
  sections: Section[];
  loading: boolean;
  getSectionsForGrade: (grade: GradeLevel) => Section[];
  loadSectionsForGrade: (grade: GradeLevel) => Promise<void>;
  addSection: (grade: GradeLevel, name: string) => Promise<AddSectionResult>;
  removeSection: (id: string) => Promise<void>;
}

const SectionsContext = createContext<SectionsContextValue | undefined>(undefined);

function mapRow(row: SectionRow): Section {
  return {
    id: String(row.id),
    gradeLevel: GRADE_LEVEL_BY_ID[Number(row.grade_level_id)] ?? (row.grade_level_id as unknown as GradeLevel),
    name: row.section_name,
  };
}

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loadedGrades, setLoadedGrades] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadSectionsForGrade = useCallback(async (grade: GradeLevel) => {
    setLoading(true);
    try {
      const gradeId = GRADE_LEVEL_IDS[grade];
      const rows = await fetchSectionsByGrade(String(gradeId));
      const mapped = rows.map(mapRow);
      setSections((prev) => [...prev.filter((s) => s.gradeLevel !== grade), ...mapped]);
      setLoadedGrades((prev) => new Set(prev).add(grade));
    } catch (err) {
      console.error("Failed to load sections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // hindi na ito nagpe-fetch, plain getter na lang
  function getSectionsForGrade(grade: GradeLevel) {
    return sections.filter((s) => s.gradeLevel === grade);
  }

  async function addSection(grade: GradeLevel, name: string): Promise<AddSectionResult> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Section name is required." };

    const exists = sections.some(
      (s) => s.gradeLevel === grade && s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return { ok: false, error: `"${trimmed}" already exists for ${grade}.` };

    try {
      const gradeId = GRADE_LEVEL_IDS[grade];
      const row = await createSection(String(gradeId), trimmed);
      setSections((prev) => [...prev, mapRow(row)]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Failed to add section." };
    }
  }
<<<<<<< Updated upstream
  //
  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
=======

  async function removeSection(id: string) {
    try {
      await deleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to remove section:", err);
    }
>>>>>>> Stashed changes
  }

  return (
    <SectionsContext.Provider
      value={{ sections, loading, getSectionsForGrade, loadSectionsForGrade, addSection, removeSection }}
    >
      {children}
    </SectionsContext.Provider>
  );
}

export function useSections() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error("useSections must be used within a SectionsProvider");
  return ctx;
}