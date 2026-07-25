import { createContext, useContext, useState, type ReactNode } from "react";
import { type Section } from "../types";
import type { GradeLevel } from "../types";

type AddSectionResult = { ok: true } | { ok: false; error: string };

interface SectionsContextValue {
  sections: Section[];
  getSectionsForGrade: (grade: GradeLevel) => Section[];
  addSection: (grade: GradeLevel, name: string) => AddSectionResult;
  removeSection: (id: string) => void;
}

const SectionsContext = createContext<SectionsContextValue | undefined>(undefined);

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Section[]>([]);

  function getSectionsForGrade(grade: GradeLevel) {
    return sections.filter((s) => s.gradeLevel === grade);
  }

  function addSection(grade: GradeLevel, name: string): AddSectionResult {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Section name is required." };
    const exists = sections.some(
      (s) => s.gradeLevel === grade && s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return { ok: false, error: `"${trimmed}" already exists for ${grade}.` };

    const id = `${grade}-${trimmed}`.replace(/\s+/g, "-").toLowerCase();
    setSections((prev) => [...prev, { id, gradeLevel: grade, name: trimmed }]);
    return { ok: true };
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <SectionsContext.Provider value={{ sections, getSectionsForGrade, addSection, removeSection }}>
      {children}
    </SectionsContext.Provider>
  );
}

export function useSections() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error("useSections must be used within a SectionsProvider");
  return ctx;
}