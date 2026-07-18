interface MiniBarProps {
  value: number;
  color: string;
  dark: boolean;
}

export function MiniBar({ value, color, dark }: MiniBarProps) {
  return (
    <div className="flex items-center gap-2 min-w-23">
      <div className="h-1.5 w-16 rounded-full bg-[#E5E7EB] overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${dark ? "text-white" : "text-[#111827]"}`}>
        {value}%
      </span>
    </div>
  );
}