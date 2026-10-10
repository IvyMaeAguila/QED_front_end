import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { previewCharts } from "./PreviewCharts";
type Charts = typeof import("recharts");
const loadCharts = () => import("./LoadedChart");
const LoadedChart = lazy(loadCharts);
/** The existing chart JSX supplies both its lightweight preview and its loaded renderer. */
export function DeferredChart({ loading, children }: { loading: boolean; children: (charts: Charts) => ReactNode }) {
  // Fetch code while this chart's data is pending, without blocking its skeleton.
  useEffect(() => { void loadCharts().catch(() => {}); }, []);
  const preview = children(previewCharts as unknown as Charts);
  return loading ? preview : <Suspense fallback={preview}><LoadedChart render={children}/></Suspense>;
}
