import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import "../loading/skeleton.css";

export type SkeletonKind = "text" | "avatar" | "image" | "control" | "block";
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  kind?: SkeletonKind;
  width?: CSSProperties["width"];
  aspectRatio?: CSSProperties["aspectRatio"];
  /** Test-only negative control. Production consumers always share the clock. */
  synchronize?: boolean;
}

/** The existing QED skeleton, extended into the five shared primitives. */
export function Skeleton({ kind = "block", className = "", width, aspectRatio, style, synchronize = true, ...props }: SkeletonProps) {
  const sweep = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = sweep.current;
    if (!element) return;
    void getComputedStyle(element).animationName;
    if (synchronize) for (const animation of element.getAnimations()) animation.startTime = 0;
  }, [synchronize]);
  return (
    <span {...props} aria-hidden="true" data-sk-primitive={kind}
      className={twMerge(`sk-primitive sk-${kind}`, className)}
      style={{ width, aspectRatio, ...style }}>
      <span ref={sweep} className="sk-sweep" data-sk-shimmer="" />
    </span>
  );
}

export const SkeletonText = (props: Omit<SkeletonProps, "kind">) => <Skeleton {...props} kind="text" />;
export const SkeletonAvatar = (props: Omit<SkeletonProps, "kind">) => <Skeleton {...props} kind="avatar" />;
export const SkeletonImage = (props: Omit<SkeletonProps, "kind"> & { aspectRatio: NonNullable<CSSProperties["aspectRatio"]> }) => <Skeleton {...props} kind="image" />;
export const SkeletonControl = (props: Omit<SkeletonProps, "kind">) => <Skeleton {...props} kind="control" />;

