import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { loginBars } from "../data/Dashboarddata";

interface DailyLoginFrequencyProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export function DailyLoginFrequency({
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: DailyLoginFrequencyProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("This Week");

  return (
    <section className={`mt-5 rounded-xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
      <div className="flex items-start justify-between mb-8 gap-3">
        <div>
          <h3 className={`font-bold ${textPrimary}`}>Daily Login Frequency</h3>
          <p className={`text-xs mt-1 ${textMuted}`}>
            User activity overview for the selected period
          </p>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className={`h-9 min-w-30 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
              darkMode
                ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
                : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] hover:bg-[#F1F5F9]"
            }`}
          >
            <span className="truncate">{selectedPeriod}</span>
            <ChevronDown
              size={15}
              className={`transition-transform ${periodOpen ? "rotate-180" : ""}`}
            />
          </button>

          {periodOpen && (
            <div
              className={`absolute right-0 top-11 z-30 w-40 rounded-xl border p-1 shadow-lg ${
                darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
              }`}
            >
              {["Today", "This Week", "This Month", "This Year"].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setPeriodOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-[#F6F7FB]"
                  }`}
                >
                  {period}
                  {selectedPeriod === period && <Check size={14} className="text-[#8B0D0D]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_150px] gap-8">
        <div className="relative h-52">
          <div className="absolute inset-0 flex flex-col justify-between pb-6">
            {[100, 75, 50, 25, 0].map((tick) => (
              <div key={tick} className="flex items-center gap-2">
                <span className={`w-6 text-right text-[10px] font-medium ${textMuted}`}>{tick}</span>
                <div className={`flex-1 h-px ${darkMode ? "bg-[#1F2937]" : "bg-[#EEF1F6]"}`} />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 pl-8 pb-6 flex items-end justify-around">
            {loginBars.map((bar) => (
              <div key={bar.day} className="flex flex-col items-center gap-2 h-full justify-end">
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    bar.active ? "text-[#8B0D0D]" : textMuted
                  }`}
                >
                  {bar.value}
                </span>
                <div
                  className="w-6 sm:w-8 rounded-[3px] transition-all"
                  style={{
                    height: `${(bar.value / 100) * 100}%`,
                    background: bar.active ? "#8B0D0D" : darkMode ? "#374151" : "#E5E7EB",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-8 right-0 flex items-center justify-around">
            {loginBars.map((bar) => (
              <span
                key={bar.day}
                className={`text-xs ${
                  bar.active ? "text-[#8B0D0D] font-bold" : textMuted
                }`}
              >
                {bar.day}
              </span>
            ))}
          </div>
        </div>

        <div className={`space-y-4 lg:pl-6 lg:border-l ${panelBorder}`}>
          {[
            { label: "Peak Day", value: "Thursday" },
            { label: "Avg. Daily Logins", value: "50" },
            { label: "Weekly Growth", value: "+12.4%", positive: true },
          ].map((item) => (
            <div key={item.label}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${textMuted}`}>
                {item.label}
              </p>
              <p
                className={`mt-0.5 text-lg font-bold tabular-nums ${
                  item.positive ? "text-[#16834A]" : textPrimary
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}