import { cloneElement, useRef, type ReactElement, type ReactNode, type CSSProperties } from "react";
import { LoadingRegion } from "./LoadingRegion";
import { SkeletonText } from "../components/SkeletonLoading";

type ControlProps = { disabled?: boolean; value?: unknown; placeholder?: string; children?: ReactNode; type?: string; style?: CSSProperties };
const intrinsicWidths = new Map<string, number>();
/** Preserve the real input/select shell; reserve only its fetched single-line value.
 * Intrinsic controls are variable: reserve cached/typical width only while pending.
 */
export function LoadingFormValue({ loading, name, children, width = "14ch", className = "", intrinsic = false }: { loading: boolean; name: string; children: ReactElement<ControlProps>; width?: string; className?: string; intrinsic?: boolean }) {
  const control = useRef<HTMLDivElement>(null);
  const render = (pending: boolean) => <div ref={control} className="relative">
    {pending ? cloneElement(children, { disabled: true, value: "", placeholder: "", style: { ...children.props.style, ...(children.props.type === "time" ? { color: "var(--sk-transparent)" } : {}), ...(intrinsic ? { minWidth: intrinsicWidths.has(name) ? `${intrinsicWidths.get(name)}px` : `calc(${width} + 1rem)` } : {}) } }, children.type === "select" ? <><option value="" hidden />{children.props.children}</> : children.props.children) : children}
    {pending && <span className={`pointer-events-none absolute inset-y-0 flex items-center ${intrinsic ? "left-0 right-3" : "left-3 right-8"}`}><SkeletonText width={width} className={`max-w-full ${intrinsic ? "text-[length:inherit] font-[inherit]" : "text-sm font-semibold"}`} /></span>}
  </div>;
  const remember = () => {
    if (!intrinsic) return;
    const measured = control.current?.querySelector("select,input")?.getBoundingClientRect().width;
    if (measured) {
      intrinsicWidths.delete(name); intrinsicWidths.set(name, measured);
      if (intrinsicWidths.size > 128) intrinsicWidths.delete(intrinsicWidths.keys().next().value!);
    }
  };
  return <LoadingRegion loading={loading} name={name} variable={intrinsic} className={className} onSettled={remember} skeleton={null} frame={render}>{null}</LoadingRegion>;
}
