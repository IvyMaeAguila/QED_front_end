import { useMemo, useState } from "react";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import type { Student } from "../types/Students";
import { formatFullName } from "../types/Students";

import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { LoadingTable } from "@shared/loading/LoadingTable";
import { skeletonRows } from "@shared/loading/reservations";
import { SkeletonText, SkeletonAvatar } from "@shared/components/SkeletonLoading";

interface StudentsTableProps {
  loading?: boolean; error?: unknown; retry?: () => void; view?: string;
  students: Student[];
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  // onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const genderBadge = (gender: string) =>
  gender === "Male"
    ? { color: "#1D70D6", bg: "#EAF2FF" }
    : { color: "#C2255C", bg: "#FCE7F1" };

function isFemale(student: Student): boolean {
  const g = String(student.gender ?? "").trim().toUpperCase();
  return g === "F" || g === "FEMALE";
}

export function StudentsTable({
  loading = false, error, retry, view = "admin/students",
  students,
  darkMode,
  textPrimary,
  textMuted,
  // onView,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  const grouped = useMemo(() => {
    const male = students.filter((s) => !isFemale(s));
    const female = students.filter((s) => isFemale(s));
    return { male, female };
  }, [students]);

  // Full-width divider row, same style as the attendance roster table.
  function renderGroupHeader(label: string) {
    return (
      <tr>
        <th
          colSpan={6}
          className={`px-4 py-1.5 text-left text-xs font-black uppercase tracking-wider ${
            darkMode ? "bg-white/10" : "bg-brand-light"
          } ${textPrimary}`}
        >
          {label}
        </th>
      </tr>
    );
  }

