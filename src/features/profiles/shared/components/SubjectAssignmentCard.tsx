import type { ReactNode } from "react";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface SubjectAssignmentCardProps {
  loading?: boolean;
  schoolYearLoading?: boolean;
  statusLoading?: boolean;
  schoolYear: ReactNode;
  status: string;
  title: string;
  subtitle?: string;
  detail?: string;
  studentCount?: number;
  showStudentCount?: boolean;
  actions: ReactNode;
  faded?: boolean;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

/** Shared maroon header and inset information panel used by subject cards. */
export function SubjectAssignmentCard({
  loading = false,
  schoolYearLoading = loading,
  statusLoading = loading,
  schoolYear,
  status,
  title,
  subtitle,
  detail,
  studentCount = 0,
  showStudentCount = true,
  actions,
  faded = false,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: SubjectAssignmentCardProps) {
  const normalizedStatus = status.toLowerCase();
  const isPending = normalizedStatus === "pending";
  const statusColor = isPending ? "#6B7280" : ["active", "submitted"].includes(normalizedStatus) ? "var(--semantic-success)" : "#6B7280";
  const surface = darkMode ? panelBg : "bg-white";
  const maroon = isPending ? (darkMode ? "#4B5563" : "#9CA3AF") : darkMode ? "var(--color-maroon)" : "var(--color-maroon)";
  const cardBg = darkMode ? "var(--surface-card-dark)" : "#ffffff";

  return (
    <article
      className={`relative flex h-[218px] flex-col overflow-hidden rounded-2xl border shadow-sm ${surface} ${panelBorder} ${faded ? "opacity-80" : ""}`}
      style={{ backgroundColor: cardBg }}
    >
      {/* Match the grade-level cards: a short maroon banner behind a rounded white body. */}
      <div className="h-[72px] shrink-0" style={{ backgroundColor: maroon }} aria-hidden="true" />

      <div
        className="relative -mt-4 flex min-h-0 flex-1 flex-col rounded-t-2xl p-4"
        style={{ backgroundColor: cardBg }}
      >
        {/* Maroon pocket and radial transition reproduce the reference card's lower-right curve. */}
        <div
          className="absolute right-0 top-0 h-10 w-16 rounded-bl-2xl"
          style={{ backgroundColor: maroon }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 h-4 w-4"
          style={{
            right: "4rem",
            background: `radial-gradient(circle at 0 100%, transparent 1rem, ${maroon} 1rem)`,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10" data-sk-region="subjectassignmentcard-div-field-1">
        <div className={`qed-type-metadata flex items-center gap-1.5 ${textMuted}`}>
          <span data-sk-region="subjectassignmentcard-span-field-2">{schoolYearLoading ? <SkeletonText width="9ch" /> : schoolYear}</span>
          <span aria-hidden="true">·</span>
          <span className="qed-type-badge" style={{ color: statusColor }} data-sk-region="subjectassignmentcard-span-field-3">{statusLoading ? <SkeletonText width="6ch" /> : status}</span>
        </div>
        <h3 className={`qed-type-card-title mt-1 truncate pr-14 leading-snug ${textPrimary}`} title={title} data-sk-region="subjectassignmentcard-h3-field-4">{loading ? <SkeletonText width="68%"/> : title}</h3>
        {subtitle && <p className={`qed-type-metadata mt-0.5 truncate pr-14 ${textMuted}`} title={subtitle} data-sk-region="subjectassignmentcard-p-field-5">{loading ? <SkeletonText width="55%"/> : subtitle}</p>}
        {detail && <p className={`qed-type-metadata mt-0.5 truncate pr-14 ${textMuted}`} title={detail} data-sk-region="subjectassignmentcard-p-field-6">{loading ? <SkeletonText width="42%"/> : detail}</p>}
        </div>

        <div className={`mt-auto mb-3 border-t ${darkMode ? "border-white/10" : "border-gray-200"}`} aria-hidden="true" />
        <div className="flex items-center gap-2" data-sk-region="subjectassignmentcard-div-field-7">
        {showStudentCount && (
            <span className={`qed-type-badge shrink-0 rounded-full px-2.5 py-1 ${isPending ? "bg-gray-100 text-gray-600" : darkMode ? "bg-white/10 text-white/80" : "bg-brand-soft text-brand-ink"}`} data-sk-region="subjectassignmentcard-span-field-8">
            {loading ? <SkeletonText width="3ch"/> : <>{studentCount} student{studentCount === 1 ? "" : "s"}</>}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {actions}
        </div>
        </div>
      </div>
    </article>
  );
}
