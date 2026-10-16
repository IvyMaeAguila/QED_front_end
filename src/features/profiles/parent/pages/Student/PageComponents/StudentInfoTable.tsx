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
    { label: "Learner", value: student.fullName },
    { label: "Grade & Section", value: `${student.gradeLevel} - ${student.section}` },
    { label: "Class Adviser", value: student.adviser },
    { label: "School Year", value: student.schoolYear },
  ];

  return (
    <div
      className={`mb-4 grid grid-cols-2 gap-y-4 rounded-2xl border ${panelBorder} ${panelBg} p-5 sm:flex sm:items-center sm:gap-0 sm:p-0`}
    >
      {fields.map((field, index) => (
        <div key={field.label} className="contents sm:flex sm:flex-1 sm:items-center">
          <div className="sm:flex-1 sm:px-5 sm:py-4">
            <p className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
              {field.label}
            </p>
            <p className={`mt-1 text-sm font-bold ${textPrimary}`}><LoadingRegion as="span" name={`parent-identity-${index}`} loading={loading && index < 3} variable skeleton={<SkeletonParagraph field={`parent-identity-${index}`} typical={2} width="100%" />}><span data-sk-field={`parent-identity-${index}`}>{field.value}</span></LoadingRegion></p>
          </div>

          {index < fields.length - 1 && (
            <div className={`hidden sm:block sm:h-10 sm:w-px ${panelBorder} sm:bg-current opacity-20`} />
          )}
        </div>
      ))}
    </div>
  );
}