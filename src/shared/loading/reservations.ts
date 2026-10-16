import { useState } from "react";

const counts = new Map<string, number>();
const lines = new Map<string, number>();
const columns = new Map<string, number[]>();

/** Only used while pending: loaded tables retain native automatic layout.
 * Pass loading as a dependency so compiler memoization re-reads the cache when
 * a new request starts, even when the view key is unchanged.
 */
export function skeletonColumnShares(view: string, labels: readonly { label: string; typical?: string; reservedWidth?: number }[], _loading?: boolean) {
  const cached = columns.get(view);
  if (cached?.length === labels.length) return cached.map(width => `${width}px`);
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (canvas) canvas.font = "600 12px " + getComputedStyle(document.body).fontFamily;
  const weights = labels.map(column => {
    if (!column.label && !column.typical) return 1;
    const measure = (text: string) => canvas?.measureText(text).width ?? text.length * 7;
    return Math.max(measure(column.label.toUpperCase()), measure(column.typical ?? "")) + 32;
  });
  const fixed = labels.reduce((sum, column) => sum + (column.reservedWidth ?? 0), 0);
  const total = weights.reduce((sum, width, index) => sum + (labels[index].reservedWidth === undefined ? width : 0), 0);
  return weights.map((width, index) => labels[index].reservedWidth !== undefined ? `${labels[index].reservedWidth}px` : fixed ? `calc((100% - ${fixed}px) * ${width / total})` : `${100 * width / total}%`);
}

export function rememberColumns(view: string, table: HTMLTableElement | null) {
  if (!table) return;
  // Multi-level record headers have spanning cells: measure a native leaf row instead.
  const leafRow = [...table.querySelectorAll<HTMLTableRowElement>("tbody tr")].find(row => row.cells.length > 1 && [...row.cells].every(cell => cell.colSpan === 1));
  const cells = leafRow ? [...leafRow.cells] : [...table.querySelectorAll<HTMLTableCellElement>("thead tr:first-child > th")];
  const widths = cells.map(cell => cell.getBoundingClientRect().width);
  if (!widths.length || widths.some(width => width <= 0)) return;
  columns.delete(view); columns.set(view, widths);
  if (columns.size > 128) columns.delete(columns.keys().next().value!);
}

/** Freeze pending widths even if other data or font metrics change mid-load. */
export function useColumnReservation(view: string, labels: readonly { label: string; typical?: string; reservedWidth?: number }[], loading: boolean) {
  const [reservation, setReservation] = useState(() => ({ loading, widths: skeletonColumnShares(view, labels, loading) }));
  if (loading !== reservation.loading) setReservation({ loading, widths: loading ? skeletonColumnShares(view, labels, loading) : reservation.widths });
  return reservation.widths;
}

export function rememberRows(view: string, count: number) {
  counts.delete(view); counts.set(view, count);
  if (counts.size > 128) counts.delete(counts.keys().next().value!);
}
export function skeletonRows(view: string, pageSize?: number, rowHeight = 52) {
  const viewport = typeof window === "undefined" ? 768 : window.innerHeight;
  const capacity = Math.max(1, Math.floor((viewport - 240) / rowHeight));
  const typical = Math.max(3, Math.min(6, capacity));
  return Math.max(0, Math.min(pageSize ?? counts.get(view) ?? typical, capacity, 6));
}
export function rememberLines(field: string, element: HTMLElement) {
  const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
  if (lineHeight) {
    lines.delete(field); lines.set(field, Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight)));
    if (lines.size > 128) lines.delete(lines.keys().next().value!);
  }
}
export function skeletonLines(field: string, typical = 2) { return lines.get(field) ?? typical; }

/** View count for data-dependent columns/items; callers supply the typical count. */
export function lastKnownCount(view: string, typical: number) { return counts.get(view) ?? typical; }
