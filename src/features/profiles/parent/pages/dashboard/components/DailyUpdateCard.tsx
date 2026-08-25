import { ClipboardList } from "lucide-react";
import type { DailyUpdate } from "../types/student";

interface DailyUpdateCardProps {
  updates: DailyUpdate[];
  panelBg?: string;
  textPrimary?: string;
  textMuted?: string;
}

export default function DailyUpdateCard({
  updates,
  panelBg = "bg-white",
  textPrimary = "text-gray-700",
  textMuted = "text-gray-500",
}: DailyUpdateCardProps) {
  return (
    <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`}
      >
        <ClipboardList size={14} className="text-maroon-dark" />
        Daily Update
      </p>

      {updates.length === 0 ? (
        <p className={`py-2 text-xs ${textMuted}`}>
          Link your child to view daily updates.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {updates.map((update) => (
            <li
              key={update.id}
              className="border-l-2 border-maroon pl-3 text-xs leading-relaxed"
            >
              <span className={`block font-semibold ${textMuted}`}>
                {update.time}
              </span>
              <span className={textPrimary}>{update.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
