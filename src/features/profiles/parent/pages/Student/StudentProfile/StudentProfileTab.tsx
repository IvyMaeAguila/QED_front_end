// StudentProfileTab.tsx
// Location: Student/StudentProfile/StudentProfileTab.tsx (sibling of Overview/, Academic/, PageComponents/, ProgressReport/, GlobalTypes/)
import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { PersonalInformationCard } from "./components/PersonalInformationCard";
import { ExtracurricularActivitiesCard } from "./components/ExtraCurricularActivitiesCard";
import { mapDetailStudentToProfile } from "./utils/MapDetailStudentToProfile";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../GlobalTypes/types";

interface StudentProfileTabProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

// Usage inside StudentDetailPage.tsx, where `activeTab` comes from TabNav:
//
//   {activeTab === "studentProfile" && (
//     <StudentProfileTab student={student} theme={theme} />
//   )}
//
// Internally maps `DetailStudent` -> `StudentProfileData` via
// utils/mapDetailStudentToProfile.ts. Fields not yet present on
// DetailStudent (e.g. date of birth, address, extracurriculars) fall
// back to "Not specified" / empty list until wired to real data —
// see the TODOs in that file.

export function StudentProfileTab({ student, theme }: StudentProfileTabProps) {
  const { darkMode, panelBorder } = theme;
  const profile = mapDetailStudentToProfile(student);

  return (
    <div className="flex flex-col gap-5">
      <ProfileHeaderCard student={profile} darkMode={darkMode} panelBorder={panelBorder} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PersonalInformationCard info={profile.personalInformation} theme={theme} />
        </div>
        <div className="lg:col-span-1">
          <ExtracurricularActivitiesCard
            activities={profile.extracurricularActivities}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}