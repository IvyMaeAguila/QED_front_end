import { CircleUserRound, KeyRound } from  'lucide-react';

type IconProps = {
  color?: string;
};

export const UserIDIcon = ({
  color = "white",
}: IconProps) => (
  <CircleUserRound color={color} strokeWidth={2} />
);

export const PasswordIcon = ({
  color = "white",
}: IconProps) => (
  <KeyRound color={color} strokeWidth={2} />
);