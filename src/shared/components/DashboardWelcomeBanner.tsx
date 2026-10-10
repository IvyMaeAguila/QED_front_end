import type { ReactNode } from "react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
interface WelcomeBannerProps {
  name: string;
  loading?: boolean;
  description?: ReactNode;
}

// Helper function to get the greeting based on the hour
function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

export function DashboardWelcomeBanner({ name, loading = false, description = "Ready for another day of excellence?" }: WelcomeBannerProps) {
  const greeting = getGreeting();

  return (
    <div
      data-sk-variable=""
      className="sk-surface-brand relative flex min-h-48 flex-col justify-center overflow-hidden rounded-[12px] p-5 text-white sm:p-6"
      style={{
        background: "var(--color-maroon)",
        boxShadow: "var(--shadow-primary)",
      }}
    >
      <div className="relative">
        <span className="qed-type-badge mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 uppercase tracking-widest text-white/80" data-sk-region="welcomebanner-welcome-back" data-sk-static="">
          Welcome back
        </span>
        <h1 className="qed-type-dashboard-greeting break-words" data-type-exempt="true">
          <LoadingRegion loading={loading} variable skeleton={<><SkeletonText width="68%"/><SkeletonText width="55%"/></>}>
            {greeting}, {name}!
          </LoadingRegion>
        </h1>
        <p className="qed-type-body mt-2 max-w-xl text-white/80" data-sk-region="welcomebanner-ready-for-another-day-of-excellence-" data-sk-static="">
          {description}
        </p>
      </div>
    </div>
  );
}
