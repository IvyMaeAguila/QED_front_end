import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SchoolClass } from "../types/Class";
import { seedClasses, getNextClassId } from "../data/classData";

interface ClassesContextValue {
  classes: SchoolClass[];
  getClass: (id: string) => SchoolClass | undefined;
  addClass: (schoolClass: Omit<SchoolClass, "id">) => SchoolClass;
  updateClass: (id: string, updates: Omit<SchoolClass, "id">) => void;
  deleteClass: (id: string) => void;
}

const ClassesContext = createContext<ClassesContextValue | undefined>(undefined);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<SchoolClass[]>(seedClasses);

  const value = useMemo<ClassesContextValue>(
    () => ({
      classes,
      getClass: (id) => classes.find((c) => c.id === id),
      addClass: (schoolClass) => {
        const created: SchoolClass = { ...schoolClass, id: getNextClassId(classes) };
        setClasses((prev) => [...prev, created]);
        return created;
      },
      updateClass: (id, updates) => {
        setClasses((prev) => prev.map((c) => (c.id === id ? { ...updates, id } : c)));
      },
      deleteClass: (id) => {
        setClasses((prev) => prev.filter((c) => c.id !== id));
      },
    }),
    [classes]
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within a ClassesProvider");
  return ctx;
}