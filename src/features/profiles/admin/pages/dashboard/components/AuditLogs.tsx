import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { fetchAuditLogs, type AuditLogPage } from "../services/auditLogs.service";

interface AuditLogsProps {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function AuditLogs({ darkMode, panelBg, panelBorder, textPrimary, textMuted }: AuditLogsProps) {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchAuditLogs({ page: pageNumber, search, role, action, from, to }, controller.signal)
      .then(setPage)
      .catch((loadError) => {
        if (loadError?.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load audit logs.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [pageNumber, search, role, action, from, to, refreshKey]);

  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / (page?.limit ?? 20)));
  const inputClass = `h-9 rounded-lg border px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B0D0D]/30 ${darkMode ? "border-[#374151] bg-[#0B1120] text-white" : "border-[#E5E7EB] bg-white text-[#111827]"}`;
  const entries = useMemo(() => page?.entries ?? [], [page]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNumber(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className={`mt-5 overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${panelBorder}`}>
        <div>
          <h2 className={`font-bold ${textPrimary}`}>System Audit Logs</h2>
          <p className={`mt-1 text-xs ${textMuted}`}>Sign-ins and system changes across all user roles.</p>
        </div>
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${inputClass}`}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        <form onSubmit={applySearch} className="flex min-w-55 flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search user, action, endpoint, ID" className={`${inputClass} w-full pl-9`} />
          </div>
          <button className="rounded-lg bg-[#8B0D0D] px-3 text-xs font-bold text-white">Search</button>
        </form>
        <select aria-label="Filter by role" value={role} onChange={(event) => { setRole(event.target.value); setPageNumber(1); }} className={inputClass}>
          <option value="">All roles</option><option value="ADMIN">Admin</option><option value="PRINCIPAL">Principal</option><option value="TEACHER">Teacher</option><option value="PARENT">Parent</option><option value="ANONYMOUS">Anonymous</option>
        </select>
        <select aria-label="Filter by action" value={action} onChange={(event) => { setAction(event.target.value); setPageNumber(1); }} className={inputClass}>
          <option value="">All actions</option><option value="LOGIN">Login</option><option value="CREATE">Create</option><option value="UPDATE">Update</option><option value="DELETE">Delete</option><option value="UPLOAD">Upload</option><option value="SUBMIT">Submit</option><option value="CHANGE">Other change</option>
        </select>
        <label className={`flex items-center gap-1 text-[10px] font-semibold ${textMuted}`}>From<input aria-label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPageNumber(1); }} className={inputClass} /></label>
        <label className={`flex items-center gap-1 text-[10px] font-semibold ${textMuted}`}>To<input aria-label="To date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPageNumber(1); }} className={inputClass} /></label>
      </div>

      {error && <div role="alert" className="mx-4 mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{error}</div>}
      <div className="overflow-x-auto">
        <table className="teacher-user-table w-full min-w-190 text-left text-xs">
          <thead className={darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}>
            <tr className={textMuted}>
              <th className="px-4 py-3 font-bold uppercase">When</th><th className="px-4 py-3 font-bold uppercase">Who</th><th className="px-4 py-3 font-bold uppercase">Action</th><th className="px-4 py-3 font-bold uppercase">Record / endpoint</th><th className="px-4 py-3 text-center font-bold uppercase">Result</th>
            </tr>
          </thead>
          <tbody>
            {!loading && entries.map((entry) => {
              return (
                <tr key={entry.id} className={`border-t ${panelBorder}`}>
                  <td className={`whitespace-nowrap px-4 py-3 ${textMuted}`}>{formatTimestamp(entry.createdAt)}</td>
                  <td className={`px-4 py-3 ${textPrimary}`}><span className="font-bold">{entry.actorFullName || entry.actorUsername || "Unknown actor"}</span><span className={`mt-0.5 block text-[10px] ${textMuted}`}>{entry.actorUsername ? `@${entry.actorUsername} · ` : ""}{entry.actorRole || "Unknown role"}</span></td>
                  <td className={`px-4 py-3 ${textPrimary}`}><span className="font-bold">{entry.action}</span><span className={`mt-0.5 block ${textMuted}`}>{entry.resource}{entry.resourceId ? ` · #${entry.resourceId}` : ""}</span></td>
                  <td className={`max-w-80 break-all px-4 py-3 ${textMuted}`}><span className={`font-bold ${textPrimary}`}>{entry.httpMethod}</span> {entry.endpoint}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-1 font-bold ${entry.statusCode < 400 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{entry.statusCode}</span></td>
                </tr>
              );
            })}
            {!loading && entries.length === 0 && <tr><td colSpan={5} className={`px-4 py-12 text-center ${textMuted}`}>No audit events match these filters.</td></tr>}
            {loading && <tr><td colSpan={5} className={`px-4 py-12 text-center ${textMuted}`}>Loading audit events…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className={`flex items-center justify-between border-t px-4 py-3 ${panelBorder}`}>
        <p className={`text-xs ${textMuted}`}>{page?.total ?? 0} events · Page {pageNumber} of {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={pageNumber <= 1 || loading} onClick={() => setPageNumber((value) => Math.max(1, value - 1))} className={`rounded-lg border p-2 disabled:opacity-40 ${panelBorder} ${textPrimary}`} aria-label="Previous page"><ChevronLeft size={15} /></button>
          <button type="button" disabled={pageNumber >= totalPages || loading} onClick={() => setPageNumber((value) => Math.min(totalPages, value + 1))} className={`rounded-lg border p-2 disabled:opacity-40 ${panelBorder} ${textPrimary}`} aria-label="Next page"><ChevronRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}
