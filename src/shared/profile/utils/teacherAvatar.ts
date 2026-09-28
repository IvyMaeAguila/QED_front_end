// src/shared/profile/utils/teacherAvatar.ts
import teacherWomanImg from "../components/avatars/teacher_women.jpg";
import teacherManImg from "../components/avatars/teacher_man.jpg";

export interface AvatarSource {
  avatarUrl?: string | null;
  gender?: string | null;
}

/**
 * Returns the teacher's avatar image:
 * 1. their uploaded avatarUrl, if any
 * 2. a default based on gender
 * 3. undefined -> caller should render the UserRound icon fallback
 */
export function getTeacherAvatar(teacher?: AvatarSource | null): string | undefined {
  if (!teacher) return undefined;
  if (teacher.avatarUrl) return teacher.avatarUrl;

  const gender = teacher.gender?.toLowerCase();
  if (gender === "male") return teacherManImg;
  if (gender === "female") return teacherWomanImg;
  return undefined;
}