

export function DashboardSkeleton({ textMuted, darkMode }: { textMuted: string; darkMode: boolean }) {
  const skeletonSurface = darkMode ? "bg-white/5" : "bg-black/5";
  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className={`h-40 rounded-2xl animate-pulse ${skeletonSurface}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-36 rounded-2xl animate-pulse ${skeletonSurface}`} />
        ))}
      </div>
      <p className={`text-xs ${textMuted}`}>Loading dashboard…</p>
    </div>
  );
}

export function DashboardError({ error, textMuted }: { error: Error; textMuted: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-sm font-bold">Couldn't load the dashboard</p>
      <p className={`text-xs ${textMuted}`}>{error.message}</p>
    </div>
  );
}
