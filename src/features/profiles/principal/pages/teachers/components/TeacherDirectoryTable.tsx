import { useMemo, useState } from "react";
import { DoorOpen, ChevronRight,Search, UserRound } from "lucide-react";
import type { TeacherSummary } from "../data/types";
import { getTeacherAvatar, getTeacherAvatarBorderColor } from "@shared/profile/utils/teacherAvatar";

import { LoadingTable } from "@shared/loading/LoadingTable";
import { skeletonRows } from "@shared/loading/reservations";
import { SkeletonText, SkeletonAvatar } from "@shared/components/SkeletonLoading";

interface TeacherDirectoryTableProps {
  loading?: boolean; error?: unknown; retry?: () => void;
  teachers: TeacherSummary[];
  onSelectTeacher: (teacherId: string) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

function formatAdvisories(t: TeacherSummary): string {
  const advisories = t.advisories?.length
    ? t.advisories
    : t.gradeLevel || t.advisorySection
    ? [{ gradeLevel: t.gradeLevel, section: t.advisorySection, room: t.room }]
    : [];

  if (advisories.length === 0) return "";

  return advisories
    .map((a) =>
      a.gradeLevel && a.section
        ? `${a.gradeLevel} \u00B7 ${a.section}`
        : a.gradeLevel || a.section || ""
    )
    .filter(Boolean)
    .join(" | ");
}

function formatRooms(t: TeacherSummary): string[] {
  const advisories = t.advisories?.length
    ? t.advisories
    : t.room
    ? [{ gradeLevel: t.gradeLevel, section: t.advisorySection, room: t.room }]
    : [];

  return advisories.map((a) => a.room).filter((r): r is string => Boolean(r));
}

export function TeacherDirectoryTable({
  loading = false, error, retry,
  teachers,
  onSelectTeacher,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TeacherDirectoryTableProps) {
  const [search, setSearch] = useState("");
  const [advisoryFilter, setAdvisoryFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female">("all");
  const visibleTeachers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return teachers.filter((teacher) => {
      const hasAdvisory = Boolean(formatAdvisories(teacher));
      const matchesAdvisory = advisoryFilter === "all" || (advisoryFilter === "assigned" ? hasAdvisory : !hasAdvisory);
      const matchesGender = genderFilter === "all" || teacher.gender?.toLocaleLowerCase() === genderFilter.toLocaleLowerCase();
      const haystack = `${teacher.fullName} ${formatAdvisories(teacher)} ${formatRooms(teacher).join(" ")}`.toLocaleLowerCase();
      return matchesAdvisory && matchesGender && (!query || haystack.includes(query));
    });
  }, [teachers, search, advisoryFilter, genderFilter]);

  const view = JSON.stringify(["principal/teachers", search, advisoryFilter, genderFilter]);
  const columns = [{label:"No.",typical:"10"},{label:"Teacher",typical:"Maria Dela Cruz"},{label:"Advisory & Grade Level",typical:"Grade 1 – Maroon"},{label:"Room",typical:"101"},{label:"Schedule",typical:"View"}];
  function renderRows(pending: boolean) {
    const items: TeacherSummary[] = pending ? Array.from({length:skeletonRows(view)}, (_, index) => ({teacherId:String(index),fullName:"",gender:null,advisorySection:"Maroon",gradeLevel:"Grade 1",room:"101",advisories:[]})) : visibleTeachers;
    return (<>
            {items.map((t, index) => {
              const advisoryText = formatAdvisories(t);
              const rooms = formatRooms(t);
              const avatar = getTeacherAvatar({ gender: t.gender, avatarKey: t.avatarKey });
              const avatarBorderColor = getTeacherAvatarBorderColor(t.gender);

              return (
                <tr
                  key={t.teacherId}
                  onClick={() => onSelectTeacher(t.teacherId)}
                  className={`cursor-pointer border-t transition-colors ${panelBorder} ${darkMode ? "hover:bg-white/5" : "hover:bg-black/1.5"}`}
                >
                  <td className={`px-4 py-2.5 text-xs font-bold tabular-nums ${textMuted}`} data-sk-region="teacherdirectorytable-td-field-1">{pending ? <SkeletonText width="2ch" /> : index + 1}</td>
                  <td className={`px-4 py-2.5 text-xs font-bold ${textPrimary}`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${darkMode ? "bg-white/10" : "bg-border-border-subtle"}`} style={{ borderColor: avatarBorderColor }} data-sk-region="teacherdirectorytable-span-field-2">
                        {pending ? <SkeletonAvatar className="h-full w-full" /> : avatar ? (
                          <img src={avatar} alt={`${t.fullName} profile`} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <UserRound className={`h-4 w-4 ${textMuted}`} aria-hidden="true" />
                        )}
                      </span>
                      <span className="truncate" data-sk-region="teacherdirectorytable-span-field-3">{pending ? <SkeletonText width="14ch" /> : t.fullName}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 text-xs font-medium ${textPrimary}`} data-sk-region="teacherdirectorytable-td-field-4">{pending ? <><SkeletonText width="92%" /><SkeletonText width="64%" /></> : advisoryText || <span className={textMuted} data-sk-region="teacherdirectorytable-no-advisory-assigned" data-sk-static="">No advisory assigned</span>}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5" data-sk-region="teacherdirectorytable-div-field-5">
                      {rooms.map((room, idx) => (
                        <span
                          key={`${t.teacherId}-room-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
                          style={{
                            backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)",
                            color: "var(--brand-ink)",
                          }} data-sk-region="teacherdirectorytable-span-field-6"
                        >
                          <DoorOpen className="h-3.5 w-3.5" /> {pending ? <SkeletonText width="4ch" /> : room}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-maroon" data-sk-region="teacherdirectorytable-view" data-sk-static="">
                      View <ChevronRight className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              );
            })}
            {!pending && visibleTeachers.length === 0 && (
              <tr>
                <td colSpan={5} className={`px-4 py-10 text-center text-sm font-medium ${textMuted}`}>
                  No teachers match your search or filter.
                </td>
              </tr>
            )}</>);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex flex-col gap-2.5 rounded-[12px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${panelBg} ${panelBorder}`}>
        <div className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-2.5 text-gray-400">
            <Search size={13} />
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, grade, section, or room..."
            aria-label="Search teachers by name, advisory, or room"
            className={`h-8 w-full rounded-lg border pl-8 pr-2.5 text-xs font-medium outline-none transition-colors ${panelBg} ${panelBorder} ${textPrimary} placeholder:text-gray-400 focus:border-maroon`}
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value as typeof genderFilter)}
            aria-label="Filter teachers by gender"
            style={{ borderRadius: "8px" }}
            className={`h-8 min-w-0 flex-1 rounded-lg border px-2.5 text-xs font-bold outline-none sm:flex-none ${panelBg} ${panelBorder} ${textPrimary}`}
          >
            <option value="all">All genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
          <select
            value={advisoryFilter}
            onChange={(event) => setAdvisoryFilter(event.target.value as typeof advisoryFilter)}
            aria-label="Filter teachers by advisory assignment"
            className={`h-8 min-w-0 flex-1 rounded-[12px] border px-2.5 text-xs font-bold outline-none sm:flex-none ${panelBg} ${panelBorder} ${textPrimary}`}
          >
            <option value="all">All teachers</option>
            <option value="assigned">With advisory</option>
            <option value="unassigned">No advisory</option>
          </select>
        </div>
      </div>
      <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`} aria-label="Teacher directory">
        <div className={`flex items-center gap-1.5 border-b px-4 py-3 ${panelBorder}`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`} data-sk-region="teacherdirectorytable-teacher-directory" data-sk-static="">Teacher directory</p>
          <span className={`ml-1 text-xs ${textMuted}`}>· {visibleTeachers.length} of {teachers.length} teachers</span>
        </div>
        <div className="overflow-x-auto">
        <LoadingTable view={view} loading={loading} error={error} retry={retry} columns={columns} header={<thead>
            <tr className={darkMode ? "bg-white/5" : "bg-brand-light"}>
              {columns.map((column,index) => <th key={column.label} className={`${index === 0 ? "w-12" : ""} px-4 py-2 text-left text-xs font-black uppercase tracking-wider ${textMuted}`}>{column.label}</th>)}
            </tr>
          </thead>} count={visibleTeachers.length} skeleton={renderRows(true)} className="teacher-user-table w-full min-w-208 text-sm">{renderRows(false)}</LoadingTable>
        </div>
      </section>
    </div>
  );
}
