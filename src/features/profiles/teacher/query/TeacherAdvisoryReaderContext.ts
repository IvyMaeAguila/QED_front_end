import { createContext } from "react";
import type { AdvisorySection } from "../pages/attendance/services/attendance.service";
import type { TeacherReader } from "./TeacherReader";
// Lightweight context for eager compositions; Query stays in lazy controllers.
export const TeacherAdvisoryReaderContext = createContext<TeacherReader<AdvisorySection[]> | null>(null);
