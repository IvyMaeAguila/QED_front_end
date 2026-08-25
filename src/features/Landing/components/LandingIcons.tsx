import {
  BadgeCheck,
  CircleArrowRight,
  Users,
  BookMarked,
  SquarePen,
  FileChartColumnIncreasing,
  Blocks,
  UserRoundCheck,
  Brain,
  Siren,
} from "lucide-react";

type IconProps = {
  color?: string;
  className?: string;
};

export const CheckedIcon = ({ color = "white", className }: IconProps) => (
  <BadgeCheck color={color} strokeWidth={2} className={className} />
);

export const CircleArrowRightIcon = ({ color = "white", className }: IconProps) => (
  <CircleArrowRight color={color} strokeWidth={2} className={className} />
);

export const UsersIcon = ({ color = "white", className }: IconProps) => (
  <Users color={color} strokeWidth={2} className={className} />
);

export const BookOpenIcon = ({ color = "white", className }: IconProps) => (
  <BookMarked color={color} strokeWidth={2} className={className} />
);

export const EditIcon = ({ color = "white", className }: IconProps) => (
  <SquarePen color={color} strokeWidth={2} className={className} />
);

export const DataChartsIcon = ({ color = "white", className }: IconProps) => (
  <FileChartColumnIncreasing color={color} strokeWidth={2} className={className} />
);

export const StudentMonIcon = ({ color = "white", className }: IconProps) => (
  <Blocks color={color} strokeWidth={2} className={className} />
);

export const KnowledgeIcon = ({ color = "white", className }: IconProps) => (
  <Brain color={color} strokeWidth={2} className={className} />
);

export const AlertIcon = ({ color = "white", className }: IconProps) => (
  <Siren color={color} strokeWidth={2} className={className} />
);

export const UserRoundCheckIcon = ({ color = "white", className }: IconProps) => (
  <UserRoundCheck color={color} strokeWidth={2} className={className} />
);