import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Section, GRADE_LEVEL_IDS, GRADE_LEVEL_BY_ID } from "../types/types";
import type { GradeLevel } from "../types/types";
import {
  fetchSectionsByGrade,
  createSection,
  updateSection,
  deleteSection,
  fetchSectionIdsUsedByClasses,
  type SectionRow,
} from "../services/section.service";

type AddSectionResult = { ok: true } | { ok: false; error: string };

interface SectionsContextValue {
  sections: Section[];
  loading: boolean;
  sectionIdsUsedByClasses: Set<string>;
  getSectionsForGrade: (grade: GradeLevel) => Section[];
  loadSectionsForGrade: (grade: GradeLevel) => Promise<void>;
  loadSectionIdsUsedByClasses: () => Promise<void>;
  addSection: (grade: GradeLevel, name: string) => Promise<AddSectionResult>;
  editSection: (id: string, name: string) => Promise<AddSectionResult>;
  removeSection: (id: string) => Promise<AddSectionResult>;
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
  const [, setLoadedGrades] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sectionIdsUsedByClasses, setSectionIdsUsedByClasses] = useState<Set<string>>(new Set());

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

  const loadSectionIdsUsedByClasses = useCallback(async () => {
    try {
      const ids = await fetchSectionIdsUsedByClasses();
      setSectionIdsUsedByClasses(new Set(ids.map(String)));
    } catch (err) {
      console.error("Failed to load section ids used by classes:", err);
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

  async function editSection(id: string, name: string): Promise<AddSectionResult> {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Section name is required." };

    const current = sections.find((s) => s.id === id);
    if (!current) return { ok: false, error: "Section not found." };

    const exists = sections.some(
      (s) => s.id !== id && s.gradeLevel === current.gradeLevel && s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return { ok: false, error: `"${trimmed}" already exists for ${current.gradeLevel}.` };

    try {
      const row = await updateSection(id, trimmed);
      const updated = mapRow(row);
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Failed to update section." };
    }
  }

  // Bumalik na ngayon ng AddSectionResult imbes na void, para makita ng
  // caller (ManageSectionsModal) kung ba't nabigo ang pag-delete — halimbawa
  // kapag naka-assign na pala ang section sa isang class sa backend,
  // 409 ang ibabalik nito kasama ang malinaw na message.
  async function removeSection(id: string): Promise<AddSectionResult> {
    try {
      await deleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove section.";
      console.error("Failed to remove section:", message);
      return { ok: false, error: message };
    }
  }

  return (
    <SectionsContext.Provider
      value={{
        sections,
        loading,
        sectionIdsUsedByClasses,
        getSectionsForGrade,
        loadSectionsForGrade,
        loadSectionIdsUsedByClasses,
        addSection,
        editSection,
        removeSection,
      }}
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