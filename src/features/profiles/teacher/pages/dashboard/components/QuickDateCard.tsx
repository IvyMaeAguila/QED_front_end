interface QuickDateCardProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function QuickDateCard({ panelBg, panelBorder, textPrimary, textMuted }: QuickDateCardProps) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", day: "numeric", month: "numeric", year: "numeric" }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);

  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-[12px] border px-4 py-8 text-center ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${textMuted}`}>
        Today&apos;s Date
      </p>
      <h2 className="text-[40px] font-black leading-none tracking-tight text-maroon sm:text-[44px] dark:text-brand-light">
        {part("day")}
      </h2>
      <p className={`text-sm font-bold mt-1 ${textPrimary}`}>
        {MONTH_NAMES[part("month") - 1]}, {part("year")}
      </p>
      <div className="mt-6 flex justify-center gap-1">
        <span className="w-8 h-1 rounded-full bg-maroon dark:bg-brand-light" />
        <span className="w-2 h-1 rounded-full bg-maroon/20 dark:bg-brand-light/20" />
        <span className="w-2 h-1 rounded-full bg-maroon/20 dark:bg-brand-light/20" />
      </div>
    </div>
  );
}
