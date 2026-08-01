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
  const today = new Date();

  return (
    <div
      className={`rounded-2xl p-8 border flex flex-col items-center justify-center text-center h-full min-h-[220px] ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${textMuted}`}>
        Today&apos;s Date
      </p>
      <h2 className="text-[44px] font-black leading-none tracking-tight" style={{ color: "#8B0D0D" }}>
        {today.getDate()}
      </h2>
      <p className={`text-sm font-bold mt-1 ${textPrimary}`}>
        {MONTH_NAMES[today.getMonth()]}, {today.getFullYear()}
      </p>
      <div className="mt-6 flex justify-center gap-1">
        <span className="w-8 h-1 rounded-full" style={{ background: "#8B0D0D" }} />
        <span className="w-2 h-1 rounded-full" style={{ background: "#8B0D0D33" }} />
        <span className="w-2 h-1 rounded-full" style={{ background: "#8B0D0D33" }} />
      </div>
    </div>
  );
}