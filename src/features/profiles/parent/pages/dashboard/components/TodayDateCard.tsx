import { useTodayParts } from '../../../hooks/useToday';

interface TodayDateCardProps {
  panelBg?: string;
  textMuted?: string;
}

export default function TodayDateCard({
  panelBg = "bg-white",
  textMuted = "text-gray-400",
}: TodayDateCardProps) {
  const { day, month, year } = useTodayParts();

  return (
    <div className={`hidden rounded-xl2 p-5 text-center shadow-card sm:block ${panelBg}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>
        Today's Date
      </p>
      <p className="mt-1 text-4xl font-extrabold text-maroon-dark">{day}</p>
      <p className={`text-sm font-medium ${textMuted}`}>
        {month} {year}
      </p>
    </div>
  );
}