import { useTodayParts } from "../../../hooks/useToday";

interface TodayDateCardProps {
  panelBg?: string;
  panelBorder?: string;
  textPrimary?: string;
  textMuted?: string;
}

export default function TodayDateCard({
  panelBg = "bg-white",
  panelBorder = "border-border-subtle",
  textPrimary = "text-gray-900",
  textMuted = "text-gray-400",
}: TodayDateCardProps) {
  const { day, month, year } = useTodayParts();

  return (
    <div
      className={`flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border p-6 text-center ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${textMuted}`}>
        Today&apos;s Date
      </p>
      <h2 className="text-[44px] font-black leading-none tracking-tight" style={{ color: "var(--brand-ink)" }}>
        {day}
      </h2>
      <p className={`mt-1 text-sm font-bold ${textPrimary}`}>
        {month}, {year}
      </p>
      <div className="mt-4 flex justify-center gap-1">
        <span className="h-1 w-8 rounded-full" style={{ background: "var(--color-maroon)" }} />
        <span className="h-1 w-2 rounded-full" style={{ background: "color-mix(in srgb, var(--color-maroon) 20%, transparent)" }} />
        <span className="h-1 w-2 rounded-full" style={{ background: "color-mix(in srgb, var(--color-maroon) 20%, transparent)" }} />
      </div>
    </div>
  );
}
