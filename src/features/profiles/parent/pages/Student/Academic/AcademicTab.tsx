import MissedActivities from "./components/MissedActivities";
import InterventionSupport from "./components/InterventionSupport";
import ClassSchedule from "./components/ClassSchedule";
import type {
  MissedActivity,
  InterventionFlag,
  ScheduleItem,
} from "./types/types";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../../Student/GlobalTypes/types";

interface AcademicTabProps {
  missedActivities: MissedActivity[];
  interventionFlags: InterventionFlag[];
  student: DetailStudent;
  schedule: ScheduleItem[];
  theme: AdminThemeContext;
}

export default function AcademicTab({
  missedActivities,
  interventionFlags,
  schedule,
  student,
  theme,
}: AcademicTabProps) {
  const { textPrimary } = theme;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <h1 className={`text-lg font-bold sm:hidden ${textPrimary}`}>
        Academic Support
      </h1>
      <div className="flex flex-1 flex-col gap-4">
        <MissedActivities activities={missedActivities} theme={theme} student={student}/>
        <InterventionSupport flags={interventionFlags} theme={theme} student={student} />
      </div>
      <div className="w-full sm:max-w-xs">
        <ClassSchedule items={schedule} theme={theme} student={student}/>
      </div>
    </div>
  );
}
