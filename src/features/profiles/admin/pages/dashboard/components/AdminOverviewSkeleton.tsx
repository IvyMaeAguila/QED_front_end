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

export function AdminEnrollmentSkeleton(theme: AdminThemeContext) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <SectionCard {...theme} compact title="Class enrollment by grade" icon={BarChart3}>
        <LoadingRegion loading label="Loading class enrollment" skeleton={<DashboardSkeletonRows count={6} />}>{null}</LoadingRegion>
      </SectionCard>
      <SectionCard {...theme} compact title="Class rosters" icon={BookOpen}>
        <LoadingRegion loading label="Loading class rosters" skeleton={<DashboardSkeletonRows count={6} />}>{null}</LoadingRegion>
      </SectionCard>
    </div>
  );
}

export function AdminOverviewSkeleton(theme: AdminThemeContext) {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard {...theme} compact title="Account overview" icon={Users}>
          <LoadingRegion loading label="Loading account overview" skeleton={<DashboardSkeletonRows count={6} paired />}>{null}</LoadingRegion>
        </SectionCard>
        <SectionCard {...theme} compact title="Class overview" icon={BookOpen}>
          <LoadingRegion loading label="Loading class overview" skeleton={<DashboardSkeletonRows count={3} paired />}>{null}</LoadingRegion>
        </SectionCard>
      </div>
      <AdminEnrollmentSkeleton {...theme} />
    </>
  );
}
