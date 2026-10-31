import { UserRound, GraduationCap, UserRoundCheck, CalendarDays } from "lucide-react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import type { AdminThemeContext } from "../../../../admin/pages/AdminLayout";

interface StudentInfoTableProps {
  student: {
    fullName: string;
    gradeLevel: string;
    section: string;
    adviser: string;
    schoolYear: string;
  };
  theme: AdminThemeContext;
  loading?: boolean;
}

export default function StudentInfoTable({ student, theme, loading = false }: StudentInfoTableProps) {
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;

  const fields = [
    { label: "Learner", icon: UserRound, value: student.fullName },
    { label: "Grade & Section", icon: GraduationCap, value: `${student.gradeLevel} - ${student.section}` },
    { label: "Class Adviser", icon: UserRoundCheck, value: student.adviser },
    { label: "School Year", icon: CalendarDays, value: student.schoolYear },
  ];

  return (
    <div
      className={`mb-4 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border ${panelBorder} ${panelBg} p-5 sm:flex sm:items-center sm:gap-0 sm:p-0`}
    >
      {fields.map(({ icon: Icon, ...field }, index) => (
        <div key={field.label} className="contents sm:flex sm:flex-1 sm:items-center">
          <div className="min-w-0 sm:flex-1 sm:px-5 sm:py-4">
            <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-maroon/10 text-maroon dark:bg-[#3A2424] dark:text-[#F3B5B5]">
                <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0">{field.label}</span>
            </p>
            <p className={`mt-1 break-words text-sm font-bold ${textPrimary}`}><LoadingRegion as="span" name={`parent-identity-${index}`} loading={loading && index < 3} variable skeleton={<SkeletonParagraph field={`parent-identity-${index}`} typical={2} width="100%" />}><span data-sk-field={`parent-identity-${index}`}>{field.value}</span></LoadingRegion></p>
          </div>

          {index < fields.length - 1 && (
            <div className={`hidden sm:block sm:h-10 sm:w-px ${panelBorder} sm:bg-current opacity-20`} />
          )}
        </div>
      ))}
    </div>
  );
}