// AttendanceOverviewContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import AttendanceService from "../service/attendance.service"; // adjust path as needed
import type { MonthlyAttendance } from "../service/attendance.service"; // adjust path as needed
import SchoolYearService from "../service/schoolYear.service"; // adjust path as needed
import type { MonthOption } from "../service/schoolYear.service"; // adjust path as needed
import type { DetailStudent } from "../../GlobalTypes/types";

interface AttendanceOverviewContextValue {
  year: string;
  month: string;
  setYear: (year: string) => void;
  setMonth: (month: string) => void;
  data: MonthlyAttendance | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  monthOptions: MonthOption[];
  monthsLoading: boolean;
  monthsError: string | null;
}

const AttendanceOverviewContext = createContext<
  AttendanceOverviewContextValue | undefined
>(undefined);

interface AttendanceOverviewProviderProps {
  student: DetailStudent;
  children: ReactNode;
}

// "YYYY-MM" galing sa kasalukuyang petsa ng device
function getCurrentMonthKey(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
}

export function AttendanceOverviewProvider({
  student,
  children,
}: AttendanceOverviewProviderProps) {
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tumatawag dito tuwing mag-mo-mount ang Provider (bawat pagpasok sa page),
  // pero dahil may in-memory cache na ang SchoolYearService, kapag pangalawang
  // beses na, agad na babalik ang result — walang network call, walang loading flicker.
  useEffect(() => {
    let isMounted = true;
    setMonthsLoading(true);
    setMonthsError(null);

    SchoolYearService.getSchoolYearMonths()
      .then((options) => {
        if (!isMounted) return;
        setMonthOptions(options);

        if (options.length) {
          const currentKey = getCurrentMonthKey();
          const defaultOption =
            options.find((m) => m.key === currentKey) ??
            options[options.length - 1];

          setYear(defaultOption.key.slice(0, 4));
          setMonth(defaultOption.key.slice(5, 7));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setMonthsError(
          err instanceof Error
            ? err.message
            : "Failed to load school year months."
        );
      })
      .finally(() => {
        if (isMounted) setMonthsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Ganito rin sa attendance data mismo — may cache na sa AttendanceService,
  // kaya kapag bumalik ka sa parehong student+month, agad na ang display.
  const fetchAttendance = useCallback(async () => {
    if (!month || !year) return;
    setLoading(true);
    setError(null);
    try {
      const result = await AttendanceService.getMonthlyAttendance(
        Number(student.id),
        parseInt(month, 10),
        parseInt(year, 10)
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attendance."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [student.id, month, year]);

  useEffect(() => {
    if (month && year) fetchAttendance();
  }, [fetchAttendance, month, year]);

  return (
    <AttendanceOverviewContext.Provider
      value={{
        year,
        month,
        setYear,
        setMonth,
        data,
        loading,
        error,
        refetch: fetchAttendance,
        monthOptions,
        monthsLoading,
        monthsError,
      }}
    >
      {children}
    </AttendanceOverviewContext.Provider>
  );
}

export function useAttendanceOverview() {
  const ctx = useContext(AttendanceOverviewContext);
  if (!ctx) {
    throw new Error(
      "useAttendanceOverview must be used within an AttendanceOverviewProvider"
    );
  }
  return ctx;
}