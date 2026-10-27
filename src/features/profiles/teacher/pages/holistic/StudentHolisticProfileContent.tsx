import { AccountSelect } from "@shared/components/AccountSelect";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { StudentAvatar } from "@shared/components/StudentAvatar";
import { SkeletonParagraph } from "@shared/loading/SkeletonParagraph";
import type { Student } from "../../../admin/pages/studentrecords/types/Students";
import type { DomainAverages, StudentHolisticProfile } from "./services/holistic.service";

const DOMAINS = ["cognitive", "emotional", "social", "behavioral"] as const;
const LABELS = { cognitive: "Cognitive", emotional: "Emotional", social: "Social", behavioral: "Behavioral" };
const INTERPRETATIONS = {
  cognitive: ["Cannot demonstrate understanding", "Struggles to understand lessons", "Understands basic concepts but needs support", "Understands most concepts with minimal guidance", "Consistently understands and applies concepts independently"],
  emotional: ["Shows negative attitude toward learning", "Frequently unmotivated", "Sometimes disengaged or unsure", "Generally positive and engaged", "Highly motivated and confident"],
  social: ["Avoids or disrupts group work", "Rarely interacts", "Participates occasionally", "Works well with peers", "Actively collaborates and leads"],
  behavioral: ["Consistently problematic behavior", "Frequently disruptive", "Sometimes distracted", "Minor issues but generally disciplined", "Always follows rules and stays focused"],
};

