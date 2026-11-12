import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@shared/hooks/useAuth";
import { useActionConfirmation } from "@shared/components/useActionConfirmation";
import { boundedFetch as fetch } from "@shared/http/boundedFetch";
import { API_CONFIG } from "../../../../../../config/api.config";

interface ReviewRow {
  studentId: string;
  name: string;
  termLabel: string;
  termEnded: boolean;
  submitted: boolean;
  eligible: boolean;
  ready: boolean;
  approved: boolean;
  needsReview: boolean;
  fingerprint: string | null;
  overallAverage: number | null;
  subjects: {
    subjectSectionId: string;
    subject: string;
    grade: number | null;
    components?: { id: string; subject: string; grade: number | null }[];
  }[];
}

interface Props {
  gradeLevelId: number;
  gradingPeriodId: number;
  sectionId?: number;
  className: string;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

function status(row: ReviewRow) {
  if (row.approved) return "Approved";
  if (!row.eligible) return "Not eligible";
  if (!row.termEnded) return "Term in progress";
  if (!row.submitted) return "Awaiting class submission";
  if (!row.ready) return row.needsReview ? "Needs review · Incomplete grades" : "Incomplete grades";
  return row.needsReview ? "Needs review" : "Ready to approve";
}

export function GradeApprovalPanel({ gradeLevelId, gradingPeriodId, sectionId, className, darkMode, panelBg, panelBorder, textMuted }: Props) {
  const { sessionScope, expireSession } = useAuth();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const { confirmAction, confirmationDialog } = useActionConfirmation(darkMode);
  const endpoint = `${API_CONFIG.baseURL}/api/gradesheets/approvals`;
  const scope = { gradeLevelId, gradingPeriodId, sectionId: sectionId ?? null };
  const review = useQuery({
    queryKey: ["principal-grade-approval", sessionScope, gradeLevelId, gradingPeriodId, sectionId ?? null],
    gcTime: 0,
    networkMode: "always",
    retry: false,
    refetchOnMount: "always",
    queryFn: async ({ signal }): Promise<ReviewRow[]> => {
      const params = new URLSearchParams({ gradeLevelId: String(gradeLevelId), gradingPeriodId: String(gradingPeriodId) });
      if (sectionId !== undefined) params.set("sectionId", String(sectionId));
      const response = await fetch(`${endpoint}?${params}`, { credentials: "include", signal });
      if (response.status === 401) expireSession(sessionScope);
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.data)) throw new Error(body.message || "Could not load grades for approval.");
      return body.data;
    },
  });
  const rows = review.data ?? [];
  const ready = rows.filter(row => row.ready && !row.approved && row.fingerprint);
  const selected = ready.filter(row => row.fingerprint === selection[row.studentId]);
  const subjects = rows[0]?.subjects ?? [];

  function approve(target: ReviewRow[]) {
    const students = target.map(({ studentId, fingerprint }) => ({ studentId, fingerprint }));
    confirmAction({
      title: "Approve term grades?",
      description: `Approve ${students.length} student record${students.length === 1 ? "" : "s"} for ${className}, ${rows[0]?.termLabel || "the selected term"}? Families can view approved reports when Parent Visibility is enabled.`,
      confirmLabel: "Approve grades",
      action: async () => {
        setFeedback("");
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...scope, students }),
          });
          if (response.status === 401) expireSession(sessionScope);
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || "Could not approve grades.");
          setFeedback(`Approved ${body.approvedCount} student record${body.approvedCount === 1 ? "" : "s"}.`);
        } catch (error) {
          setFeedback(error instanceof Error ? error.message : "Could not approve grades.");
        } finally {
          setSelection({});
          await review.refetch();
        }
      },
    });
  }

  const busy = review.isFetching || review.isError;
  return (
    <section aria-label="Approve grades" className={`overflow-hidden rounded-2xl border ${panelBg} ${panelBorder}`}>
      {confirmationDialog}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${panelBorder}`}>
        <p className={`text-sm ${textMuted}`}>{rows.filter(row => row.approved).length} approved · {ready.length} ready</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void review.refetch()} disabled={review.isFetching} className="rounded-lg border px-3 py-2 text-sm font-semibold">Refresh grades</button>
          <button type="button" onClick={() => approve(selected)} disabled={busy || selected.length === 0} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Approve selected</button>
          <button type="button" onClick={() => approve(ready)} disabled={busy || ready.length === 0} className="rounded-lg bg-maroon px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve all ready</button>
        </div>
      </div>
      {feedback && <p role="status" className="px-4 py-3 text-sm">{feedback}</p>}
      {review.isPending ? <p role="status" className="p-4 text-sm">Loading grades for review…</p>
        : review.isError ? <p role="alert" className="p-4 text-sm">{review.error.message}</p>
        : !rows.length ? <p className="p-4 text-sm">No student records found for this class and term.</p>
        : <div className="overflow-x-auto">
          <table className="teacher-user-table w-full min-w-max text-sm">
            <thead className="bg-maroon text-white">
              <tr>
                <th scope="col" className="px-4 py-2">
                  <input type="checkbox" aria-label="Select all ready students" checked={ready.length > 0 && selected.length === ready.length}
                    disabled={busy || !ready.length} onChange={event => setSelection(event.target.checked
                      ? Object.fromEntries(ready.map(row => [row.studentId, row.fingerprint!])) : {})} />
                </th>
                <th scope="col" className="px-4 py-2 text-left">Student</th>
                {subjects.map(subject => <th scope="col" key={subject.subjectSectionId} className="px-4 py-2">{subject.subject}</th>)}
                <th scope="col" className="px-4 py-2">Overall Average</th>
                <th scope="col" className="px-4 py-2 text-left">Approval</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => <tr key={row.studentId} className={`border-t ${panelBorder}`}>
                <td className="px-4 py-2">
                  <input type="checkbox" aria-label={`Select ${row.name}`} checked={Boolean(row.fingerprint && row.fingerprint === selection[row.studentId])}
                    disabled={busy || !row.ready || row.approved}
                    onChange={event => setSelection(previous => ({ ...previous, [row.studentId]: event.target.checked ? row.fingerprint! : "" }))} />
                </td>
                <th scope="row" className="px-4 py-2 text-left font-medium">{row.name}</th>
                {row.subjects.map(subject => <td key={subject.subjectSectionId} className="px-4 py-2 text-center">
                  {subject.grade ?? "—"}
                  {subject.components?.map(component => <div key={component.id} className={`text-xs ${textMuted}`}>{component.subject} {component.grade ?? "—"}</div>)}
                </td>)}
                <td className="px-4 py-2 text-center">{row.overallAverage ?? "—"}</td>
                <td className="px-4 py-2 font-semibold">{status(row)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
    </section>
  );
}
