import { AlertTriangle } from "lucide-react";

export function DashboardSkeleton({ textMuted }: { textMuted: string }) {
  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="h-40 rounded-2xl animate-pulse bg-black/5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl animate-pulse bg-black/5" />
        ))}
      </div>
      <p className={`text-xs ${textMuted}`}>Loading dashboard…</p>
    </div>
  );
}

export function DashboardError({ error, textMuted }: { error: Error; textMuted: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <AlertTriangle className="h-8 w-8" style={{ color: "var(--color-red)" }} />
      <p className="text-sm font-bold">Couldn't load the dashboard</p>
      <p className={`text-xs ${textMuted}`}>{error.message}</p>
    </div>
  );
}
