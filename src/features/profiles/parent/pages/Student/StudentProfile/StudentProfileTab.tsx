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
  const { profile, isLoading, error, saveProfile } = useStudentProfile();

  if (!profile) {
    if (isLoading) {
      return (
        <div className={`rounded-2xl border p-6 text-sm font-medium ${panelBorder} ${darkMode ? "text-white/60" : "text-slate-500"}`}>
          Loading student profile...
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            darkMode ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      <ProfileHeaderCard
        student={profile}
        personalInformation={profile.personalInformation}
        darkMode={darkMode}
        panelBorder={panelBorder}
        onSave={(updates) => saveProfile(updates)}
      />
    </div>
  );
}