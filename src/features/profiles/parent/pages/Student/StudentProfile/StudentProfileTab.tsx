import { LoadingRegion } from "@shared/loading/LoadingRegion";
// StudentProfileTab.tsx
// Location: Student/StudentProfile/StudentProfileTab.tsx

import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { mapDetailStudentToProfile } from "./utils/MapDetailStudentToProfile";
import { StudentProfileProvider, useStudentProfile } from "./context/StudentProfileContext";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";
import type { DetailStudent } from "../GlobalTypes/types";

interface StudentProfileTabProps {
  student: DetailStudent;
  theme: AdminThemeContext;
}

// `student` (DetailStudent) only seeds the initial render via
// mapDetailStudentToProfile — StudentProfileProvider then fetches the live
// StudentProfileData from the backend (GET /api/students/:id) and owns all
// profile state (loading/saving/error) for everything under this tab.
//
// The standalone PersonalInformationCard was removed: personal information
// (including editing date of birth / residential address) now lives in
// ProfileHeaderCard.

export function StudentProfileTab({ student, theme }: StudentProfileTabProps) {
  const initialProfile = mapDetailStudentToProfile(student);

  return (
    <StudentProfileProvider studentId={initialProfile.id} initialProfile={initialProfile}>
      <StudentProfileTabContent theme={theme} />
    </StudentProfileProvider>
  );
}

function StudentProfileTabContent({ theme }: { theme: AdminThemeContext }) {
  const { darkMode, panelBorder } = theme;
  const { profile, isLoading, error, refetch, saveProfile } = useStudentProfile();

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-5">
      <LoadingRegion name="parent-student-profile" loading={isLoading} error={error} retry={refetch} variable skeleton={null} frame={(pending) => (
      <ProfileHeaderCard
        loading={pending}
        student={profile}
        personalInformation={profile.personalInformation}
        darkMode={darkMode}
        panelBorder={panelBorder}
        onSave={(updates) => saveProfile(updates)}
      />
      )}>{null}</LoadingRegion>
    </div>
  );
}