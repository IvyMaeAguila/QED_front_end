import type { ProgressReportData } from "../types/types";
import { TERMS, TERM_LABELS } from "../types/types";

interface FormalReportTemplateProps {
  data: ProgressReportData;
}

export function FormalReportTemplate({ data }: FormalReportTemplateProps) {
  const { meta, periodicRatings, termAverages, holisticAssessments, attendanceByTerm } = data;

  return (
    <div
      id="formal-progress-report"
      style={{
        position: "fixed",
        top: 0,
        left: "-10000px",
        width: "794px",
        padding: "40px",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "'Times New Roman', serif",
        fontSize: "12px",
      }}
    >
      <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: "12px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Learner's Progress Report</h1>
        <p style={{ margin: "4px 0 0", fontSize: "11px" }}>School Year {meta.schoolYear}</p>
      </div>

      <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={cellLabel}>Learner</td>
            <td style={cellValue}>{meta.learner}</td>
            <td style={cellLabel}>Grade &amp; Section</td>
            <td style={cellValue}>{meta.gradeSection}</td>
          </tr>
          <tr>
            <td style={cellLabel}>Class Adviser</td>
            <td style={cellValue}>{meta.classAdviser}</td>
            <td style={cellLabel}>School Year</td>
            <td style={cellValue}>{meta.schoolYear}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={sectionTitle}>Periodic Rating</h2>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Learning Areas</th>
            {TERMS.map((t) => (
              <th key={t} style={th}>{TERM_LABELS[t].split(" ")[0]}</th>
            ))}
            <th style={th}>Final Rating</th>
          </tr>
        </thead>
        <tbody>
          {periodicRatings.map((row) => (
            <tr key={row.learningArea}>
              <td style={td}>{row.learningArea}</td>
              {TERMS.map((t) => (
                <td key={t} style={{ ...td, textAlign: "center" }}>{row.scores[t] ?? "—"}</td>
              ))}
              <td style={td}>{row.finalRating}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={sectionTitle}>Term Average</h2>
      <table style={table}>
        <thead>
          <tr>
            {TERMS.map((t) => (
              <th key={t} style={th}>{TERM_LABELS[t]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {termAverages.map((t) => (
              <td key={t.term} style={{ ...td, textAlign: "center" }}>
                {t.average !== null ? `${t.average}% (${t.ratingLabel})` : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 style={sectionTitle}>Holistic Development Assessment</h2>
      {holisticAssessments.map((entry) => (
        <table key={entry.term} style={{ ...table, marginBottom: "8px" }}>
          <thead>
            <tr>
              <th style={th}>{TERM_LABELS[entry.term]}</th>
              {entry.domains.map((d) => (
                <th key={d.key} style={th}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>Score</td>
              {entry.domains.map((d) => (
                <td key={d.key} style={{ ...td, textAlign: "center" }}>
                  {d.score.toFixed(1)}/{d.maxScore.toFixed(1)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      ))}

      <h2 style={sectionTitle}>Record of Attendance</h2>
      {attendanceByTerm.map((entry) => (
        <table key={entry.term} style={table}>
          <thead>
            <tr>
              <th style={th}>Month ({TERM_LABELS[entry.term]})</th>
              <th style={th}>School Days</th>
              <th style={th}>Present</th>
              <th style={th}>Absent</th>
              <th style={th}>Tardy</th>
            </tr>
          </thead>
          <tbody>
            {entry.months.map((m) => (
              <tr key={m.month}>
                <td style={td}>{m.month}</td>
                <td style={{ ...td, textAlign: "center" }}>{m.schoolDays}</td>
                <td style={{ ...td, textAlign: "center" }}>{m.present}</td>
                <td style={{ ...td, textAlign: "center" }}>{m.absent}</td>
                <td style={{ ...td, textAlign: "center" }}>{m.tardy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <div style={{ marginTop: "48px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ borderTop: "1px solid #111", paddingTop: "4px" }}>{meta.classAdviser}</div>
          <p style={{ fontSize: "10px", margin: 0 }}>Class Adviser</p>
        </div>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ borderTop: "1px solid #111", paddingTop: "4px" }}>&nbsp;</div>
          <p style={{ fontSize: "10px", margin: 0 }}>Parent / Guardian Signature</p>
        </div>
      </div>
    </div>
  );
}

const cellLabel: React.CSSProperties = { padding: "4px 8px", fontWeight: 700, width: "20%" };
const cellValue: React.CSSProperties = { padding: "4px 8px", width: "30%" };
const sectionTitle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, marginTop: "20px", marginBottom: "6px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: React.CSSProperties = { border: "1px solid #111", padding: "5px 6px", fontSize: "11px", textAlign: "left" };
const td: React.CSSProperties = { border: "1px solid #111", padding: "5px 6px", fontSize: "11px" };