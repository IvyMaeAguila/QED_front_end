import { useRef, type ReactNode } from "react";
import { LoadingRegion } from "./LoadingRegion";
import { rememberColumns, rememberRows, useColumnReservation } from "./reservations";

/** Composition only: callers supply their real header and shared row renderer. */
export function LoadingTable({ name, view, loading, error, retry, columns, header, skeleton, children, count, className = "", bodyClassName = "", autoColumns = true, staticRows = false }: {
  name?: string; view: string; loading: boolean; error?: unknown; retry?: () => void;
  columns: readonly { label: string; typical?: string; reservedWidth?: number }[];
  header: ReactNode | ((pending: boolean) => ReactNode); skeleton: ReactNode; children: ReactNode; count: number;
  className?: string; bodyClassName?: string; autoColumns?: boolean; staticRows?: boolean;
}) {
  const table = useRef<HTMLTableElement>(null);
  const widths = useColumnReservation(view, columns, loading);
  const colgroup = <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>;
  return <LoadingRegion name={name ?? `${view}:table-body`} loading={loading} error={error} retry={retry} variable autoColumns={autoColumns} preserveStatic={staticRows} layerAs="tbody" layerClassName={bodyClassName} className="sk-table-region" retainPrevious hasContent={count > 0}
    skeleton={skeleton} onSettled={() => { if (autoColumns) rememberColumns(view, table.current); rememberRows(view, count); }}
    layout={(bodies, pending, outgoing) => <div className="relative">
      <table ref={table} className={className}>{pending && autoColumns && colgroup}{typeof header === "function" ? header(pending) : header}{bodies}</table>
      {outgoing && <table aria-hidden="true" data-sk-outgoing="" className={`sk-layer ${className}`}>
        {autoColumns && colgroup}{typeof header === "function" ? header(true) : header}{outgoing}
      </table>}
    </div>}
  >{children}</LoadingRegion>;
}
