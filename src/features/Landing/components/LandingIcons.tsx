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
};

export const CheckedIcon = ({ color = "white" }: IconProps) => (
  <BadgeCheck color={color} strokeWidth={2} />
);

export const CircleArrowRightIcon = ({ color = "white" }: IconProps) => (
  <CircleArrowRight color={color} strokeWidth={2} />
);

export const UsersIcon = ({ color = "white" }: IconProps) => (
  <Users color={color} strokeWidth={2} />
);

export const BookOpenIcon = ({ color = "white" }: IconProps) => (
  <BookMarked color={color} strokeWidth={2} />
);

export const EditIcon = ({ color = "white" }: IconProps) => (
  <SquarePen color={color} strokeWidth={2} />
);

export const DataChartsIcon = ({ color = "white" }: IconProps) => (
  <FileChartColumnIncreasing color={color} strokeWidth={2} />
);

export const StudentMonIcon = ({ color = "white" }: IconProps) => (
  <Blocks color={color} strokeWidth={2} />
);

export const KnowledgeIcon = ({ color = "white" }: IconProps) => (
  <Brain color={color} strokeWidth={2} />
);

export const AlertIcon = ({ color = "white" }: IconProps) => (
  <Siren color={color} strokeWidth={2} />
);

export const UserRoundCheckIcon = ({ color = "white" }: IconProps) => (
  <UserRoundCheck color={color} strokeWidth={2} />
);
