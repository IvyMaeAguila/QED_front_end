import {
AlertTriangle,
AlignJustify,
ArrowLeft,
BarChart3,
Bell,
BookOpen,
Brain,
Calendar,
CheckCircle2,
Heart,
LayoutGrid,
Mail,
MapPin,
Pencil,
Phone,
ShieldCheck,
Smile,
TrendingUp,
User,
Users2,
XCircle,
Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import { useClasses } from "../../features/profiles/admin/pages/classes/context/ClassesContext";
import { useTeachers } from "../../features/profiles/admin/pages/classes/context/TeachersContext";
import type { SchedulePeriod } from "../../features/profiles/admin/pages/classes/types/Class";
import { formatTeacherName } from "../../features/profiles/admin/pages/classes/types/Teacher";
import { useStudents } from "../../features/profiles/admin/pages/studentrecords/context/StudentsContext";
import type { Student } from "../../features/profiles/admin/pages/studentrecords/types/Students";
import { LoadingRegion } from "../loading/LoadingRegion";
import { LoadingTable } from "../loading/LoadingTable";
import { SkeletonParagraph } from "../loading/SkeletonParagraph";
import { skeletonRows } from "../loading/reservations";
import { HeroProfileBanner } from "./StudentHeroProfileBanner";

type StudentWithExtras = Student & {
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  guardianEmail?: string;
};

const ACCENT = "var(--color-maroon)";

type HolisticMetric = {
  label: string;
  icon: typeof Brain;
  note: string;
  score: number | null;
};

const HOLISTIC_AXES: HolisticMetric[] = [
  {
    label: "Cognitive",
    icon: Brain,
    note: "Performance, Comprehension",
    score: null,
  },
  {
    label: "Emotional",
    icon: Heart,
    note: "Motivation, Engagement",
    score: null,
  },
  {
    label: "Social",
    icon: Users2,
    note: "Participation, Teamwork",
    score: null,
  },
  {
    label: "Behavioral",
    icon: Smile,
    note: "Attendance, Discipline",
    score: null,
  },
];

function HolisticRadarChart({
  metrics,
  darkMode,
}: {
  metrics: HolisticMetric[];
  darkMode: boolean;
}) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 92;
  const hasAnyScore = metrics.some((m) => m.score !== null);
  const fallbackFraction = 0.42;
  const angles = [-90, 0, 90, 180];

  const pointAt = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const valuePoints = metrics.map((m, i) => {
    const fraction =
      m.score !== null
        ? Math.max(0, Math.min(m.score, 5)) / 5
        : fallbackFraction;
    return pointAt(angles[i], maxRadius * fraction);
  });
  const valuePath = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const ringFractions = [0.33, 0.66, 1];
  const gridColor = darkMode ? "#334155" : "#E2E8F0";
  const labelColor = darkMode ? "#94A3B8" : "var(--color-maroon)";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringFractions.map((f) => (
          <polygon
            key={f}
            points={angles
              .map((a) => {
                const p = pointAt(a, maxRadius * f);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {angles.map((a, i) => {
          const p = pointAt(a, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={valuePath}
          fill={hasAnyScore ? "var(--color-maroon)" : "#94A3B8"}
          fillOpacity={hasAnyScore ? 0.35 : 0.25}
          stroke={hasAnyScore ? "var(--color-maroon)" : "#94A3B8"}
          strokeWidth={2}
          strokeDasharray={hasAnyScore ? undefined : "4 3"}
        />
        {valuePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={hasAnyScore ? "var(--color-maroon)" : "#94A3B8"}
          />
        ))}
        {metrics.map((m, i) => {
          const p = pointAt(angles[i], maxRadius + 22);
          return (
            <text
              key={m.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight={700}
              fill={labelColor}
            >
              {m.label}
            </text>
          );
        })}
      </svg>
      {!hasAnyScore && (
        <p
          className={`text-xs font-semibold mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`} data-sk-region="studentdetailpage-awaiting-assessment-showing-baseline" data-sk-static=""
        >
          Awaiting assessment — showing baseline
        </p>
      )}
    </div>
  );
}

function useStudentDetailPageState() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent, loading: studentsLoading, error: studentsError, refetch } = useStudents();
  const { classes, loading: classesLoading, error: classesError, refreshClasses } = useClasses();
  const { teachers, loading: teachersLoading, error: teachersError, refetchTeachers } = useTeachers();
  const [holisticView, setHolisticView] = useState<"chart" | "list">("chart");

  const foundStudent = studentId
    ? (getStudent(studentId) as StudentWithExtras | undefined)
    : undefined;

  if (!studentsLoading && !studentsError && !foundStudent) {
    return { content: ((
      <section
        className={`rounded-xl border shadow-sm p-10 text-center max-w-md mx-auto mt-12 ${panelBg} ${panelBorder}`}
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-brand-ink dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} />
        </div>
        <h3 className={`text-base font-bold ${textPrimary}`} data-sk-region="studentdetailpage-student-not-found" data-sk-static="">
          Student Not Found
        </h3>
        <p className={`text-xs mt-1.5 ${textMuted}`}>
          No student record matches ID{" "}
          <span className="font-semibold">{studentId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/students")}
          className="mt-6 h-10 px-5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shadow-sm transition-opacity hover:opacity-90"
          style={{ background: ACCENT }} data-sk-region="studentdetailpage-back-to-student-records" data-sk-static=""
        >
          <ArrowLeft size={14} />
          Back to Student Records
        </button>
      </section>
    )), scope: {  } };
  }

  const student: StudentWithExtras = foundStudent ?? { id: studentId ?? "", dbId: 0, gradeLevelId: 0, sectionId: null, studentId: "", lrn: "", firstName: "", lastName: "", middleName: "", gender: "Female", gradeLevel: "Grade 1", section: null };
  const view = `student-details:${studentId}`;
  const field = (key: string, value: React.ReactNode, typical = 2) => <LoadingRegion as="span" name={`student-detail-${key}`} loading={studentsLoading} variable skeleton={<SkeletonParagraph field={`${view}:${key}`} typical={typical} />}><span className="block" data-sk-field={`${view}:${key}`}>{value}</span></LoadingRegion>;
  const scheduleLoading = studentsLoading || classesLoading || teachersLoading;
  const scheduleError = classesError || teachersError;
  const retrySchedule = () => { refreshClasses(); refetchTeachers(); };
  const myClass = classes.find(
    (c) => c.gradeLevel === student.gradeLevel && c.section === student.section,
  );

  const fullName =
    [student.lastName, student.firstName].filter(Boolean).join(", ") +
    (student.middleName ? ` ${student.middleName.charAt(0)}.` : "");
  const initials =
    `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();

  const cardClasses = `rounded-xl border shadow-xs overflow-hidden transition-all ${panelBg} ${panelBorder}`;
  const cardHeaderClasses = `px-6 py-4 flex items-center justify-between border-b ${panelBorder}`;
  const sectionTitleClasses = `text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 ${textPrimary}`;
  const fieldLabel = `text-xs font-bold uppercase tracking-wider ${textMuted}`;
  const fieldValue = `text-sm font-semibold mt-1 ${textPrimary}`;

  const renderPerformanceRows = (pending: boolean) => (<>
                {(pending ? Array.from({ length: skeletonRows(`${view}:performance`, undefined, 72) }, (_, index) => ({ id: `pending-${index}`, subject: "", teacherId: "", startTime: "", endTime: "", days: [] } satisfies SchedulePeriod)) : myClass?.schedule ?? []).map((period, index) => {
                  const t = teachers.find((tc) => tc.id === period.teacherId);
                  return (
                    <tr
                      data-sk-region="student-performance-row" key={period.id}
                      className={`transition-colors ${darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50"}`}
                    >
                      <td className={`px-6 py-4 font-bold ${textPrimary}`} data-sk-region="studentdetailpage-td-field-1">
                        {pending ? <SkeletonParagraph field={`${view}:subject-${index}`} /> : <span data-sk-field={`${view}:subject-${index}`}>{period.subject}</span>}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${textMuted}`} data-sk-region="studentdetailpage-td-field-2">
                        {pending ? <SkeletonParagraph field={`${view}:teacher-${index}`} /> : <span data-sk-field={`${view}:teacher-${index}`}>{t ? formatTeacherName(t) : "Unassigned"}</span>}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-bold ${textMuted}`}
                      >
                        &mdash;
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${darkMode ? "bg-amber-950/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200"}`} data-sk-region="studentdetailpage-pending" data-sk-static=""
                        >
                          Pending
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </>);
  const performanceHeader = (              <thead>
                <tr
                  className={`border-b text-xs font-bold uppercase tracking-wider ${panelBorder} ${darkMode ? "bg-slate-900/60" : "bg-slate-50"}`}
                >
                  <th className="px-6 py-3.5" data-sk-region="studentdetailpage-subject" data-sk-static="">Subject</th>
                  <th className="px-6 py-3.5" data-sk-region="studentdetailpage-assigned-teacher" data-sk-static="">Assigned Teacher</th>
                  <th className="px-6 py-3.5 text-center" data-sk-region="studentdetailpage-quarter-grade" data-sk-static="">Quarter Grade</th>
                  <th className="px-6 py-3.5" data-sk-region="studentdetailpage-status" data-sk-static="">Status</th>
                </tr>
              </thead>);
  const navigation = (
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/admin/students")} className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border transition-colors ${darkMode ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`} data-sk-region="studentdetailpage-back-to-students" data-sk-static=""><ArrowLeft size={14} />Back to Students</button>
        <Link aria-disabled={studentsLoading || !!studentsError} onClick={event => { if (studentsLoading || studentsError) event.preventDefault(); }} to={`/admin/students/${student.id}/edit`} className="h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shadow-xs transition-opacity hover:opacity-90" style={{ background: ACCENT }}><Pencil size={13} />Edit Student Record</Link>
      </div>
  );
  if (studentsError) return { content: (<div className="max-w-6xl mx-auto space-y-6 pb-12">{navigation}<LoadingRegion loading={false} error={studentsError} retry={() => void refetch()} skeleton={null}>{null}</LoadingRegion></div>), scope: {  } };

  return { content: ((
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {navigation}

      {/* Hero Profile Banner */}
      <HeroProfileBanner
        loading={studentsLoading}
        fieldKey={view}
        darkMode={darkMode}
        initials={initials}
        title={fullName}
        subtitle={`LRN: ${student.lrn} • ID: ${student.studentId}`}
        pills={[
          { label: `${student.gradeLevel} • Section ${student.section}` },
          { label: student.gender },
        ]}
        statusLabel="Active"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        metrics={[
          {
            icon: <Calendar size={18} />,
            label: "Attendance Rate",
            value: "No records yet",
            colorClasses: darkMode
              ? "bg-emerald-950/60 text-emerald-400"
              : "bg-emerald-100 text-emerald-700",
          },
          {
            icon: <Zap size={18} />,
            label: "Engagement Level",
            value: "Not evaluated",
            colorClasses: darkMode
              ? "bg-amber-950/60 text-amber-400"
              : "bg-amber-100 text-amber-700",
          },
          {
            icon: <TrendingUp size={18} />,
            label: "Overall Average",
            value: "Not Graded Yet",
            colorClasses: darkMode
              ? "bg-rose-950/60 text-rose-400"
              : "bg-rose-100 text-rose-700",
          },
        ]}
      />

      {/* Information Grid: Personal & Guardian Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-personal-information" data-sk-static="">
              <User size={15} style={{ color: "var(--brand-ink)" }} />
              Personal Information
            </h2>
          </div>
          <dl className="p-6 grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-full-name" data-sk-static="">Full Name</dt>
              <dd className={fieldValue}>{field("name", fullName, 2)}</dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-student-lrn" data-sk-static="">Student LRN</dt>
              <dd className={fieldValue}>{field("lrn", student.lrn, 1)}</dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-gender" data-sk-static="">Gender</dt>
              <dd className={fieldValue}>{field("gender", student.gender, 1)}</dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-current-class" data-sk-static="">Current Class</dt>
              <dd className={fieldValue}>
                {field("class", `${student.gradeLevel} - ${student.section}`)}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-date-of-birth" data-sk-static="">Date of Birth</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {field("date-of-birth", student.dateOfBirth ?? "Not specified", 1)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className={fieldLabel} data-sk-region="studentdetailpage-residential-address" data-sk-static="">Residential Address</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-start gap-1.5 ${textMuted}`}
              >
                <MapPin size={14} className="shrink-0 mt-0.5 opacity-70" />
                <span>{field("address", student.address ?? "No address provided on file", 2)}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-guardian-information" data-sk-static="">
              <Users2 size={15} style={{ color: "var(--brand-ink)" }} />
              Guardian Information
            </h2>
          </div>
          <dl className="p-6 grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-guardian-name" data-sk-static="">Guardian Name</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {field("guardian-name", student.guardianName ?? "Not specified", 2)}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-relationship" data-sk-static="">Relationship</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {field("guardian-relationship", student.guardianRelationship ?? "Not specified", 2)}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-contact-number" data-sk-static="">Contact Number</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${textMuted}`}
              >
                <Phone size={13} className="opacity-70" />
                <span>{field("guardian-contact", student.guardianContact ?? "No phone on file", 2)}</span>
              </dd>
            </div>
            <div>
              <dt className={fieldLabel} data-sk-region="studentdetailpage-email-address" data-sk-static="">Email Address</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-center gap-1.5 truncate ${textMuted}`}
              >
                <Mail size={13} className="shrink-0 opacity-70" />
                <span className="truncate">
                  {field("guardian-email", student.guardianEmail ?? "No email on file", 2)}
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Academic Performance Table */}
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-academic-schedule-performance" data-sk-static="">
            <BookOpen size={15} style={{ color: "var(--brand-ink)" }} />
            Academic Schedule & Performance
          </h2>
        </div>

        {!scheduleLoading && !scheduleError && (!myClass || myClass.schedule.length === 0) ? (
          <div className="p-8 text-center">
            <p className={`text-xs font-semibold ${textMuted}`}>
              No subjects assigned or scheduled for {student.gradeLevel} -
              Section {student.section}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <LoadingTable view={`${view}:performance`} loading={scheduleLoading} error={scheduleError} retry={retrySchedule} staticRows bodyClassName={`divide-y text-xs font-semibold ${panelBorder}`} columns={[{ label: "Subject", typical: "Mathematics" }, { label: "Assigned Teacher", typical: "Teacher Cruz" }, { label: "Quarter Grade", typical: "—" }, { label: "Status", typical: "Pending" }]} className="teacher-user-table w-full text-left border-collapse" header={performanceHeader} skeleton={renderPerformanceRows(true)} count={myClass?.schedule.length ?? 0}>{renderPerformanceRows(false)}</LoadingTable>
          </div>
        )}
      </section>

      {/* Analytics & Missed Activities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-performance-analytics" data-sk-static="">
              <BarChart3 size={15} style={{ color: "var(--brand-ink)" }} />
              Performance Analytics
            </h2>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              <BarChart3 size={20} />
            </div>
            <p className={`text-xs font-semibold ${textMuted}`} data-sk-region="studentdetailpage-performance-breakdown-charts-will-appear-here" data-sk-static="">
              Performance breakdown charts will appear here once quarterly
              grades are submitted.
            </p>
          </div>
        </section>

        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-missed-activities-tasks" data-sk-static="">
              <XCircle size={15} style={{ color: "var(--brand-ink)" }} />
              Missed Activities & Tasks
            </h2>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              <ShieldCheck size={20} />
            </div>
            <p className={`text-xs font-semibold ${textMuted}`} data-sk-region="studentdetailpage-no-missed-activities-or-assignments-recorded-" data-sk-static="">
              No missed activities or assignments recorded across subjects.
            </p>
          </div>
        </section>
      </div>

      {/* Holistic Development */}
      <section className={cardClasses}>
        <div className={`${cardHeaderClasses} justify-between`}>
          <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-holistic-development-assessment" data-sk-static="">
            <Brain size={15} style={{ color: "var(--brand-ink)" }} />
            Holistic Development Assessment
          </h2>
          <div
            className={`qed-segmented-control inline-flex rounded-lg p-0 ${darkMode ? "shadow-[inset_0_0_0_1px_#334155]" : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"}`}
          >
            <button
              onClick={() => setHolisticView("chart")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                holisticView === "chart"
                  ? "text-white"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-brand-ink/50 hover:bg-maroon-light/5"
              }`}
              style={
                holisticView === "chart" ? { background: ACCENT } : undefined
              }
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setHolisticView("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                holisticView === "list"
                  ? "text-white"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-brand-ink/50 hover:bg-maroon-light/5"
              }`}
              style={
                holisticView === "list" ? { background: ACCENT } : undefined
              }
            >
              <AlignJustify size={14} />
            </button>
          </div>
        </div>

        <div
          className={`p-6 grid gap-6 ${holisticView === "chart" ? "sm:grid-cols-[260px_1fr]" : ""}`}
        >
          {holisticView === "chart" && (
            <div className="flex justify-center items-start pt-2">
              <HolisticRadarChart metrics={HOLISTIC_AXES} darkMode={darkMode} />
            </div>
          )}

          <div
            className={`grid gap-4 ${holisticView === "chart" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}
          >
            {HOLISTIC_AXES.map(({ label, icon: Icon, note, score }) => (
              <div
                key={label}
                className="rounded-xl p-5"
                style={{ background: ACCENT }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 text-white">
                    <Icon size={16} />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    {label}
                  </span>
                </div>
                <p className="text-2xl font-black text-white">
                  {score !== null ? score.toFixed(1) : "—"}{" "}
                  <span className="text-xs font-semibold text-white/70">
                    / 5.0
                  </span>
                </p>
                <p className="text-xs font-semibold mt-1.5 text-white/70">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intervention Support */}
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-intervention-support" data-sk-static="">
            <AlertTriangle size={15} style={{ color: "var(--brand-ink)" }} />
            Intervention Support
          </h2>
          <button
            className="h-8 px-3.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-xs transition-opacity hover:opacity-95"
            style={{ background: ACCENT }} data-sk-region="studentdetailpage-notify-parent" data-sk-static=""
          >
            <Bell size={12} />
            Notify Parent
          </button>
        </div>
        <div className="p-6">
          <div
            className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border text-xs font-bold ${
              darkMode
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <CheckCircle2
              size={16}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <span data-sk-region="studentdetailpage-no-flagged-intervention-concerns-student-is-m" data-sk-static="">
              No flagged intervention concerns. Student is meeting standard
              behavioral and participation metrics.
            </span>
          </div>
        </div>
      </section>

      {/* Attendance Summary */}
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses} data-sk-region="studentdetailpage-attendance-overview" data-sk-static="">
            <Calendar size={15} style={{ color: "var(--brand-ink)" }} />
            Attendance Overview
          </h2>
        </div>
        <div className="p-8 text-center max-w-lg mx-auto">
          <p className={`text-5xl font-black tracking-tight ${textPrimary}`} data-sk-region="studentdetailpage--mdash-" data-sk-static="">
            &mdash;
          </p>
          <p
            className={`text-xs font-bold uppercase tracking-wider mt-1 ${textMuted}`} data-sk-region="studentdetailpage-overall-attendance-rate" data-sk-static=""
          >
            Overall Attendance Rate
          </p>

          <div
            className={`h-2 rounded-full my-6 overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: "0%", background: ACCENT }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div
              className={`rounded-xl p-4 border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-emerald-50/70 border-emerald-200"}`}
            >
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                0
              </p>
              <p className="text-xs font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 mt-0.5" data-sk-region="studentdetailpage-present" data-sk-static="">
                Present
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-rose-50/70 border-rose-200"}`}
            >
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                0
              </p>
              <p className="text-xs font-bold tracking-wider uppercase text-rose-700 dark:text-rose-400 mt-0.5" data-sk-region="studentdetailpage-absent" data-sk-static="">
                Absent
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-amber-50/70 border-amber-200"}`}
            >
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                0
              </p>
              <p className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 mt-0.5" data-sk-region="studentdetailpage-late" data-sk-static="">
                Late
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )), scope: {  } };
}


export type StudentDetailPageEffectScope = ReturnType<typeof useStudentDetailPageState>["scope"];
export type StudentDetailPageRouteProps = Record<string, never>;
export function StudentDetailPageComposition(props: object & { effects?: (scope: StudentDetailPageEffectScope) => import("react").ReactNode }) {
 const state = useStudentDetailPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
