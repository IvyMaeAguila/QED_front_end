import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { rememberLines } from "./reservations";
import { useRoutePreview } from "./RoutePreview";
import "./skeleton.css";

type Phase = "waiting" | "dimmed" | "revealed" | "swapping" | "settled" | "error";
interface ControlledProps {
  as?: "div" | "span";
  loading: boolean;
  error?: unknown;
  retry?: () => void;
  skeleton: ReactNode;
  children: ReactNode;
  label?: string;
  delay?: number;
  minDuration?: number;
  variable?: boolean;
  className?: string;
  layerClassName?: string;
  onSettled?: () => void;
  /** Keep static table headers in the live table, outside the swapping bodies. */
  layout?: (layers: ReactNode, pending: boolean, outgoing: ReactNode) => ReactNode;
  layerAs?: "div" | "span" | "tbody";
  autoColumns?: boolean;
  name?: string;
  retainPrevious?: boolean;
  hasContent?: boolean;
  /** Shared real layout with static labels outside the placeholder shapes. */
  frame?: (pending: boolean) => ReactNode;
  /** A shared table body can contain real enum labels/actions beside hidden data leaves. */
  preserveStatic?: boolean;
  initialContentKnown?: boolean;
}

/** One timing/transition engine for fetched and existing context-driven regions. */
export function LoadingRegion({ as: Tag = "div", loading, error, retry, skeleton, children, label = "Loading…", delay = 200, minDuration = 400, variable = false, className = "", layerClassName = "", onSettled, layout, layerAs, autoColumns, name, retainPrevious = false, hasContent = true, frame, preserveStatic = false, initialContentKnown = false }: ControlledProps) {
  const Layer = layerAs ?? Tag;
  const instance = useId();
  const [phase, setPhase] = useState<Phase>(error ? "error" : loading ? "waiting" : "settled");
  const [snapshot, setSnapshot] = useState(() => ({ content: loading && !initialContentKnown ? undefined : frame ? frame(false) : children, present: (!loading || initialContentKnown) && hasContent }));
  const [replacedStale, setReplacedStale] = useState(false);
  const [request, setRequest] = useState(() => ({ loading, reservation: skeleton, reservedFrame: frame?.(true), generation: 0, stale: loading && initialContentKnown && retainPrevious && hasContent }));
  const { generation, reservation, reservedFrame, stale } = request;
  const root = useRef<HTMLElement | null>(null);
  const revealedAt = useRef<number | null>(null);
  const notifySettled = useEffectEvent(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-sk-content] [data-sk-field]").forEach(field => {
      if (field.dataset.skField) rememberLines(field.dataset.skField, field);
    });
    onSettled?.();
  });
  if (loading !== request.loading) {
    setRequest({ loading, reservation: loading ? skeleton : reservation, reservedFrame: loading ? frame?.(true) : reservedFrame, generation: generation + (loading ? 1 : 0), stale: loading ? retainPrevious && snapshot.present : stale });
    if (loading) setPhase("waiting");
    if (loading) setReplacedStale(false);
  }
  useEffect(() => {
    if (error || !loading) return;
    revealedAt.current = null;
    const reveal = () => { revealedAt.current = performance.now(); setReplacedStale(true); setPhase("revealed"); };
    const timer = window.setTimeout(() => { if (stale) setPhase("dimmed"); else reveal(); }, delay);
    const fallback = stale ? window.setTimeout(reveal, 2000) : undefined;
    return () => { window.clearTimeout(timer); window.clearTimeout(fallback); };
  }, [loading, error, delay, generation, stale]);
  useEffect(() => {
    if (loading || error) return;
    const timer = window.setTimeout(() => {
      if ((revealedAt.current === null && !stale) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPhase("settled");
      } else setPhase("swapping");
    }, revealedAt.current === null ? 0 : Math.max(0, minDuration - (performance.now() - revealedAt.current)));
    return () => window.clearTimeout(timer);
  }, [loading, error, minDuration, generation, stale]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || phase !== "swapping") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setPhase("settled"));
      return;
    }
    const tokens = getComputedStyle(element);
    const fade = parseFloat(tokens.getPropertyValue("--sk-fade"));
    const stagger = parseFloat(tokens.getPropertyValue("--sk-stagger"));
    const lift = tokens.getPropertyValue("--sk-lift").trim();
    const easing = tokens.getPropertyValue("--sk-ease").trim();
    const owns = (node: HTMLElement) => node.closest(".sk-region") === element;
    const incoming = [...element.querySelectorAll<HTMLElement>(".sk-content")].find(owns);
    const outgoing = [...element.querySelectorAll<HTMLElement>("[data-sk-outgoing]")].find(owns);
    const items = incoming ? [...incoming.querySelectorAll<HTMLElement>("[data-sk-item]")].filter(owns) : [];
    const animations: Animation[] = [];
    if (outgoing) animations.push(outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, easing, fill: "both" }));
    if (incoming) animations.push(incoming.animate([{ opacity: 0, transform: `translateY(${lift})` }, { opacity: 1, transform: "translateY(0)" }], { duration: fade, easing, fill: "both" }));
    const shouldStagger = items.length >= 2 && items.length <= 8;
    for (const [index, item] of items.entries()) {
      const itemDelay = shouldStagger ? index * stagger : 0;
      item.dataset.skDelay = String(itemDelay);
      animations.push(item.animate([{ opacity: 0, transform: `translateY(${lift})` }, { opacity: 1, transform: "translateY(0)" }], { duration: fade, delay: itemDelay, easing, fill: "both" }));
    }
    let cancelled = false;
    Promise.all(animations.map(animation => animation.finished.catch(() => undefined))).then(() => { if (!cancelled) setPhase("settled"); });
    return () => { cancelled = true; animations.forEach(animation => animation.cancel()); };
  }, [phase, generation]);
  useLayoutEffect(() => {
    if (phase === "settled" && !loading && !error) {
      setSnapshot(previous => !frame && previous.content === children && previous.present === hasContent ? previous : { content: frame ? frame(false) : children, present: hasContent });
      notifySettled();
    }
  }, [phase, generation, children, loading, error, hasContent, frame]);
  const failed = Boolean(error);
  const pending = !failed && phase !== "settled";
  const showingStale = stale && (phase === "waiting" || phase === "dimmed");
  const outgoingContent = stale && !replacedStale ? snapshot.content : reservation;
  const layers = <>
    {showingStale && <Layer inert className={`sk-layer ${layerClassName}`} data-sk-stale="" style={{ opacity: phase === "dimmed" ? .6 : 1 }}>{snapshot.content}</Layer>}
    {!showingStale && phase !== "settled" && !(layout && phase === "swapping") && <Layer inert={!preserveStatic || phase === "swapping" ? true : undefined} className={`sk-layer ${layerClassName}${preserveStatic && phase !== "swapping" ? " sk-frame" : ""}`} data-sk-frame={preserveStatic && phase !== "swapping" ? "" : undefined} data-sk-layer={preserveStatic && phase !== "swapping" || phase === "swapping" && stale && !replacedStale ? undefined : ""} aria-hidden={preserveStatic && phase !== "swapping" ? undefined : true} data-sk-reserved={phase === "waiting" ? "" : undefined} data-sk-outgoing={phase === "swapping" ? "" : undefined}>{phase === "swapping" ? outgoingContent : reservation}</Layer>}
    {(phase === "swapping" || phase === "settled") && <Layer className={`sk-layer sk-content ${layerClassName}`} data-sk-content="">{children}</Layer>}
  </>;
  return (
    <Tag ref={element => { root.current = element; }} className={`sk-region ${className}`} data-sk-region={name ?? `field-${instance}`} aria-busy={pending} data-sk-variable={variable ? "" : undefined} data-sk-auto-columns={autoColumns ? "" : undefined} data-sk-phase={failed ? "error" : phase}>
      {failed ? <>{layout?.(null, false, null)}<Tag className="sk-layer" role="alert"><Tag>{error instanceof Error ? error.message : typeof error === "string" ? error : "Unable to load this information."}</Tag>{retry && <button type="button" onClick={retry} className="mt-2 font-semibold underline" data-sk-region="loadingregion-retry" data-sk-static="">Retry</button>}</Tag></> : <>
        {frame ? <>
          {showingStale && <Layer inert className="sk-layer" data-sk-stale="" style={{ opacity: phase === "dimmed" ? .6 : 1 }}>{snapshot.content}</Layer>}
          {!showingStale && phase !== "settled" && <Layer className={phase === "swapping" ? "sk-layer" : "sk-frame"} data-sk-frame="" data-sk-reserved={phase === "waiting" ? "" : undefined} data-sk-outgoing={phase === "swapping" ? "" : undefined} aria-hidden={phase === "swapping" ? true : undefined}>{phase === "swapping" && stale && !replacedStale ? snapshot.content : reservedFrame}</Layer>}
          {(phase === "swapping" || phase === "settled") && <Layer className="sk-layer sk-content" data-sk-content="">{frame(false)}</Layer>}
        </> : layout ? layout(layers, !showingStale && (phase === "waiting" || phase === "revealed"), phase === "swapping" ? <Layer inert className={layerClassName} data-sk-layer={stale && !replacedStale ? undefined : ""} aria-hidden="true">{outgoingContent}</Layer> : null) : layers}
        {phase === "revealed" && <span role="status" className="sk-status">{label}</span>}
      </>}
    </Tag>
  );
}

