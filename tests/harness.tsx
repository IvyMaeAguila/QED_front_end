import { createRoot } from "react-dom/client";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { DataLoader } from "../src/shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "../src/shared/components/SkeletonLoading";
import "../src/style.css";
import { AuditLogs } from "../src/features/profiles/admin/pages/dashboard/components/AuditLogs";

declare global { interface Window { skEvents: { phase: string; time: number; height: number; busy: string | null; hidden: string | null; reservationVisibility: string | null; statusCount: number }[]; skShifts: { value: number; time: number }[]; skDataAt: number; skMountedAt: number; skRelease?: () => void; } }
const params = new URLSearchParams(location.search);
const latency = Number(params.get("latency") ?? 1500);
const mode = params.get("mode") ?? "fixed";
const count = Number(params.get("count") ?? 5);
const mismatch = params.has("mismatch");
const sync = !params.has("unsynchronized");
if (params.get("theme") === "dark") document.documentElement.classList.add("dark");

function Field({ loading, value }: { loading: boolean; value: string }) {
  const numberOfLines = loading ? 3 : 0;
  return <div data-match="field" style={{ width: 280, fontSize: 14, lineHeight: "20px", overflowWrap: "anywhere" }}>
    {loading ? Array.from({ length: numberOfLines }, (_, i) => <SkeletonText key={i} width={["92%", "78%", "64%"][i]} />) : value}
  </div>;
}
function Rows({ loading, rows }: { loading: boolean; rows: number }) {
  return <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
    <colgroup><col style={{ width: "25%" }}/><col style={{ width: "75%" }}/></colgroup>
    <tbody>{Array.from({ length: loading ? 4 : rows }, (_, i) => <tr key={i} data-sk-item="" style={{ height: 48 }}>
      <td data-column="number" style={{ padding: "8px 16px" }}>{loading ? <SkeletonText width="60%"/> : i + 1}</td>
      <td data-column="name" style={{ padding: "8px 16px" }}>{loading ? <SkeletonText width={`${65 + i * 4}%`}/> : `Student ${i + 1}`}</td>
    </tr>)}</tbody>
  </table>;
}
function Tile({ loading }: { loading: boolean }) {
  return <div data-match="tile" className="rounded-table border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-card)", color: "var(--color-gray-900)" }}>
    <p style={{ fontSize: 12, lineHeight: "16px", marginBottom: 4 }}>Total students</p>
    <div data-match="number" style={{ fontSize: 30, lineHeight: "30px" }}>{loading ? <SkeletonText width="2ch"/> : "21"}</div>
  </div>;
}
function Harness() {
  const [attempt, setAttempt] = useState(0);
  const [second, setSecond] = useState(false);
  const requests = useRef(0);
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const request = ++requests.current;
    await new Promise<void>(resolve => {
      if (params.has("manual")) window.skRelease = resolve;
      else setTimeout(resolve, latency);
    });
    if (signal.aborted) throw new Error("aborted");
    window.skDataAt = performance.now();
    if (params.has("error") && request === 1) throw new Error("Test request failed");
    return count;
  }, [attempt]);
  useLayoutEffect(() => {
    window.skEvents = []; window.skShifts = []; window.skMountedAt = performance.now();
    const record = () => {
      const region = document.querySelector<HTMLElement>("#test-region .sk-region");
      if (region) {
        const layer = region.querySelector<HTMLElement>("[data-sk-layer]");
        window.skEvents.push({ phase: region.dataset.skPhase!, time: performance.now(), height: region.getBoundingClientRect().height, busy: region.getAttribute("aria-busy"), hidden: layer?.getAttribute("aria-hidden") ?? null, reservationVisibility: layer ? getComputedStyle(layer).visibility : null, statusCount: region.querySelectorAll('[role="status"]').length });
      }
    };
    record();
    const observer = new MutationObserver(record);
    observer.observe(document.getElementById("test-region")!, { subtree: true, attributes: true, childList: true });
    const shiftObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput && entry.startTime >= window.skMountedAt) window.skShifts.push({ value: shift.value, time: entry.startTime });
      }
    });
    shiftObserver.observe({ type: "layout-shift" });
    const timer = setTimeout(() => setSecond(true), 430);
    return () => { observer.disconnect(); shiftObserver.disconnect(); clearTimeout(timer); };
  }, []);
  const variable = mode === "list" || mode === "text";
  const render = (loading: boolean, rows = count) => mode === "list" ? <Rows loading={loading} rows={rows}/> : mode === "text" ? <Field loading={loading} value={"Residential address ".repeat(count)}/> : mode === "items" ? <div className="space-y-2">{Array.from({ length: count }, (_, i) => <div data-sk-item="" key={i}>{loading ? <SkeletonText width={`${60 + i % 6 * 5}%`}/> : `Item ${i + 1}`}</div>)}</div> : <Tile loading={loading}/>;
  return <main style={{ padding: 24, background: "var(--surface-page)", minHeight: "100vh" }}>
    <h1 data-static="" style={{ marginBottom: 16 }}>QED loading verification</h1>
    <button data-static="" onClick={() => setAttempt(value => value + 1)}>Retry request</button>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 40px", gap: 16, alignItems: "start" }}>
      <div id="test-region">
        {mode === "auto" ? <AuditLogs darkMode={params.get("theme") === "dark"} panelBg="bg-white dark:bg-gray-900" panelBorder="border-gray-200" textPrimary="text-gray-900" textMuted="text-gray-500" /> : <DataLoader key={attempt} fetcher={fetcher} variable={variable} skeleton={mismatch ? <div style={{ height: 240 }}><Skeleton className="h-full"/></div> : render(true)} render={rows => render(false, rows)}/> }
      </div>
      <aside data-beside="">Side</aside>
    </div>
    <p data-below="" style={{ marginTop: 24 }}>Visible content below the loading region.</p>
    {params.has("clock") && <div className="mt-6"><Skeleton data-clock="first" className="h-5 w-32" synchronize={sync}/>{second && <Skeleton data-clock="second" className="mt-2 h-5 w-32" synchronize={sync}/>}</div>}
    {params.has("surfaces") && <div className="mt-6 grid gap-4">{["page", "card", "modal", "raised", "sidebar", "brand"].map(surface => <div key={surface} data-surface={surface} className={surface === "sidebar" ? "sk-surface-sidebar" : surface === "brand" ? "sk-surface-brand" : ""} style={{ padding: 16, background: surface === "sidebar" ? "var(--sidebar-maroon)" : surface === "brand" ? "var(--brand-primary)" : surface === "page" ? document.documentElement.classList.contains("dark") ? "var(--surface-page-dark)" : "var(--surface-page)" : surface === "raised" && document.documentElement.classList.contains("dark") ? "var(--surface-raised-dark)" : document.documentElement.classList.contains("dark") ? "var(--surface-card-dark)" : "var(--surface-card)" }}><SkeletonText width="65%"/></div>)}</div>}
  </main>;
}
await Promise.all([400, 500, 600, 700].map(weight => document.fonts.load(`${weight} 12px Inter`)));
createRoot(document.getElementById("root")!).render(<Harness/>);
