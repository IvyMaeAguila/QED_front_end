import { UserRound } from "lucide-react";
import boyAvatar from "../profile/components/avatars/student_boy.jpg";
import girlAvatar from "../profile/components/avatars/student_girl.jpg";

export type StudentGender = "M" | "F" | "Male" | "Female" | string | null | undefined;

function normalizeGender(gender: StudentGender): "male" | "female" | null {
  const value = String(gender ?? "").trim().toLowerCase();
  if (value === "m" || value === "male") return "male";
  if (value === "f" || value === "female") return "female";
  return null;
}

interface StudentAvatarProps {
  gender: StudentGender;
  name: string;
  className?: string;
}

export function StudentAvatar({ gender, name, className = "h-7 w-7" }: StudentAvatarProps) {
  const normalized = normalizeGender(gender);
  const base = `${className} shrink-0 overflow-hidden rounded-full object-cover`;

  if (!normalized) {
    return (
      <span
        className={`${className} shrink-0 rounded-full bg-slate-100 text-slate-500 inline-flex items-center justify-center`}
        aria-label={`Profile image unavailable for ${name}`}
        title="Gender not recorded"
      >
        <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={normalized === "male" ? boyAvatar : girlAvatar}
      alt={`${normalized === "male" ? "Boy" : "Girl"} profile for ${name}`}
      className={base}
      loading="lazy"
    />
  );
}
