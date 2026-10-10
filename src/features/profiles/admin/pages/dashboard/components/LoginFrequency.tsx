import { useMemo, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { ChevronDown, Check, RefreshCw } from "lucide-react";
import {
  getLoginFrequency,
  LoginFrequencyServiceError,
} from "../services/loginFrequency.service";
import type {
  LoginFrequencyPeriod,
  LoginFrequencyResponse,
} from "../services/loginFrequency.service";

import { LoadingRegion } from "../../../../../../shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "../../../../../../shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "../../../../../../shared/loading/reservations";

interface LoginFrequencyProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const PERIOD_OPTIONS: { label: string; value: LoginFrequencyPeriod }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
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
  const [refreshTick, setRefreshTick] = useState(0);

  const selectedLabel =
    PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label ?? "This Week";

  useEffect(() => {
    const interval = window.setInterval(() => setRefreshTick((tick) => tick + 1), 30_000);
    return () => window.clearInterval(interval);
  }, []);

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
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [selectedPeriod, refreshTick]);

  const chart = data?.chart ?? [];
  const summary = data?.summary ?? null;
  const ticks = useMemo(() => buildTicks(Math.max(...chart.map((c) => c.count), 0)), [chart]);
  const maxTick = ticks[0];
  const manyBars = chart.length > 12; // e.g. monthly (28-31) / yearly (12) edge cases

  const view = `admin/login-frequency/${selectedPeriod}`;
  function renderChart(pending: boolean) {
    const points = pending ? Array.from({ length: skeletonRows(view) }, (_, index) => ({ label: String(index), count: 1 })) : chart;
    const items = summary ? [
      { label: summary.peakType, value: summary.peakLabel, positive: false },
      { label: summary.averageLabel, value: String(summary.averageDaily), positive: false },
      { label: summary.growthLabel, value: `${summary.growthPercent > 0 ? "+" : ""}${summary.growthPercent}%`, positive: summary.growthPercent >= 0 },
    ] : Array.from({ length: 3 }, () => ({label: "", value: "", positive: false}));
    return (<div className="grid lg:grid-cols-[1fr_150px] gap-8">
        <div className="relative h-52" data-sk-fixed-region="admin-login-plot">
          <div className="absolute inset-0 flex flex-col justify-between pb-6" data-sk-region="loginfrequency-div-field-1">
            {ticks.map((tick) => (
              <div key={tick} className="flex items-center gap-2">
                <span className={`w-8 text-right text-xs font-medium ${textMuted}`} data-sk-region="loginfrequency-span-field-2">
                  {pending ? <SkeletonText width="2ch" /> : Math.round(tick)}
                </span>
                <div className={`flex-1 h-px ${darkMode ? "bg-[#1F2937]" : "bg-brand-light"}`} />
              </div>
            ))}
          </div>

          <div
            className={`absolute inset-0 pl-10 pb-6 flex items-end ${
              manyBars ? "justify-start gap-2 overflow-x-auto" : "justify-around"
            }`} data-sk-region="loginfrequency-div-field-3"
          >
            {points.map((bar) => {
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
                        className={`text-xs font-semibold tabular-nums ${
                          isPeak ? "text-brand-ink" : textMuted
                        }`} data-sk-region="loginfrequency-span-field-4"
                      >
                        {pending ? <SkeletonText width="2ch" /> : bar.count}
                      </span>
                      <div
                        className="w-6 sm:w-8 rounded-[3px]"
                        style={{
                          height: pending ? "40%" : `${(bar.count / maxTick) * 100}%`,
                          background: pending ? undefined : isPeak ? "var(--color-maroon)" : darkMode ? "#374151" : "var(--border-subtle)",
                        }} data-sk-region="loginfrequency-div-field-5"
                      >{pending && <Skeleton className="h-full w-full rounded-[3px]" />}</div>
                    </div>
                  );
                })}
          </div>

          <div
            className={`absolute bottom-0 left-10 right-0 flex ${
              manyBars ? "justify-start gap-2 overflow-x-auto" : "justify-around"
            }`} data-sk-region="loginfrequency-div-field-6"
          >
            {points.map((bar) => {
              const isPeak =
                summary != null &&
                bar.count === summary.peakCount &&
                summary.peakCount > 0 &&
                (bar.label === summary.peakLabel || summary.peakLabel?.endsWith(bar.label));
              return (
                <span
                  key={bar.label}
                  className={`text-xs shrink-0 w-6 sm:w-8 text-center ${
                    isPeak ? "text-brand-ink font-bold" : textMuted
                  }`} data-sk-region="loginfrequency-span-field-7"
                >
                  {pending ? <SkeletonText width="75%" /> : bar.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className={`space-y-4 lg:pl-6 lg:border-l ${panelBorder}`} data-sk-region="loginfrequency-div-field-8">
          {items.map((item, index) => <div key={index} data-sk-item="">
            <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="loginfrequency-p-field-9">{pending ? <SkeletonText width="78%" /> : item.label}</p>
            <p className={`mt-0.5 text-lg font-black tabular-nums ${item.positive ? "text-[#16834A]" : textPrimary}`} data-sk-region="loginfrequency-p-field-10">{pending ? <><SkeletonText width="64%" /><SkeletonText width="48%" /></> : item.value}</p>
          </div>)}

        </div>
      </div>);
  }



  return (
    <section className={`mt-5 rounded-xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
      <div className="flex items-start justify-between mb-8 gap-3">
        <div>
          <h3 className={`font-bold ${textPrimary}`} data-sk-region="loginfrequency-login-frequency" data-sk-static="">Login Frequency</h3>
          <p className={`text-xs mt-1 ${textMuted}`} data-sk-region="loginfrequency-successful-sign-ins-summarized-for-the-select" data-sk-static="">
            Successful sign-ins summarized for the selected period · refreshes every 30 seconds
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setRefreshTick((tick) => tick + 1)}
          aria-label="Refresh login frequency"
          title="Refresh login activity"
          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]" : "bg-brand-light border-border-subtle text-[#111827] hover:bg-brand-light"}`}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
        <div className="relative shrink-0">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className={`h-9 min-w-30 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
              darkMode
                ? "bg-[#0B1120] border-[#374151] text-white hover:bg-[#111827]"
                : "bg-brand-light border-border-subtle text-[#111827] hover:bg-brand-light"
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
                darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-border-subtle"
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
                    darkMode ? "text-[#D1D5DB] hover:bg-white/10" : "text-[#374151] hover:bg-brand-light"
                  }`}
                >
                  {period.label}
                  {selectedPeriod === period.value && (
                    <Check size={14} className="text-brand-ink" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <LoadingRegion loading={loading} error={error} retry={() => setRefreshTick(tick => tick + 1)} variable skeleton={renderChart(true)} onSettled={() => rememberRows(view, chart.length)}>{renderChart(false)}</LoadingRegion>
    </section>
  );
}