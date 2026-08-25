import { ArrowLeft } from "lucide-react";

interface AdvisorySkeletonProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

export function AdvisorySkeleton({ darkMode, panelBorder, textMuted }: AdvisorySkeletonProps) {
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBorder}`;
  const shimmer = `relative overflow-hidden rounded-lg ${darkMode ? "bg-white/[0.06]" : "bg-black/[0.06]"}`;
  
  const shimmerSweep = (
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
      style={{
        background: darkMode
          ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
      }}
    />
  );

  const Bone = ({ className = "" }: { className?: string }) => (
    <div className={`${shimmer} ${className}`}>{shimmerSweep}</div>
  );

  return (
    <div className="space-y-6 pb-12">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <button disabled aria-hidden="true" className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-0 bg-transparent outline-none ${textMuted} opacity-40 cursor-default`}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <Bone className="h-3 w-28" />
            <Bone className="h-8 w-48 mt-3" />
            <Bone className="h-4 w-40 mt-3" />
          </div>
        </div>
        <Bone className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`rounded-2xl border p-5 ${panelBorder}`}>
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-14 mt-3" />
          </div>
        ))}
      </div>

      {/* Table card skeleton */}
      <div className={cardClasses}>
        <div className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${panelBorder}`}>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 rounded-xl" />
            <div>
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-24 mt-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 w-56 rounded-xl" />
            <Bone className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex items-center gap-3 px-5 py-4 ${i !== 0 ? `border-t ${darkMode ? "border-white/5" : "border-black/5"}` : ""}`}>
              <Bone className="h-3.5 w-4 shrink-0" />
              <Bone className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3.5 w-48" />
                <Bone className="h-3 w-32" />
              </div>
              <Bone className="h-3.5 w-24 shrink-0" />
              <Bone className="h-6 w-20 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}