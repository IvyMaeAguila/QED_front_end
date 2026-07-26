import { BookOpen, Eye } from "lucide-react";
import { grades } from "../data/Dashboarddata";
import { getStatus, trendMap } from "../utils/Status";
import { MiniBar } from "./Minibar";

interface PerformanceByGradeProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function PerformanceByGrade({
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: PerformanceByGradeProps) {
  return (
    <section className={`mt-5 rounded-xl border shadow-sm overflow-hidden ${panelBg} ${panelBorder}`}>
      <div className="bg-[#8B0D0D] px-5 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold">Performance by Grade Level</h3>
          <p className="text-xs text-white/70 mt-1">Academic & holistic status per grade</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#C98A2B] flex items-center justify-center text-white shrink-0">
          <BookOpen size={19} />
        </div>
      </div>

      <div className={`flex flex-wrap gap-x-4 gap-y-2 px-5 py-3 border-b ${panelBorder}`}>
        {[
          ["Excellent", "#22C55E"],
          ["Good", "#34D399"],
          ["Fair", "#F59E0B"],
          ["Needs Improvement", "#FB923C"],
          ["Critical", "#EF4444"],
        ].map(([label, dot]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
            <span className={`text-[10px] font-bold ${textMuted}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={darkMode ? "bg-[#0B1120]" : "bg-[#F8FAFC]"}>
              {["Grade", "Academic", "Holistic", "Students", "Trend", "Status", ""].map((h) => (
                <th
                  key={h}
                  className={`text-left font-bold text-[11px] uppercase tracking-wider px-5 py-3 ${textMuted}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grades.map(([grade, academic, holistic, enrolled, capacity, trend]) => {
              const status = getStatus(academic);
              const t = trendMap[trend];
              return (
                <tr key={grade} className={`border-t ${panelBorder} hover:bg-black/2 transition-colors`}>
                  <td className={`px-5 py-4 font-extrabold ${textPrimary}`}>{grade}</td>
                  <td className="px-5 py-4">
                    <MiniBar value={academic} color="#8B0D0D" dark={darkMode} />
                  </td>
                  <td className="px-5 py-4">
                    <MiniBar value={holistic} color="#1D70D6" dark={darkMode} />
                  </td>
                  <td className={`px-5 py-4 font-semibold ${textPrimary}`}>
                    {enrolled}/{capacity}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: darkMode ? `${t.color}25` : t.bg, color: t.color }}
                    >
                      <t.Icon size={12} />
                      {trend}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: darkMode ? `${status.color}25` : status.bg, color: status.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                        darkMode
                          ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                          : "border-[#E5E7EB] text-[#64748B] hover:bg-[#F6F7FB]"
                      }`}
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[#E5E7EB]">
        {grades.map(([grade, academic, holistic, enrolled, capacity, trend]) => {
          const status = getStatus(academic);
          const t = trendMap[trend];
          return (
            <div key={grade} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className={`font-extrabold text-base ${textPrimary}`}>{grade}</h4>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: darkMode ? `${status.color}25` : status.bg, color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={`text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Academic</p>
                  <MiniBar value={academic} color="#8B0D0D" dark={darkMode} />
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Holistic</p>
                  <MiniBar value={holistic} color="#1D70D6" dark={darkMode} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-semibold ${textMuted}`}>
                  Students:{" "}
                  <span className={`font-extrabold ${textPrimary}`}>
                    {enrolled}/{capacity}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: darkMode ? `${t.color}25` : t.bg, color: t.color }}
                >
                  <t.Icon size={12} />
                  {trend}
                </span>
              </div>

              <button
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  darkMode
                    ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                    : "border-[#E5E7EB] text-[#64748B] hover:bg-[#F6F7FB]"
                }`}
              >
                <Eye size={13} />
                View Details
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}