interface DataLoaderProps<T> extends Omit<ControlledProps, "loading" | "error" | "retry" | "children"> {
  fetcher: (signal: AbortSignal) => Promise<T>;
  render: (value: T) => ReactNode;
}

/** Fetch adapter. Memoize fetcher per view; changing it aborts the previous load. */
export function DataLoader<T>({ fetcher, render, ...props }: DataLoaderProps<T>) {
  const preview = useRoutePreview();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ loading: boolean; value?: T; error?: unknown; fetcher: typeof fetcher; attempt: number }>({ loading: true, fetcher, attempt });
  if (state.fetcher !== fetcher || state.attempt !== attempt) setState({ loading: true, fetcher, attempt });
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    Promise.resolve().then(() => fetcher(controller.signal)).then(
      value => { if (!controller.signal.aborted) setState({ loading: false, value, fetcher, attempt }); },
      error => { if (!controller.signal.aborted) setState({ loading: false, error: error || new Error("Unable to load this information."), fetcher, attempt }); },
    );
    return () => controller.abort();
  }, [fetcher, attempt, preview]);
  return <LoadingRegion {...props} loading={state.loading} error={state.error} retry={() => setAttempt(value => value + 1)}>{state.value === undefined ? null : render(state.value)}</LoadingRegion>;
}
