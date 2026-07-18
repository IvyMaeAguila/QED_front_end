import { stats } from "../data/Dashboarddata";

interface StatCardsProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
}

export function StatCards({ panelBg, panelBorder, textPrimary }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(({ label, value, Icon }) => (
        <div
          key={label}
          className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${panelBg} ${panelBorder}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold" style={{ color: "#8B0D0D" }}>
              {label}
            </p>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#6B0000" }}
            >
              <Icon size={20} className="text-white" />
            </div>
          </div>
          <p className={`mt-2 text-5xl font-extrabold leading-none tracking-tight tabular-nums ${textPrimary}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}