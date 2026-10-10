import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Student } from "../../dashboard/types/student";

import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { SkeletonText } from "@shared/components/SkeletonLoading";

interface EnrolledChildrenListProps {
  loading?: boolean; error?: unknown; retry?: () => void;
  students: Student[];
  darkMode: boolean;
}

const MAROON = "var(--color-maroon)";

export function EnrolledChildrenList({
  loading = false, error, retry,
  students,
  darkMode,
}: EnrolledChildrenListProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-500";
  const dividerColor = darkMode ? "border-white/10" : "border-black/5";

  const rowSurface = darkMode
    ? "bg-[#1f2937] ring-1 ring-white/10 hover:bg-[#263344]"
    : "bg-gray-50 ring-1 ring-black/5 hover:bg-white hover:shadow-md";

  const pillClass = darkMode ? "bg-white/10 text-gray-300" : "font-semibold";
  const pillStyle = darkMode
    ? undefined
    : { backgroundColor: "color-mix(in srgb, var(--brand-primary) 8%, transparent)", color: "var(--brand-ink)" };

  const handleView = (student: Student) => {
    const rolePrefix = location.pathname.split("/")[1];
    navigate(`/${rolePrefix}/students/${student.id}`);
  };

  const view = "parent/enrolled-children";
  function renderStudents(pending: boolean) {
    const items: Student[] = pending ? Array.from({length:skeletonRows(view)}, (_, index) => ({id:String(index),studentNumber:"",firstName:"",lastName:"",gradeLevel:"",section:"",adviser:""})) : students;
    return (<>      {items.length === 0 ? (
        <p
          className={`px-4 py-10 text-center text-xs font-medium sm:text-sm ${mutedColor}`} data-sk-region="enrolledchildrenlists-no-linked-students-yet-use-the-form-to-connec" data-sk-static=""
        >
          No linked students yet. Use the form to connect your child.
        </p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto px-4 py-4 sm:px-5" data-sk-region="enrolledchildrenlists-div-field-1">
          {items.map((student) => (
            <button
              key={student.id}
              onClick={() => handleView(student)}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg py-2.5 pl-5 pr-3 text-left transition-[opacity,transform] ${rowSurface}`}
            >
              {/* Maroon accent bar */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: MAROON }}
              />

              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: MAROON }} data-sk-region="enrolledchildrenlists-div-field-2"
              >
                {pending ? <SkeletonText className="sk-surface-brand" width="1ch" /> : student.firstName.charAt(0)}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold ${titleColor}`} data-sk-region="enrolledchildrenlists-p-field-3">
                  {pending ? <SkeletonText width="68%" /> : student.fullName}
                </p>
                <p className={`truncate text-xs ${mutedColor}`} data-sk-region="enrolledchildrenlists-p-field-4">
                  {pending ? <SkeletonText width="92%" /> : <>{student.gradeLevel} • {student.section}</>}
                </p>
              </div>

              {/* Right affordance */}
              <ChevronRight
                size={16}
                className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${mutedColor}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {items.length > 0 && (
        <p
          className={`border-t px-4 py-3 text-xs sm:px-5 ${dividerColor} ${mutedColor}`} data-sk-region="enrolledchildrenlists-select-a-child-to-view-their-profile-and-prog" data-sk-static=""
        >
          Select a child to view their profile and progress.
        </p>
      )}</>);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5 ${dividerColor}`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${mutedColor}`} data-sk-region="enrolledchildrenlists-linked-students" data-sk-static=""
        >
          Linked students
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass}`}
          style={pillStyle}
        >
          {students.length} {students.length === 1 ? "child" : "children"}
        </span>
      </div>

      <LoadingRegion loading={loading} error={error} retry={retry} variable skeleton={renderStudents(true)} onSettled={() => rememberRows(view, students.length)}>{renderStudents(false)}</LoadingRegion>
    </div>
  );
}
