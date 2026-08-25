// components/StudentAvatar.tsx

interface StudentAvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

export function StudentAvatar({ firstName, lastName, size = 56 }: StudentAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-[#8B1E1E] shadow-md"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}