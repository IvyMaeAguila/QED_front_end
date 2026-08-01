import { User, Users, X } from "lucide-react";

export interface RosterStudent {
  id: string;
  name: string;
}

interface AdvisoryRosterModalProps {
  open: boolean;
  onClose: () => void;
  male: RosterStudent[];
  female: RosterStudent[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  gradeLevel?: string;
  section?: string;
}

function RosterColumn({
  title,
  color,
  tint,
  students,
  darkMode,
  textPrimary,
  textMuted,
}: {
  title: string;
  color: string;
  tint: string;
  students: RosterStudent[];
  darkMode: boolean;
  textPrimary: string;
  textMuted: string;
}) {
  return (
    <section className={`min-w-0 flex-1 overflow-hidden rounded-2xl border ${darkMode ? "border-white/10" : "border-black/[0.06]"}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: tint }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ backgroundColor: color }}>
            <User size={15} />
          </span>
          <div>
            <h3 className={`text-sm font-extrabold ${textPrimary}`}>{title}</h3>
            <p className={`text-[11px] font-semibold ${textMuted}`}>Advisory students</p>
          </div>
        </div>
        <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ backgroundColor: `${color}20`, color }}>
          {students.length}
        </span>
      </div>

      <div className={`divide-y ${darkMode ? "divide-white/10" : "divide-black/[0.06]"}`}>
        {students.map((student) => (
          <div key={student.id} className={`flex items-center gap-3 px-5 py-3.5 ${darkMode ? "hover:bg-white/[0.035]" : "hover:bg-black/[0.012]"} transition-colors`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}20`, color }}>
              <span className="text-[11px] font-black">{student.name.slice(0, 1).toUpperCase()}</span>
            </span>
            <div className="min-w-0">
              <p className={`truncate text-sm font-extrabold ${textPrimary}`}>{student.name}</p>
              <p className={`mt-0.5 text-[11px] font-semibold tabular-nums ${textMuted}`}>Student ID: {student.id}</p>
            </div>
          </div>
        ))}
        {students.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className={`text-xs font-semibold ${textMuted}`}>No students in this group.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function AdvisoryRosterModal({
  open,
  onClose,
  male,
  female,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  gradeLevel,
  section,
}: AdvisoryRosterModalProps) {
  if (!open) return null;

  const total = male.length + female.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(10, 10, 15, 0.56)", backdropFilter: "blur(7px)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisory-roster-title"
        className={`flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelBg} ${panelBorder}`}
      >
        <div className={`flex items-center justify-between gap-4 border-b px-5 py-5 sm:px-6 ${panelBorder}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: "#6B0000" }}>
              <Users size={18} />
            </span>
            <div>
              <h2 id="advisory-roster-title" className={`font-extrabold ${textPrimary}`}>Advisory class roster</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                {gradeLevel && section ? `${gradeLevel} · Section ${section} · ` : ""}{total} student{total === 1 ? "" : "s"} in this class
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close roster"
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#64748B] hover:bg-[#F6F7FB]"}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Total", value: total, color: "#6B0000", background: "#F8EDEE" },
              { label: "Male", value: male.length, color: "#1D70D6", background: "#EAF2FF" },
              { label: "Female", value: female.length, color: "#C2255C", background: "#FCE7F1" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border p-3 sm:p-4" style={{ backgroundColor: darkMode ? `${stat.color}22` : stat.background, borderColor: `${stat.color}45` }}>
                <p className={`text-[11px] font-bold ${textMuted}`}>{stat.label}</p>
                <p className={`mt-1 text-2xl font-black tabular-nums ${textPrimary}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <RosterColumn title="Male students" color="#1D70D6" tint={darkMode ? "#1D70D625" : "#EAF2FF"} students={male} darkMode={darkMode} textPrimary={textPrimary} textMuted={textMuted} />
            <RosterColumn title="Female students" color="#C2255C" tint={darkMode ? "#C2255C25" : "#FCE7F1"} students={female} darkMode={darkMode} textPrimary={textPrimary} textMuted={textMuted} />
          </div>
        </div>
      </div>
    </div>
  );
}