function rating(value: number) {
  if (value >= 4.5) return { label: "Excellent", color: "var(--semantic-success)" };
  if (value >= 3.5) return { label: "Good", color: "var(--semantic-success)" };
  if (value >= 2.5) return { label: "Average", color: "var(--semantic-warning)" };
  if (value >= 1.5) return { label: "Needs Improvement", color: "var(--semantic-warning)" };
  return { label: "Critical", color: "var(--semantic-error)" };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Props = {
  data: StudentHolisticProfile;
  student?: Student;
  pending: boolean;
  activeTab: string;
  onSelectSubject: (id: string) => void;
  averages: { domainAverages: DomainAverages; evaluationCount: number; lastEvaluation: string | null } | null;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
};

export function StudentHolisticProfileContent({ data, student, pending, activeTab, onSelectSubject, averages, darkMode, panelBg, panelBorder, textPrimary, textMuted }: Props) {
  const card = `overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`;
  const soft = darkMode ? "bg-white/[0.03]" : "bg-gray-50";
  const subject = data.subjects.find(item => item.subjectSectionId === activeTab);
  const history = (data.evaluationHistory ?? []).filter(item => activeTab === "all" || item.subjectSectionId === activeTab).slice().sort((a, b) => b.date.localeCompare(a.date));
  const historyGroups = Array.from(history.reduce((groups, item) => {
    const key = JSON.stringify([item.date.slice(0, 10), item.subjectSectionId]);
    const group = groups.get(key);
    if (group) group.entries.push(item);
    else groups.set(key, { key, date: item.date, subjectName: item.subjectName, entries: [item] });
    return groups;
  }, new Map<string, { key: string; date: string; subjectName: string; entries: typeof history }>()).values());
  const historyDomains = ["cognitive", "emotional", "behavioral", "social"] as const;
  const historyAccent = darkMode ? "var(--color-maroon-light)" : "var(--color-maroon)";
  const header = `border-b px-4 py-3 ${panelBorder}`;
  const cell = `border-t px-4 py-3 text-xs ${panelBorder}`;
  const tableHeading = `px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide ${textMuted}`;
  return <div className="space-y-6">
    <section className={card} aria-label="Student summary">
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div data-sk-region="holistic-profile-initials" className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full">
            {pending ? <Skeleton className="h-full w-full rounded-full" /> : <StudentAvatar gender={student?.gender} name={data.studentName} className="h-14 w-14" />}
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Student</p>
            <h2 className={`mt-1 break-words text-xl font-bold ${textPrimary}`}>{pending ? <SkeletonText width="18ch" /> : data.studentName || `${student?.firstName} ${student?.lastName}`}</h2>
            <div className={`mt-2 flex flex-wrap gap-2 text-xs font-medium ${textMuted}`}>
              <span className={`rounded-full border px-2 py-0.5 ${panelBorder}`}>{pending ? <SkeletonText width="18ch" /> : `${student?.gradeLevel ?? "—"} · Section ${student?.section ?? "—"}`}</span>
              <span className={`rounded-full border px-2 py-0.5 ${panelBorder}`}>{pending ? <SkeletonText width="6ch" /> : student?.gender ?? "—"}</span>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 text-xs lg:min-w-72">
          {[
            ["LRN", student?.lrn ?? "—"],
            ["Student ID", student?.studentId ?? "—"],
            ["Last evaluated", formatDate(data.overall.lastEvaluation)],
            ["Evaluations", `${data.overall.evaluationCount} this term`],
          ].map(([label, value]) => <div key={label} className="contents"><dt className={textMuted}>{label}</dt><dd className={`break-words font-medium ${textPrimary}`}>{pending ? <SkeletonText width="12ch" /> : value}</dd></div>)}
        </dl>
      </div>
    </section>

    {averages && <section className={card} aria-label="Domain snapshot">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${header}`}>
        <div><h2 className={`text-sm font-bold ${textPrimary}`}>{activeTab === "all" ? "Whole-Child Snapshot" : subject?.subjectName}</h2><p className={`mt-0.5 text-xs ${textMuted}`}>{activeTab === "all" ? "Pooled across every subject. Open a subject for the actionable trend." : "Domain ratings for the selected subject."}</p></div>
        <AccountSelect data-account-select="" data-dropdown-dark={darkMode} disabled={pending} value={activeTab} onChange={event => onSelectSubject(event.target.value)} aria-label="Filter holistic profile by subject" className={`qed-filter-control max-w-full rounded-lg border px-3 text-xs font-semibold ${panelBg} ${panelBorder} ${textPrimary}`}>
          <option value="all">All Subjects</option>{data.subjects.map(item => <option key={item.subjectSectionId} value={item.subjectSectionId}>{pending ? "Loading subject…" : item.subjectName}</option>)}
        </AccountSelect>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAINS.map((domain, index) => {
          const value = averages.domainAverages[domain];
          const band = value === null ? null : rating(value);
          return <div key={domain} className={`border-b p-4 lg:border-b-0 ${index % 2 ? "sm:border-l" : ""} ${index === 2 ? "lg:border-l" : ""} ${panelBorder}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>{LABELS[domain]}</p>
            <p className={`mt-3 text-xl font-bold ${textPrimary}`} style={{ color: band?.color }}>{pending ? <SkeletonText width="9ch" /> : band?.label ?? "No data"}</p>
            <p className={`mt-2 text-xs ${textMuted}`}>{pending ? <SkeletonText width="10ch" /> : value === null ? "Awaiting evaluation" : `${value.toFixed(1)} out of 5.0`}</p>
            <div data-sk-chart="gauge" className="mt-3 flex gap-1" aria-label={pending ? undefined : `${LABELS[domain]}: ${value ?? "no data"} out of 5`}>
              {Array.from({ length: 5 }, (_, part) => pending ? <Skeleton key={part} className="h-1.5 flex-1 rounded-sm" /> : <span key={part} className="h-1.5 flex-1 rounded-sm" style={{ backgroundColor: value !== null && part < Math.round(value) ? band?.color : "var(--border-subtle)", opacity: value !== null && part < Math.round(value) ? 1 : 0.6 }} />)}
            </div>
          </div>;
        })}
      </div>
      <div className={`border-t ${panelBorder} ${soft}`}>
        {DOMAINS.filter(domain => pending || averages.domainAverages[domain] !== null).map(domain => <div key={domain} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-5">
          <span className={`shrink-0 text-xs font-bold uppercase tracking-wide sm:w-36 ${textMuted}`}>{LABELS[domain]} insight</span>
          <p data-sk-region={`holistic-profile-insight-${domain}`} data-sk-variable="" data-sk-field={`holistic-profile-insight-${domain}`} className={`min-w-0 flex-1 text-xs leading-relaxed ${textPrimary}`}>{pending ? <SkeletonParagraph field={`holistic-profile-insight-${domain}`} typical={2} width="100%" /> : INTERPRETATIONS[domain][Math.max(0, Math.min(4, Math.round(averages.domainAverages[domain]!) - 1))]}</p>
        </div>)}
        {!pending && averages.evaluationCount === 0 && <p className={`px-4 py-3 text-xs ${textMuted}`}>No evaluations recorded yet.</p>}
      </div>
      {subject && subject.recommendations.length > 0 && <div className={`space-y-2 border-t p-4 ${panelBorder}`}><h3 className={`text-xs font-bold ${textPrimary}`}>Recommended actions</h3>{subject.recommendations.map((item, index) => <p key={index} className={`text-xs ${textPrimary}`}><span className="mr-2 font-semibold" style={{ color: item.priority === "High" ? "var(--semantic-error)" : "var(--semantic-warning)" }}>{item.priority} priority</span><span>{item.message}</span></p>)}</div>}
    </section>}

    <section className={card} aria-label="Per-subject breakdown">
      <div className={header}><h2 className={`text-sm font-bold ${textPrimary}`}>Per-Subject Breakdown</h2><p className={`mt-0.5 text-xs ${textMuted}`}>Domain scores on a 1–5 scale. A dash means no evaluation yet.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse">
        <thead className={soft}><tr>{["Subject", ...DOMAINS.map(domain => LABELS[domain]), "Evals", "Status"].map(label => <th key={label} scope="col" className={`${tableHeading} ${label !== "Subject" ? "text-center" : ""}`}>{label}</th>)}</tr></thead>
        <tbody>{data.subjects.map(item => <tr key={item.subjectSectionId} className={darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}>
          <td className={cell}><button data-sk-region="holistic-profile-subject" disabled={pending} onClick={() => onSelectSubject(item.subjectSectionId)} className={`text-left font-semibold hover:text-maroon hover:underline focus-visible:outline-2 focus-visible:outline-maroon ${textPrimary}`}>{pending ? <SkeletonText width="20ch" /> : item.subjectName}</button></td>
          {DOMAINS.map(domain => <td key={domain} className={`${cell} text-center font-semibold tabular-nums ${textMuted}`} style={{ color: item.domainAverages[domain] === null ? undefined : rating(item.domainAverages[domain]!).color }}>{pending ? <SkeletonText width="3ch" className="mx-auto" /> : item.domainAverages[domain]?.toFixed(1) ?? "—"}</td>)}
          <td className={`${cell} text-center tabular-nums ${textPrimary}`}>{pending ? <SkeletonText width="2ch" className="mx-auto" /> : item.evaluationCount}</td>
          <td className={`${cell} text-center`}><span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${panelBorder} ${textMuted}`} style={{ color: item.evaluationCount === 0 ? undefined : item.riskLevel === "NONE" ? "var(--semantic-success)" : item.riskLevel === "HIGH" ? "var(--semantic-error)" : "var(--semantic-warning)" }}>{pending ? <SkeletonText width="7ch" /> : item.evaluationCount === 0 ? "No data" : item.riskLevel === "NONE" ? "No risk" : item.riskLevel === "HIGH" ? "High risk" : "Needs attention"}</span></td>
        </tr>)}{!pending && data.subjects.length === 0 && <tr><td colSpan={7} className={`px-4 py-8 text-center text-xs ${textMuted}`}>No subjects available for this term.</td></tr>}</tbody>
      </table></div>
    </section>

    <section className={card} aria-label="Evaluation history">
      <div className={`border-b px-5 py-4 ${panelBorder}`}><h2 className={`text-sm font-bold ${textPrimary}`}>Evaluation History</h2><p className={`mt-1 text-xs ${textMuted}`}>Subject evaluations, listed from most recent. Ratings are on a 1–5 scale.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] table-fixed border-collapse">
        <colgroup><col className="w-[15%]" /><col className="w-[35%]" /><col className="w-[42%]" /><col className="w-[8%]" /></colgroup>
        <thead className={soft}><tr>{["Evaluation Date", "Subject", "Domain", "Score"].map(label => <th key={label} scope="col" className={`${label === "Score" ? tableHeading.replace("text-left", "text-center") : tableHeading} !px-5 !py-3.5`}>{label}</th>)}</tr></thead>
        <tbody>{pending ? <tr>{[12, 22, 10, 3].map((width, index) => <td key={index} className={cell}><SkeletonText width={`${width}ch`} /></td>)}</tr> : historyGroups.map(group => {
          const entries = group.entries.slice().sort((a, b) => historyDomains.indexOf(a.domain) - historyDomains.indexOf(b.domain));
          const average = entries.reduce((total, entry) => total + entry.score, 0) / entries.length;
          return entries.map((item, index) => <tr key={`${group.key}-${item.domain}-${index}`}>
            {index === 0 && <>
              <td rowSpan={entries.length} className={`${cell} !px-5 !py-5 align-top whitespace-nowrap font-medium tabular-nums ${textPrimary}`}>{formatDate(group.date)}</td>
              <td rowSpan={entries.length} className={`${cell} !px-5 !py-5 align-top ${textPrimary}`}>
                <p className="break-words font-semibold leading-relaxed">{group.subjectName}</p>
                <p className={`mt-1 ${textMuted}`}>Overall average <span className="font-semibold tabular-nums" style={{ color: historyAccent }}>{average.toFixed(1)}</span></p>
              </td>
            </>}
            <td className={`${cell} h-14 border-l !px-5 !py-4 ${textPrimary}`}>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4">
                <span className={`shrink-0 font-medium ${textMuted}`}>{LABELS[item.domain]}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--color-maroon) 12%, transparent)" }} aria-hidden="true">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, item.score / 5 * 100))}%`, backgroundColor: historyAccent }} />
                </div>
              </div>
            </td>
            <td className={`${cell} !px-5 !py-4 text-center align-middle font-semibold tabular-nums ${textPrimary}`}>{item.score.toFixed(1)}</td>
          </tr>);
        })}
          {!pending && history.length === 0 && <tr><td colSpan={4} className={`px-4 py-8 text-center text-xs ${textMuted}`}>{data.overall.evaluationCount ? "Evaluation history is not available for this term." : "No evaluation history yet."}</td></tr>}
        </tbody></table></div>
    </section>
  </div>;
}
