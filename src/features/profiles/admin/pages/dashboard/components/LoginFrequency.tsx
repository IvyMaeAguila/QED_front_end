import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  getLoginFrequency,
  LoginFrequencyServiceError,
} from "../services/loginFrequency.service";
import type {
  LoginFrequencyPeriod,
  LoginFrequencyResponse,
} from "../services/loginFrequency.service";

interface LoginFrequencyProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const PERIOD_OPTIONS: { label: string; value: LoginFrequencyPeriod }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Montly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

// Gumagawa ng "gandang" tick values papunta pataas mula sa max value
// (hal. 0/25/50/75/100 kung maliit ang data, pero sumusukat pataas
// kung mas malaki ang datos, tulad ng sa monthly/yearly views).
function buildTicks(maxCount: number): number[] {
  const safeMax = Math.max(maxCount, 1);
  const niceMax = Math.max(25, Math.ceil(safeMax / 25) * 25);
  return [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];
}

export function LoginFrequency({
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: LoginFrequencyProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<LoginFrequencyPeriod>("weekly");
  const [data, setData] = useState<LoginFrequencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel =
    PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label ?? "This Week";

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getLoginFrequency(selectedPeriod, controller.signal);
        setData(result);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof LoginFrequencyServiceError
            ? err.message
            : "Nagka-error sa pagkuha ng login frequency.";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [selectedPeriod]);

  const chart = data?.chart ?? [];
  const summary = data?.summary ?? null;
  const ticks = useMemo(() => buildTicks(Math.max(...chart.map((c) => c.count), 0)), [chart]);
  const maxTick = ticks[0];
  const manyBars = chart.length > 12; // e.g. monthly (28-31) / yearly (12) edge cases

  return (
    <section className={`mt-5 rounded-xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
      <div className="flex items-start justify-between mb-8 gap-3">
        <div>
          <h3 className={`font-bold ${textPrimary}`}>Login Frequency</h3>
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
            <span className="truncate">{selectedLabel}</span>
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
              {PERIOD_OPTIONS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => {
                    setSelectedPeriod(period.value);
                    setPeriodOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-[#F6F7FB]"
                  }`}
                >
                  {period.label}
                  {selectedPeriod === period.value && (
                    <Check size={14} className="text-[#8B0D0D]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
            darkMode
              ? "bg-[#3B0D0D] border-[#8B0D0D] text-[#FCA5A5]"
              : "bg-[#FEF2F2] border-[#FCA5A5] text-[#8B0D0D]"
          }`}
        >
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_150px] gap-8">
        <div className="relative h-52">
          <div className="absolute inset-0 flex flex-col justify-between pb-6">
            {ticks.map((tick) => (
              <div key={tick} className="flex items-center gap-2">
                <span className={`w-8 text-right text-[10px] font-medium ${textMuted}`}>
                  {Math.round(tick)}
                </span>
                <div className={`flex-1 h-px ${darkMode ? "bg-[#1F2937]" : "bg-[#EEF1F6]"}`} />
              </div>
            ))}
          </div>

          <div
            className={`absolute inset-0 pl-10 pb-6 flex items-end ${
              manyBars ? "justify-start gap-2 overflow-x-auto" : "justify-around"
            }`}
          >
            {loading && !data
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 h-full justify-end shrink-0">
                    <div
                      className={`w-6 sm:w-8 rounded-[3px] animate-pulse ${
                        darkMode ? "bg-[#1F2937]" : "bg-[#F1F5F9]"
                      }`}
                      style={{ height: "40%" }}
                    />
                  </div>
                ))
              : chart.map((bar) => {
                  const isPeak =
                    summary != null &&
                    bar.count === summary.peakCount &&
                    summary.peakCount > 0 &&
                    (bar.label === summary.peakLabel || summary.peakLabel?.endsWith(bar.label));
                  return (
                    <div
                      key={bar.label}
                      className="flex flex-col items-center gap-2 h-full justify-end shrink-0"
                    >
                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          isPeak ? "text-[#8B0D0D]" : textMuted
                        }`}
                      >
                        {bar.count}
                      </span>
                      <div
                        className="w-6 sm:w-8 rounded-[3px] transition-all"
                        style={{
                          height: `${(bar.count / maxTick) * 100}%`,
                          background: isPeak ? "#8B0D0D" : darkMode ? "#374151" : "#E5E7EB",
                        }}
                      />
                    </div>
                  );
                })}
          </div>

          <div
            className={`absolute bottom-0 left-10 right-0 flex ${
              manyBars ? "justify-start gap-2 overflow-x-auto" : "justify-around"
            }`}
          >
            {chart.map((bar) => {
              const isPeak =
                summary != null &&
                bar.count === summary.peakCount &&
                summary.peakCount > 0 &&
                (bar.label === summary.peakLabel || summary.peakLabel?.endsWith(bar.label));
              return (
                <span
                  key={bar.label}
                  className={`text-xs shrink-0 w-6 sm:w-8 text-center ${
                    isPeak ? "text-[#8B0D0D] font-bold" : textMuted
                  }`}
                >
                  {bar.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className={`space-y-4 lg:pl-6 lg:border-l ${panelBorder}`}>
          {summary ? (
            [
              { label: summary.peakType, value: summary.peakLabel },
              { label: summary.averageLabel, value: String(summary.averageDaily) },
              {
                label: summary.growthLabel,
                value: `${summary.growthPercent > 0 ? "+" : ""}${summary.growthPercent}%`,
                positive: summary.growthPercent >= 0,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>
                  {item.label}
                </p>
                <p
                  className={`mt-0.5 text-lg font-black tabular-nums ${
                    item.positive ? "text-[#16834A]" : textPrimary
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div
                  className={`h-3 w-20 rounded animate-pulse ${
                    darkMode ? "bg-[#1F2937]" : "bg-[#F1F5F9]"
                  }`}
                />
                <div
                  className={`h-5 w-16 rounded animate-pulse ${
                    darkMode ? "bg-[#1F2937]" : "bg-[#F1F5F9]"
                  }`}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}