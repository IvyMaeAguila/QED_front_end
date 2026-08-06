import {
  useNavigate,
  useParams,
  useOutletContext,
  Link,
} from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  BookOpen,
  TrendingUp,
  Zap,
  Bell,
  AlertTriangle,
  XCircle,
  BarChart3,
  Brain,
  Users2,
  Smile,
  Heart,
  Mail,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  AlignJustify,
} from "lucide-react";
import { useStudents } from "../../features/profiles/admin/pages/studentrecords/context/StudentsContext";
import { useClasses } from "../../features/profiles/admin/pages/classes/context/ClassesContext";
import { useTeachers } from "../../features/profiles/admin/pages/classes/context/TeachersContext";
import { formatTeacherName } from "../../features/profiles/admin/pages/classes/types/Teacher";
import type { AdminThemeContext } from "../../features/profiles/admin/pages/AdminLayout";
import type { Student } from "../../features/profiles/admin/pages/studentrecords/types/Students";
import { useState } from "react";

type StudentWithExtras = Student & {
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianContact?: string;
  guardianEmail?: string;
};

const ACCENT = "#8B0D0D";

type HolisticMetric = { label: string; icon: typeof Brain; note: string; score: number | null };

const HOLISTIC_AXES: HolisticMetric[] = [
  { label: "Cognitive", icon: Brain, note: "Performance, Comprehension", score: null },
  { label: "Emotional", icon: Heart, note: "Motivation, Engagement", score: null },
  { label: "Social", icon: Users2, note: "Participation, Teamwork", score: null },
  { label: "Behavioral", icon: Smile, note: "Attendance, Discipline", score: null },
];