  // `index` is the 0-based position inside its Male / Female group, so the
  // numbering restarts at 1 for each group.
  function renderRow(student: Student, index: number, pending = false) {
    const badge = genderBadge(student.gender);
    return (
      <tr
        key={student.id}
        // onDoubleClick={() => onView(student)}
        // title="Double-click to view details"
        className={`border-t transition-colors cursor-pointer ${
          darkMode
            ? "border-white/10 hover:bg-white/5"
            : "border-black/10 hover:bg-black/5"
        }`}
      >
        <td
          className={`whitespace-nowrap px-4 py-2 text-xs font-bold tabular-nums ${textMuted}`} data-sk-region="studentstable-td-field-1"
        >
          {pending ? <SkeletonText width="2ch" /> : index + 1}
        </td>
        <td className={`px-4 py-2 text-xs font-extrabold tabular-nums ${textPrimary}`} data-sk-region="studentstable-td-field-2">
          {pending ? <SkeletonText width="8ch" /> : student.studentId}
        </td>
        <td className="px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5" data-sk-region="studentstable-div-field-3">
            {pending ? <SkeletonAvatar className="h-7 w-7 shrink-0" /> : <StudentAvatar gender={student.gender} name={formatFullName(student)} />}
            <span className={`truncate text-xs font-bold ${textPrimary}`} data-sk-region="studentstable-span-field-4">
              {pending ? <SkeletonText width="14ch" /> : formatFullName(student)}
            </span>
          </div>
        </td>
        <td className="px-4 py-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              background: darkMode ? `color-mix(in srgb, ${badge.color} 14.51%, transparent)` : badge.bg,
              color: badge.color,
            }} data-sk-region="studentstable-span-field-5"
          >
            {pending ? <SkeletonText width="5ch" /> : student.gender}
          </span>
        </td>
        <td className={`px-4 py-2 text-xs font-bold ${textPrimary}`} data-sk-region="studentstable-td-field-6">
          {pending ? <SkeletonText width="6ch" /> : student.gradeLevel}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold ${textPrimary}`} data-sk-region="studentstable-span-field-7">{pending ? <SkeletonText width="8ch" /> : student.section}</span>
            <RowActionMenu
              darkMode={darkMode}
              // onView={() => onView(student)}
              onEdit={() => onEdit(student)}
              onDelete={() => onDelete(student)}
            />
          </div>
        </td>
      </tr>
    );
  }

  const columns = [
    {label:"No.",typical:"10"}, {label:"Student ID",typical:"2026-001"}, {label:"Full Name",typical:"Dela Cruz, Maria"},
    {label:"Gender",typical:"Female"}, {label:"Grade Level",typical:"Grade 1"}, {label:"Section",typical:"Maroon"},
  ];
  const placeholders: Student[] = Array.from({length:skeletonRows(view)}, (_, index) => ({id:String(index),dbId:index,gradeLevelId:1,sectionId:null,studentId:"",lrn:"",lastName:"",firstName:"",middleName:"",gender:"Male",gradeLevel:"Grade 1",section:null}));
  function renderMobile(pending: boolean) {
    const items = pending ? placeholders : students;
    return (<div className="md:hidden divide-y divide-[#E5E7EB]" data-sk-region="studentstable-div-field-8">
        {items.map((student) => {
          const badge = genderBadge(student.gender);
          return (
            <div
              key={student.id}
              // onDoubleClick={() => onView(student)}
              className="p-4 space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5" data-sk-region="studentstable-div-field-9">
                  {pending ? <SkeletonAvatar className="h-7 w-7 shrink-0" /> : <StudentAvatar gender={student.gender} name={formatFullName(student)} />}
                  <div className="min-w-0">
                    <p className={`truncate font-extrabold text-base ${textPrimary}`} data-sk-region="studentstable-p-field-10">
                      {pending ? <SkeletonText width="14ch" /> : formatFullName(student)}
                    </p>
                    <p className={`text-xs font-bold tabular-nums mt-0.5 ${textMuted}`} data-sk-region="studentstable-p-field-11">
                      {pending ? <SkeletonText width="4ch" /> : student.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      background: darkMode ? `color-mix(in srgb, ${badge.color} 14.51%, transparent)` : badge.bg,
                      color: badge.color,
                    }} data-sk-region="studentstable-span-field-12"
                  >
                    {pending ? <SkeletonText width="5ch" /> : student.gender}
                  </span>
                  <RowActionMenu
                    darkMode={darkMode}
                    // onView={() => onView(student)}
                    onEdit={() => onEdit(student)}
                    onDelete={() => onDelete(student)}
                  />
                </div>
              </div>

              <p className={`text-xs font-semibold ${textMuted}`} data-sk-region="studentstable-p-field-13">
                {pending ? <><SkeletonText width="92%" /><SkeletonText width="64%" /></> : <>{student.gradeLevel} &middot; Section {student.section}</>}
              </p>
            </div>
          );
        })}
      </div>);
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <LoadingTable loading={loading} error={error} retry={retry} view={view} count={students.length} className="teacher-user-table w-full text-sm"
          columns={columns} header={<thead>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              {columns.map((h) => (
                <th
                  key={h.label}
                  className={`whitespace-nowrap px-4 py-2 text-xs font-black uppercase tracking-wider ${h.label === "No." ? "w-14 text-left" : "text-left"} ${textMuted}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>}
          skeleton={<>{renderGroupHeader("Male")}{placeholders.map((student, i) => renderRow(student, i, true))}</>}>
          {students.length === 0 ? <tr><td colSpan={6} className={`py-16 text-center text-sm font-semibold ${textMuted}`}>No students match the current filters.</td></tr> : <>
            {grouped.male.length > 0 && (
              <>
                {renderGroupHeader("Male")}
                {grouped.male.map((student, i) => renderRow(student, i))}
              </>
            )}
            {grouped.female.length > 0 && (
              <>
                {renderGroupHeader("Female")}
                {grouped.female.map((student, i) => renderRow(student, i))}
              </>
            )}
</>}
        </LoadingTable>
      </div>

      <div className="md:hidden"><LoadingRegion loading={loading} error={error} retry={retry} variable skeleton={renderMobile(true)}>{renderMobile(false)}</LoadingRegion></div>
    </>
  );
}

function RowActionMenu({
  darkMode,
  // onView,
  onEdit,
  onDelete,
}: {
  darkMode: boolean;
  // onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-brand-light"
        }`}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-9 z-10 w-40 rounded-xl border shadow-lg py-1 ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-border-subtle"
          }`}
          onMouseLeave={() => setOpen(false)}
        >
          {/* <button
            onClick={() => {
              setOpen(false);
              // onView();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-brand-light"
            }`}
          >
            <Eye size={13} />
            View
          </button> */}
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-brand-light"
            }`} data-sk-region="studentstable-edit" data-sk-static=""
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 ${
              darkMode ? "text-[#F87171] hover:bg-white/5" : "text-[#B91C1C] hover:bg-[#FEE2E2]"
            }`} data-sk-region="studentstable-delete" data-sk-static=""
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}