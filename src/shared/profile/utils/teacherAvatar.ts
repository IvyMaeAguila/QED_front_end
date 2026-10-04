import femaleBraid from "../components/avatars/teacher-illustrations/female-braid.png";
import femaleBrownHair from "../components/avatars/teacher-illustrations/female-brown-hair.png";
import femalePinkHair from "../components/avatars/teacher-illustrations/female-pink-hair.png";
import maleBeard from "../components/avatars/teacher-illustrations/male-beard.png";
import maleTie from "../components/avatars/teacher-illustrations/male-tie.png";
import maleWhiteShirt from "../components/avatars/teacher-illustrations/male-white-shirt.png";

export const TEACHER_AVATARS = [
  { key: "female-braid", label: "Blonde braid", gender: "female", src: femaleBraid },
  { key: "male-tie", label: "Teacher in a tie", gender: "male", src: maleTie },
  { key: "male-white-shirt", label: "Teacher in a white shirt", gender: "male", src: maleWhiteShirt },
  { key: "female-pink-hair", label: "Pink hair", gender: "female", src: femalePinkHair },
  { key: "male-beard", label: "Bearded teacher", gender: "male", src: maleBeard },
  { key: "female-brown-hair", label: "Brown hair", gender: "female", src: femaleBrownHair },
] as const;

export type TeacherAvatarKey = (typeof TEACHER_AVATARS)[number]["key"];

export interface AvatarSource {
  avatarUrl?: string | null;
  avatarKey?: string | null;
  gender?: string | null;
}

export function getDefaultTeacherAvatarKey(gender?: string | null): TeacherAvatarKey | undefined {
  const normalized = gender?.trim().toLocaleLowerCase();
  if (normalized === "male") return "male-tie";
  if (normalized === "female") return "female-braid";
  return undefined;
}

export function getTeacherAvatarAccent(gender?: string | null): string | undefined {
  const normalized = gender?.trim().toLocaleLowerCase();
  if (normalized === "male") return "#B8DDF0";
  if (normalized === "female") return "#D9343E";
  return undefined;
}

export function getTeacherAvatarBorderColor(gender?: string | null): string {
  return getTeacherAvatarAccent(gender) ?? "#D1D5DB";
}

/** Prefer the teacher's saved selection, then fall back to their gender default. */
export function getTeacherAvatar(teacher?: AvatarSource | null): string | undefined {
  if (!teacher) return undefined;
  if (teacher.avatarUrl) return teacher.avatarUrl;

  const selected = TEACHER_AVATARS.find((avatar) => avatar.key === teacher.avatarKey);
  if (selected) return selected.src;

  const defaultKey = getDefaultTeacherAvatarKey(teacher.gender);
  return TEACHER_AVATARS.find((avatar) => avatar.key === defaultKey)?.src;
}
