import type { ReactNode } from "react";
import { BarChart3, BookOpen, Users } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import type { AdminThemeContext } from "../../AdminLayout";

export function DashboardSkeletonRows({ count, paired = false }: { count: number; paired?: boolean }) {
  return (
    <div className={paired ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
          <SkeletonText width={paired ? "70%" : "55%"} />
          <SkeletonText width="3ch" />
        </div>
      ))}
    </div>
  );
}

export function AdminOverviewColumns({ account, classes, enrollment, rosters }: {
  account: ReactNode;
  classes: ReactNode;
  enrollment: ReactNode;
  rosters?: ReactNode;
}) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="grid min-w-0 gap-4">{account}{enrollment}</div>
      <div className="grid min-w-0 gap-4">{classes}{rosters}</div>
    </div>
  );
}

function SkeletonPanel({ theme, title, icon, count, paired }: {
  theme: AdminThemeContext;
  title: string;
  icon: typeof Users;
  count: number;
  paired?: boolean;
}) {
  return (
    <SectionCard {...theme} compact title={title} icon={icon}>
      <LoadingRegion loading label={`Loading ${title.toLowerCase()}`} skeleton={<DashboardSkeletonRows count={count} paired={paired} />}>{null}</LoadingRegion>
    </SectionCard>
  );
}

export function EnrollmentSkeleton({ theme, roster = false }: { theme: AdminThemeContext; roster?: boolean }) {
  return roster
    ? <SkeletonPanel theme={theme} title="Class rosters" icon={BookOpen} count={6} />
    : <SkeletonPanel theme={theme} title="Class enrollment by grade" icon={BarChart3} count={4} />;
}

export function AdminOverviewSkeleton(theme: AdminThemeContext) {
  return (
    <AdminOverviewColumns
      account={<SkeletonPanel theme={theme} title="Account overview" icon={Users} count={6} paired />}
      classes={<SkeletonPanel theme={theme} title="Class overview" icon={BookOpen} count={6} paired />}
      enrollment={<EnrollmentSkeleton theme={theme} />}
      rosters={<EnrollmentSkeleton theme={theme} roster />}
    />
  );
}