import { SkeletonText } from "../components/SkeletonLoading";
import { skeletonLines } from "./reservations";

/** Text primitive composition; inherits the real field's font and line height. */
export function SkeletonParagraph({ field, typical = 2, width = "18ch", inline = false }: { field: string; typical?: number; width?: string; inline?: boolean }) {
  const count = skeletonLines(field, typical);
  return <span style={{ display: inline ? "inline-block" : "block", verticalAlign: inline ? "middle" : undefined, width, maxWidth: "100%" }}>
    {Array.from({ length: count }, (_, index) => <SkeletonText key={index} width={index === count - 1 ? "64%" : index % 2 ? "78%" : "92%"} />)}
  </span>;
}
