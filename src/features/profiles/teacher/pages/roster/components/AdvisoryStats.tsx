interface AdvisoryStatsProps {
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  accentColor: string;
}

export function AdvisoryStats({
  darkMode,
  textPrimary,
  textMuted,
  totalStudents,
  maleCount,
  femaleCount,
  accentColor,
}: AdvisoryStatsProps) {
  const stats = [
    { label: "Total students", value: totalStudents, color: accentColor, background: "#F8EDEE" },
    { label: "Male students", value: maleCount, color: "#1D70D6", background: "#EAF2FF" },
    { label: "Female students", value: femaleCount, color: "#C2255C", background: "#FCE7F1" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border p-5"
          style={{
            backgroundColor: darkMode ? `${stat.color}22` : stat.background,
            borderColor: `${stat.color}45`,
          }}
        >
          <p className={`text-xs font-bold ${textMuted}`}>{stat.label}</p>
          <p className={`mt-2 text-3xl font-black tabular-nums ${textPrimary}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}