function HolisticRadarChart({ metrics, darkMode }: { metrics: HolisticMetric[]; darkMode: boolean }) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 92;
  const hasAnyScore = metrics.some((m) => m.score !== null);
  const fallbackFraction = 0.42;
  const angles = [-90, 0, 90, 180];

  const pointAt = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const valuePoints = metrics.map((m, i) => {
    const fraction = m.score !== null ? Math.max(0, Math.min(m.score, 5)) / 5 : fallbackFraction;
    return pointAt(angles[i], maxRadius * fraction);
  });
  const valuePath = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const ringFractions = [0.33, 0.66, 1];
  const gridColor = darkMode ? "#334155" : "#E2E8F0";
  const labelColor = darkMode ? "#94A3B8" : "#8B0D0D";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringFractions.map((f) => (
          <polygon
            key={f}
            points={angles.map((a) => { const p = pointAt(a, maxRadius * f); return `${p.x},${p.y}`; }).join(" ")}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {angles.map((a, i) => {
          const p = pointAt(a, maxRadius);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth={1} />;
        })}
        <polygon
          points={valuePath}
          fill={hasAnyScore ? "#8B0D0D" : "#94A3B8"}
          fillOpacity={hasAnyScore ? 0.35 : 0.25}
          stroke={hasAnyScore ? "#8B0D0D" : "#94A3B8"}
          strokeWidth={2}
          strokeDasharray={hasAnyScore ? undefined : "4 3"}
        />
        {valuePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={hasAnyScore ? "#8B0D0D" : "#94A3B8"} />
        ))}
        {metrics.map((m, i) => {
          const p = pointAt(angles[i], maxRadius + 22);
          return (
            <text key={m.label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight={700} fill={labelColor}>
              {m.label}
            </text>
          );
        })}
      </svg>
      {!hasAnyScore && (
        <p className={`text-[11px] font-semibold mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Awaiting assessment — showing baseline
        </p>
      )}
    </div>
  );
}

export function StudentDetailPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } =
    useOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { getStudent } = useStudents();
  const { classes } = useClasses();
  const { teachers } = useTeachers();
  const [holisticView, setHolisticView] = useState<"chart" | "list">("chart");

  const student = studentId
    ? (getStudent(studentId) as StudentWithExtras | undefined)
    : undefined;

  if (!student) {
    return (
      <section
        className={`rounded-xl border shadow-sm p-10 text-center max-w-md mx-auto mt-12 ${panelBg} ${panelBorder}`}
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-[#8B0D0D] dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} />
        </div>
        <h3 className={`text-base font-bold ${textPrimary}`}>
          Student Not Found
        </h3>
        <p className={`text-xs mt-1.5 ${textMuted}`}>
          No student record matches ID{" "}
          <span className="font-semibold">{studentId}</span>.
        </p>
        <button
          onClick={() => navigate("/admin/students")}
          className="mt-6 h-10 px-5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shadow-sm transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          <ArrowLeft size={14} />
          Back to Student Records
        </button>
      </section>
    );
  }

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
  const fieldLabel = `text-[11px] font-bold uppercase tracking-wider ${textMuted}`;
  const fieldValue = `text-sm font-semibold mt-1 ${textPrimary}`;
  const pillBase =
    "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/students")}
          className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border transition-colors ${
            darkMode
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowLeft size={14} />
          Back to Students
        </button>

        <Link
          to={`/admin/students/${student.id}/edit`}
          className="h-9 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shadow-xs transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          <Pencil size={13} />
          Edit Student Record
        </Link>
      </div>

      {/* Hero Profile Banner */}
      <section className={`${cardClasses} relative`}>
        <div
          className="h-28 px-6 py-6 flex items-end"
          style={{ background: ACCENT }}
        ></div>
        {/* Removed -mt-10 from this parent wrapper and adjusted alignment to center */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {/* Applied -mt-10 and z-10 directly to the avatar so ONLY the avatar overlaps the banner */}
            <div
              className={`-mt-10 w-20 h-20 rounded-2xl shadow-md border-4 flex items-center justify-center shrink-0 z-10 ${
                darkMode
                  ? "bg-slate-900 border-slate-900"
                  : "bg-white border-white"
              }`}
              style={{ color: ACCENT }}
            >
              <span className="text-2xl font-black">{initials || "?"}</span>
            </div>

            {/* The name now sits safely below the banner on the correct background */}
            <div className="mt-2 sm:mt-0">
              <h1 className={`text-xl font-bold tracking-tight ${textPrimary}`}>
                {fullName}
              </h1>
              <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
                LRN: {student.lrn} &bull; ID: {student.studentId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center mt-2 sm:mt-0">
            <span
              className={`${pillBase} ${darkMode ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}
            >
              {student.gradeLevel} &bull; Section {student.section}
            </span>
            <span
              className={`${pillBase} ${darkMode ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}
            >
              {student.gender}
            </span>
            <span
              className={`${pillBase} ${darkMode ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
            >
              <CheckCircle2 size={12} /> Active
            </span>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div
          className={`grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-t ${panelBorder} ${darkMode ? "bg-slate-900/40" : "bg-slate-50/60"}`}
        >
          <div className="px-6 py-4 flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}
            >
              <Calendar size={18} />
            </div>
            <div>
              <p className={fieldLabel}>Attendance Rate</p>
              <p className={`text-base font-bold mt-0.5 ${textMuted}`}>
                No records yet
              </p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-100 text-amber-700"}`}
            >
              <Zap size={18} />
            </div>
            <div>
              <p className={fieldLabel}>Engagement Level</p>
              <p className={`text-base font-bold mt-0.5 ${textMuted}`}>
                Not evaluated
              </p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? "bg-rose-950/60 text-rose-400" : "bg-rose-100 text-rose-700"}`}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <p className={fieldLabel}>Overall Average</p>
              <p className={`text-base font-bold mt-0.5 ${textMuted}`}>
                Not Graded Yet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Information Grid: Personal & Guardian Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses}>
              <User size={15} style={{ color: ACCENT }} />
              Personal Information
            </h2>
          </div>
          <dl className="p-6 grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <dt className={fieldLabel}>Full Name</dt>
              <dd className={fieldValue}>{fullName}</dd>
            </div>
            <div>
              <dt className={fieldLabel}>Student LRN</dt>
              <dd className={fieldValue}>{student.lrn}</dd>
            </div>
            <div>
              <dt className={fieldLabel}>Gender</dt>
              <dd className={fieldValue}>{student.gender}</dd>
            </div>
            <div>
              <dt className={fieldLabel}>Current Class</dt>
              <dd className={fieldValue}>
                {student.gradeLevel} - {student.section}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Date of Birth</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {student.dateOfBirth ?? "Not specified"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className={fieldLabel}>Residential Address</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-start gap-1.5 ${textMuted}`}
              >
                <MapPin size={14} className="shrink-0 mt-0.5 opacity-70" />
                <span>{student.address ?? "No address provided on file"}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses}>
              <Users2 size={15} style={{ color: ACCENT }} />
              Guardian Information
            </h2>
          </div>
          <dl className="p-6 grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <dt className={fieldLabel}>Guardian Name</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {student.guardianName ?? "Not specified"}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Relationship</dt>
              <dd className={`text-sm font-semibold mt-1 ${textMuted}`}>
                {student.guardianRelationship ?? "Not specified"}
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Contact Number</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${textMuted}`}
              >
                <Phone size={13} className="opacity-70" />
                <span>{student.guardianContact ?? "No phone on file"}</span>
              </dd>
            </div>
            <div>
              <dt className={fieldLabel}>Email Address</dt>
              <dd
                className={`text-sm font-semibold mt-1 flex items-center gap-1.5 truncate ${textMuted}`}
              >
                <Mail size={13} className="shrink-0 opacity-70" />
                <span className="truncate">
                  {student.guardianEmail ?? "No email on file"}
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Academic Performance Table */}
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses}>
            <BookOpen size={15} style={{ color: ACCENT }} />
            Academic Schedule & Performance
          </h2>
        </div>

        {!myClass || myClass.schedule.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-xs font-semibold ${textMuted}`}>
              No subjects assigned or scheduled for {student.gradeLevel} -
              Section {student.section}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${panelBorder} ${darkMode ? "bg-slate-900/60" : "bg-slate-50"}`}
                >
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Assigned Teacher</th>
                  <th className="px-6 py-3.5 text-center">Quarter Grade</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-xs font-semibold ${panelBorder}`}
              >
                {myClass.schedule.map((period) => {
                  const t = teachers.find((tc) => tc.id === period.teacherId);
                  return (
                    <tr
                      key={period.id}
                      className={`transition-colors ${darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50"}`}
                    >
                      <td className={`px-6 py-4 font-bold ${textPrimary}`}>
                        {period.subject}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${textMuted}`}>
                        {t ? formatTeacherName(t) : "Unassigned"}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-bold ${textMuted}`}
                      >
                        &mdash;
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${darkMode ? "bg-amber-950/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          Pending
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Analytics & Missed Activities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses}>
              <BarChart3 size={15} style={{ color: ACCENT }} />
              Performance Analytics
            </h2>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              <BarChart3 size={20} />
            </div>
            <p className={`text-xs font-semibold ${textMuted}`}>
              Performance breakdown charts will appear here once quarterly
              grades are submitted.
            </p>
          </div>
        </section>

        <section className={cardClasses}>
          <div className={cardHeaderClasses}>
            <h2 className={sectionTitleClasses}>
              <XCircle size={15} style={{ color: ACCENT }} />
              Missed Activities & Tasks
            </h2>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              <ShieldCheck size={20} />
            </div>
            <p className={`text-xs font-semibold ${textMuted}`}>
              No missed activities or assignments recorded across subjects.
            </p>
          </div>
        </section>
      </div>

      {/* Holistic Development */}
      <section className={cardClasses}>
        <div className={`${cardHeaderClasses} justify-between`}>
          <h2 className={sectionTitleClasses}>
            <Brain size={15} style={{ color: ACCENT }} />
            Holistic Development Assessment
          </h2>
          <div
            className={`inline-flex rounded-lg border p-0.5 ${darkMode ? "border-slate-700" : "border-[#8B0D0D]/30"}`}
          >
            <button
              onClick={() => setHolisticView("chart")}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                holisticView === "chart"
                  ? "text-white"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-[#8B0D0D]/50 hover:bg-[#8B0D0D]/5"
              }`}
              style={
                holisticView === "chart" ? { background: ACCENT } : undefined
              }
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setHolisticView("list")}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                holisticView === "list"
                  ? "text-white"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-[#8B0D0D]/50 hover:bg-[#8B0D0D]/5"
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
                <p className="text-[11px] font-semibold mt-1.5 text-white/70">
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
          <h2 className={sectionTitleClasses}>
            <AlertTriangle size={15} style={{ color: ACCENT }} />
            Intervention Support
          </h2>
          <button
            className="h-8 px-3.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-xs transition-opacity hover:opacity-95"
            style={{ background: ACCENT }}
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
            <span>
              No flagged intervention concerns. Student is meeting standard
              behavioral and participation metrics.
            </span>
          </div>
        </div>
      </section>

      {/* Attendance Summary */}
      <section className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h2 className={sectionTitleClasses}>
            <Calendar size={15} style={{ color: ACCENT }} />
            Attendance Overview
          </h2>
        </div>
        <div className="p-8 text-center max-w-lg mx-auto">
          <p className={`text-5xl font-black tracking-tight ${textPrimary}`}>
            &mdash;
          </p>
          <p
            className={`text-xs font-bold uppercase tracking-wider mt-1 ${textMuted}`}
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
              <p className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 mt-0.5">
                Present
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-rose-50/70 border-rose-200"}`}
            >
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                0
              </p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-rose-700 dark:text-rose-400 mt-0.5">
                Absent
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-amber-50/70 border-amber-200"}`}
            >
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                0
              </p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 mt-0.5">
                Late
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
