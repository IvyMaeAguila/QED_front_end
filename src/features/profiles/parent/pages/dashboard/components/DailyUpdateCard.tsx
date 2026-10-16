import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
// DailyUpdateCard.tsx
import { ClipboardList } from "lucide-react";
import type { DailyUpdate } from "../types/student";

interface DailyUpdateCardProps {
  updates: DailyUpdate[];
  isLoading?: boolean;
  error?: unknown;
  retry?: () => void;
  panelBg?: string;
  textPrimary?: string;
  textMuted?: string;
}

export default function DailyUpdateCard({
  updates,
  isLoading = false,
  error, retry,
  panelBg = "bg-white",
  textPrimary = "text-gray-700",
  textMuted = "text-gray-500",
}: DailyUpdateCardProps) {
  const renderUpdates = (pending: boolean) => {
    const rows: DailyUpdate[] = pending ? Array.from({ length: skeletonRows("parent-updates", undefined, 100) }, (_, index) => ({ id: String(index), studentId: "", studentName: "", time: "Reserved", message: "" })) : updates;
    return <>{rows.length === 0 ? (
        <p className={`py-2 text-xs ${textMuted}`} data-sk-region="dailyupdatecard-link-your-child-to-view-daily-updates-" data-sk-static="">
          Link your child to view daily updates.
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-sk-region="dailyupdatecard-ul-field-1">
          {rows.map((update, index) => (
            <li
              key={update.id}
              className="border-l-2 border-maroon pl-3 text-xs leading-relaxed" data-sk-region="dailyupdatecard-li-field-2"
            >
              {update.time && (
                <span className={`block font-semibold ${textMuted}`} data-sk-region="dailyupdatecard-span-field-3">
                  {pending ? <SkeletonText width="9ch" /> : update.time}
                </span>
              )}
              <span data-sk-field={`parent-update:${index}`} className={`${textPrimary} block`} data-sk-region="dailyupdatecard-span-field-4">{pending ? <SkeletonParagraph field={`parent-update:${index}`} typical={3} width="100%" /> : update.message}</span>
            </li>
          ))}
        </ul>
      )}
</>;
  };
  return (
    <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="dailyupdatecard-daily-attendance" data-sk-static=""
      >
        <ClipboardList size={14} className="text-maroon-dark" />
        Daily Attendance
      </p>

      <LoadingRegion name="daily-attendance-updates" loading={isLoading} error={error} retry={retry} variable retainPrevious hasContent={updates.length > 0} skeleton={renderUpdates(true)} onSettled={() => rememberRows("parent-updates", updates.length)}>{renderUpdates(false)}</LoadingRegion>
    </div>
  );
}
