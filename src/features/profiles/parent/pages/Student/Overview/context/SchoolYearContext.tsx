// SchoolYearContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import SchoolYearService from "../service/schoolYear.service"; // adjust path as needed
import type { MonthOption } from "../service/schoolYear.service"; // adjust path as needed

interface SchoolYearContextValue {
  monthOptions: MonthOption[];
  monthsLoading: boolean;
  monthsError: string | null;
}

const SchoolYearContext = createContext<SchoolYearContextValue | undefined>(
  undefined
);

export function SchoolYearProvider({ children }: { children: ReactNode }) {
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setMonthsLoading(true);
    setMonthsError(null);

    SchoolYearService.getSchoolYearMonths()
      .then((options) => {
        if (isMounted) setMonthOptions(options);
      })
      .catch((err) => {
        if (isMounted) {
          setMonthsError(
            err instanceof Error ? err.message : "Failed to load months."
          );
        }
      })
      .finally(() => {
        if (isMounted) setMonthsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []); // once lang tatakbo tuwing mag-mo-mount ang Provider na ito

  return (
    <SchoolYearContext.Provider
      value={{ monthOptions, monthsLoading, monthsError }}
    >
      {children}
    </SchoolYearContext.Provider>
  );
}

export function useSchoolYear() {
  const ctx = useContext(SchoolYearContext);
  if (!ctx) {
    throw new Error("useSchoolYear must be used within SchoolYearProvider");
  }
  return ctx;
}