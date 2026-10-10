import { usePreviewPlotArea as usePlotArea } from "@shared/loading/PreviewCharts";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
// These shapes use the preview plot computed from the original chart JSX and axes.
export function PendingBar({x=0,y=0,width=0,height=0}: {x?:number;y?:number;width?:number;height?:number}) {
 return <foreignObject data-sk-chart="bar" x={x} y={y} width={width} height={height}><Skeleton className="h-full w-full rounded-b-none rounded-t-md" /></foreignObject>;
}
export function PendingAxisTick({x=0,y=0}: {x?:number;y?:number}) {
 return <foreignObject x={x-24} y={y+3} width={48} height={16}><SkeletonText width="100%" className="text-[11px] leading-4" /></foreignObject>;
}
export function PendingLine() {
 const plot = usePlotArea(); if (!plot) return null;
 return <foreignObject data-sk-chart="line" x={plot.x} y={plot.y} width={plot.width} height={plot.height}><Skeleton className="h-full w-full rounded-none" style={{clipPath:"polygon(0% 76%, 34% 48%, 65% 60%, 100% 18%, 100% 20%, 65% 62%, 34% 50%, 0% 78%)"}} /></foreignObject>;
}
export function PendingRadar({points=[]}: {points?: Array<{x:number;y:number}>}) {
 if(!points.length)return null;
 const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y));
 const width=Math.max(...points.map(p=>p.x))-left,height=Math.max(...points.map(p=>p.y))-top;
 const clip="polygon("+points.map(p=>((p.x-left)/width*100)+"% "+((p.y-top)/height*100)+"%").join(",")+")";
 return <foreignObject data-sk-chart="radar" x={left} y={top} width={width} height={height}><Skeleton className="h-full w-full rounded-none" style={{clipPath:clip}} /></foreignObject>;
}
