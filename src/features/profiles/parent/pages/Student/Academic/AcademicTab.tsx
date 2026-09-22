import MissedActivities from "./components/MissedActivities";
import InterventionSupport from "./components/InterventionSupport";
import ClassSchedule from "../Academic/components/ClassSchedule";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../Student/GlobalTypes/types";

interface AcademicTabProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

export default function AcademicTab({ student, theme }: AcademicTabProps) {
  const { textPrimary } = theme;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <h1 className={`text-lg font-bold lg:hidden ${textPrimary}`}>
        Academic Support
      </h1>
      <div className="flex flex-1 flex-col gap-4">
        <MissedActivities theme={theme} student={student} />
        <InterventionSupport theme={theme} student={student} />
      </div>
      <div className="w-full lg:w-125 lg:shrink-0">
        <ClassSchedule theme={theme} student={student} />
      </div>
    </div>
  );
}