import { Children, cloneElement, createContext, Fragment, isValidElement, useContext, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Skeleton } from "../components/SkeletonLoading";
type Props = Record<string, any>;
const Dimensions = createContext({ width: 0, height: 0 });
const Plot = createContext<null | { x: number; y: number; width: number; height: number }>(null);
export const usePreviewPlotArea = () => useContext(Plot);
function ResponsiveContainer({ width = "100%", height = "100%", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => { const box = node.getBoundingClientRect(); setDimensions(old => old.width === box.width && old.height === box.height ? old : { width: box.width, height: box.height }); };
    update();
    const observer = new ResizeObserver(update); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="recharts-responsive-container" style={{ width, height, minWidth: 0 }}><Dimensions.Provider value={dimensions}>{children}</Dimensions.Provider></div>;
}
// Axis/series markers are inspected from the original JSX, so labels, counts, domains,
// margins and dimensions are never maintained in a second page-specific definition.
function XAxis(_props: Props) { return null; }
function YAxis(_props: Props) { return null; }
function Bar(_props: Props) { return null; }
function Line(_props: Props) { return null; }
function Radar(_props: Props) { return null; }
function PolarAngleAxis(_props: Props) { return null; }
function PolarRadiusAxis(_props: Props) { return null; }
function CartesianGrid(_props: Props) { return null; }
function PolarGrid(_props: Props) { return null; }
function Customized(_props: Props) { return null; }
function Ignore(_props: Props) { return null; }
function elements(children: ReactNode): ReactElement<Props>[] {
  return Children.toArray(children).flatMap(child => isValidElement<Props>(child) ? child.type === Fragment ? elements(child.props.children) : [child] : []);
}
function tick(props: Props, value: unknown, x: number, y: number, vertical: boolean) {
  const args = { x, y, payload: { value } };
  if (typeof props.tick === "function") return props.tick(args);
  if (isValidElement<Props>(props.tick)) return cloneElement(props.tick, args);
  if (props.tick === false) return null;
  const label = props.tickFormatter ? props.tickFormatter(value) : value;
  return <text x={x} y={y} dy={vertical ? ".32em" : ".71em"} textAnchor={vertical ? "end" : "middle"} fill={props.tick?.fill ?? "var(--color-axis)"} fontSize={props.tick?.fontSize ?? 12} fontWeight={props.tick?.fontWeight}>{String(label ?? "")}</text>;
}
function shape(component: unknown, args: Props, fallback: ReactNode) {
  return isValidElement<Props>(component) ? cloneElement(component, args) : typeof component === "function" ? component(args) : fallback;
}
function Chart({ children, data = [], margin = {}, layout, barCategoryGap = "10%" }: Props) {
  const { width, height } = useContext(Dimensions);
  const entries = elements(children);
  const find = (type: unknown) => entries.find(child => child.type === type)?.props ?? {};
  const x = find(XAxis), y = find(YAxis);
  const left = margin.left ?? 5, right = margin.right ?? 5, top = margin.top ?? 5, bottom = margin.bottom ?? 5;
  const plot = { x: left + (y.width ?? 60), y: top, width: Math.max(0, width - left - right - (y.width ?? 60)), height: Math.max(0, height - top - bottom - (x.height ?? 30)) };
  const vertical = layout === "vertical";
  const numeric = vertical ? x : y;
  const domain = numeric.domain ?? [0, 100];
  const low = typeof domain[0] === "number" ? domain[0] : 0, high = typeof domain[1] === "number" ? domain[1] : 100;
  const ticks = numeric.ticks ?? Array.from({ length: 5 }, (_, i) => low + (high - low) * i / 4);
  const category = vertical ? y : x;
  const band = (vertical ? plot.height : plot.width) / Math.max(1, data.length);
  const series = entries.filter(child => child.type === Bar);
  const gap = typeof barCategoryGap === "string" ? Number.parseFloat(barCategoryGap) / 100 * band : barCategoryGap;
  return <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden="true"><Plot.Provider value={plot}>
    {ticks.map((value: number, index: number) => {
      const ratio = (value - low) / (high - low || 1), tx = plot.x + ratio * plot.width, ty = plot.y + (1 - ratio) * plot.height;
      return <g key={`axis-${index}`}>
        {vertical ? <line x1={tx} x2={tx} y1={plot.y} y2={plot.y + plot.height} stroke={find(CartesianGrid).stroke ?? "var(--color-grid-line)"}/> : <line x1={plot.x} x2={plot.x + plot.width} y1={ty} y2={ty} stroke={find(CartesianGrid).stroke ?? "var(--color-grid-line)"}/>}
        {tick(numeric, value, vertical ? tx : plot.x - 8, vertical ? plot.y + plot.height + 8 : ty, !vertical)}
      </g>;
    })}
    {data.map((row: Props, index: number) => <g key={`category-${index}`}>
      {tick(category, row[category.dataKey], vertical ? plot.x - 8 : plot.x + band * (index + .5), vertical ? plot.y + band * (index + .5) : plot.y + plot.height + 8, vertical)}
      {series.map((series, seriesIndex) => {
        const value = Number(row[series.props.dataKey] ?? (high - low) * .65);
        const length = Math.max(0, (value - low) / (high - low || 1)) * (vertical ? plot.width : plot.height);
        const thickness = Math.max(0, Math.min(series.props.maxBarSize ?? Infinity, (band - 2 * gap) / Math.max(1, entries.filter(child => child.type === Bar).length)));
        const args = { x: vertical ? plot.x : plot.x + band * index + (band - thickness) / 2 + seriesIndex * thickness, y: vertical ? plot.y + band * index + (band - thickness) / 2 : plot.y + plot.height - length, width: vertical ? length : thickness, height: vertical ? thickness : length };
        return <g key={seriesIndex}>{shape(series.props.shape, args, <foreignObject data-sk-chart="bar" {...args}><Skeleton className="h-full w-full rounded-t-md"/></foreignObject>)}</g>;
      })}
    </g>)}
    {entries.filter(child => child.type === Customized).map((child, index) => {
      const Component = child.props.component;
      return <g key={`custom-${index}`}>{isValidElement(Component) ? Component : typeof Component === "function" ? <Component/> : null}</g>;
    })}
  </Plot.Provider></svg>;
}
function RadarChart({ data = [], outerRadius = "80%", children, margin = {} }: Props) {
  const { width, height } = useContext(Dimensions);
  const centerX = ((margin.left ?? 0) + width - (margin.right ?? 0)) / 2;
  const centerY = ((margin.top ?? 0) + height - (margin.bottom ?? 0)) / 2;
  const radius = typeof outerRadius === "number" ? outerRadius : Math.min(width, height) * .4;
  const entries = elements(children), angle = entries.find(child => child.type === PolarAngleAxis)?.props ?? {};
  const point = (i: number, scale: number) => ({ x: centerX + Math.sin(i * 2 * Math.PI / Math.max(1, data.length)) * radius * scale, y: centerY - Math.cos(i * 2 * Math.PI / Math.max(1, data.length)) * radius * scale });
  const points = data.map((_row: Props, i: number) => point(i, .6));
  return <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
    {[.2, .4, .6, .8, 1].map(scale => <polygon key={scale} points={data.map((_row: Props, i: number) => { const p = point(i, scale); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="var(--color-grid-line)"/>)}
    {data.map((row: Props, i: number) => { const p = point(i, 1.12); return <g key={i}>{tick(angle, row[angle.dataKey], p.x, p.y, false)}</g>; })}
    {entries.filter(child => child.type === Radar).map((child, index) => <g key={index}>{shape(child.props.shape, { points }, <foreignObject data-sk-chart="radar" x={centerX-radius*.6} y={centerY-radius*.6} width={radius*1.2} height={radius*1.2}><Skeleton className="h-full w-full rounded-none" style={{clipPath:"polygon(50% 0,100% 50%,50% 100%,0 50%)"}}/></foreignObject>)}</g>)}
  </svg>;
}
export const previewCharts = { ResponsiveContainer, BarChart: Chart, LineChart: Chart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip: Ignore, Cell: Ignore, LabelList: Ignore, Customized, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceArea: Ignore };
