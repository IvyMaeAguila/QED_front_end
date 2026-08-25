// components/ProfileHeaderCard.tsx
import { CheckCircle2 } from "lucide-react";
import { StudentAvatar } from "./StudentAvatar";
import { Badge } from "./Badge";
import type { StudentProfileData } from "../types/types";

interface ProfileHeaderCardProps {
  student: StudentProfileData;
  darkMode: boolean;
  panelBorder: string;
}

const AVATAR_SIZE = 56;

export function ProfileHeaderCard({ student, darkMode, panelBorder }: ProfileHeaderCardProps) {
  const fullDisplayName = `${student.lastName}, ${student.firstName}${
    student.middleInitial ? ` ${student.middleInitial}` : ""
  }`;

  const idLine = `LRN: ${student.lrn ?? "Not specified"} \u2022 ID: ${student.studentId ?? "Not specified"}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${panelBorder} ${
        darkMode ? "bg-[#111827]" : "bg-white"
      }`}
    >
      {/* Maroon gradient banner */}
      <div
        className="h-20 w-full"
        style={{
          background: darkMode
            ? "linear-gradient(90deg, #4A0000 0%, #7A1212 100%)"
            : "linear-gradient(90deg, #6B0000 0%, #9C1414 100%)",
        }}
      />

      {/* Avatar overlaps the banner/white boundary — positioned independently
          so only the avatar (not the name text) sits over the maroon area */}
      <div className="absolute left-6 top-[52px]">
        <StudentAvatar firstName={student.firstName} lastName={student.lastName} size={AVATAR_SIZE} />
      </div>

      {/* Info row — fully inside the white area, name never touches the banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 pt-3">
        <div className="pl-[72px]">
          <h2 className={`text-lg font-bold leading-tight ${darkMode ? "text-white" : "text-[#111827]"}`}>
            {fullDisplayName}
          </h2>
          <p className={`text-xs font-medium ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
            {idLine}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="neutral" darkMode={darkMode}>
            {student.gradeLevel} &bull; Section {student.section}
          </Badge>

          {/* Gender/Status show a placeholder until DetailStudent exposes
              real values — see utils/mapDetailStudentToProfile.ts TODOs */}
          <Badge variant="neutral" darkMode={darkMode}>
            {student.gender ?? "N/A"}
          </Badge>
          <Badge variant="success" darkMode={darkMode} icon={<CheckCircle2 size={12} />}>
            {student.status ?? "Active"}
          </Badge>
        </div>
      </div>
    </div>
  );
}