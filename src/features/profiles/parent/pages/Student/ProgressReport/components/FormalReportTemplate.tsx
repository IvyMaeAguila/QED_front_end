import type { ProgressReportData, Term } from "../types/types";
import { TERMS, TERM_LABELS, TERM_FILTER_LABELS } from "../types/types";
import DepEd from "../../../../../../../assets/images/DepEd.png";
import EUC from "../../../../../../../assets/images/EUC.webp";
import { EuroIcon } from "lucide-react";

interface FormalReportTemplateProps {
  data: ProgressReportData;
}

const PERIODIC_SCALE = [
  { range: "90 - 100", description: "Advancing", remark: "Passed", min: 90 },
  { range: "85 - 89", description: "Benchmarking", remark: "Passed", min: 85 },
  { range: "75 - 84", description: "Connecting", remark: "Failed", min: 75 },
  { range: "65 - 73", description: "Developing", remark: "Failed", min: 65 },
  { range: "0 - 64", description: "Emerging", remark: "Failed", min: 0 },
];

const HOLISTIC_SCALE = [
  { range: "4.5 - 5.0", description: "Advancing", remark: "Passed", min: 4.5 },
  {
    range: "3.5 - 4.4",
    description: "Benchmarking",
    remark: "Passed",
    min: 3.5,
  },
  { range: "2.5 - 3.4", description: "Connecting", remark: "Failed", min: 2.5 },
  { range: "1.5 - 2.4", description: "Developing", remark: "Failed", min: 1.5 },
  { range: "1.0 - 1.4", description: "Emerging", remark: "Failed", min: 1.0 },
];

function describePeriodic(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return { description: "—", remark: "—" };
  }
  return (
    PERIODIC_SCALE.find((s) => score >= s.min) ?? {
      description: "—",
      remark: "—",
    }
  );
}

function describeHolistic(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return { description: "—", remark: "—" };
  }
  return (
    HOLISTIC_SCALE.find((s) => score >= s.min) ?? {
      description: "—",
      remark: "—",
    }
  );
}

export function FormalReportTemplate({ data }: FormalReportTemplateProps) {
  const {
    meta,
    periodicRatings,
    termAverages,
    holisticAssessments,
    attendanceByTerm,
  } = data;

  // ---- Periodic general average ----
  const validTermAverages = termAverages.filter(
    (t) => t.average !== null && t.average !== undefined,
  ) as { term: Term; average: number; ratingLabel: string }[];
  const periodicOverallAvg =
    validTermAverages.length > 0
      ? validTermAverages.reduce((sum, t) => sum + t.average, 0) /
        validTermAverages.length
      : null;

  // ---- Holistic domains, normalized across terms ----
  const domainList =
    holisticAssessments[0]?.domains.map((d) => ({
      key: d.key,
      label: d.label,
    })) ?? [];

  const holisticRows = domainList.map((domain) => {
    const scoresByTerm = TERMS.map((t) => {
      const entry = holisticAssessments.find((h) => h.term === t);
      const d = entry?.domains.find((dd) => dd.key === domain.key);
      return d ? d.score : null;
    });
    const valid = scoresByTerm.filter((s): s is number => s !== null);
    const finalScore =
      valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    return { ...domain, scoresByTerm, finalScore };
  });

  const holisticGeneralAvgByTerm = TERMS.map((_, i) => {
    const scores = holisticRows
      .map((r) => r.scoresByTerm[i])
      .filter((s): s is number => s !== null);
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  });
  const holisticFinalScores = holisticRows
    .map((r) => r.finalScore)
    .filter((s): s is number => s !== null);
  const holisticOverallAvg =
    holisticFinalScores.length > 0
      ? holisticFinalScores.reduce((a, b) => a + b, 0) /
        holisticFinalScores.length
      : null;

  // ---- Attendance, combined across terms (no Tardy) ----
  const attendanceMetrics: {
    key: "schoolDays" | "present" | "absent";
    label: string;
  }[] = [
    { key: "schoolDays", label: "No. of Class Days" },
    { key: "present", label: "No. of Days Present" },
    { key: "absent", label: "No. of Days Absent" },
  ];

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
      {/* Header */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          paddingBottom: "10px",
          minHeight: "90px", // para may space para sa logos
        }}
      >
        <img
          src={DepEd}
          alt="DepEd Logo"
          style={{
            position: "absolute",
            left: "20px",
            top: "0",
            width: "80px",
            height: "80px",
            objectFit: "contain",
          }}
        />
        <img
          src={EUC}
          alt="School Logo"
          style={{
            position: "absolute",
            right: "20px",
            top: "0",
            width: "80px",
            height: "80px",
            objectFit: "contain",
          }}
        />

        <p style={{ margin: 0, fontSize: "11px" }}>
          Republic of the Philippines
        </p>
        <p style={{ margin: "2px 0", fontSize: "13px", fontWeight: 700 }}>
          DEPARTMENT OF EDUCATION
        </p>
        <p style={{ margin: 0, fontSize: "11px" }}>Region IV-A CALABARZON</p>
        <p style={{ margin: 0, fontSize: "11px" }}>Division of Quezon</p>
      </div>
      {/* Learner info — underlined lines, not a table */}
      <div
        style={{
          marginTop: "22px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            width: "62%",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Name:</span>
          <span
            style={{
              flex: 1,
              paddingBottom: "2px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {meta.learner}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            width: "34%",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Grade &amp; Section:</span>
          <span
            style={{
              flex: 1,
              paddingBottom: "2px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {meta.gradeSection}
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: "8px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            width: "62%",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Class Adviser:</span>
          <span
            style={{
              flex: 1,
              paddingBottom: "2px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {meta.classAdviser}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            width: "34%",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>School Year:</span>
          <span
            style={{
              flex: 1,
              paddingBottom: "2px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {meta.schoolYear}
          </span>
        </div>
      </div>

      {/* Dear parents note */}
      <div style={{ marginTop: "18px", fontSize: "11px", lineHeight: 1.5 }}>
        <p style={{ margin: "0 0 8px" }}>Dear Parents,</p>
        <p style={{ margin: "0 0 8px", textIndent: "24px" }}>
          This Performance Report shows the ability and progress your child has
          made in the different areas as well as his/her core values. The school
          welcomes you should you desire to know more about your child&apos;s
          progress.
        </p>
      </div>

      {/* Learning Progress and Achievement */}
      <h2 style={sectionTitle}>Learning Progress and Achievement</h2>
      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
          marginTop: "10px",
        }}
      >
        <div style={{ flex: "1 1 45%" }}>
          <table style={table}>
            <colgroup>
              <col style={{ width: "21%" }} />
              {TERMS.map((t) => (
                <col key={t} style={{ width: "6%" }} />
              ))}
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th} rowSpan={2}>
                  Learning Areas
                </th>
                {TERMS.map((t, i) => (
                  <th key={t} style={th}>
                    Term
                    <br />
                    {i + 1}
                  </th>
                ))}
                <th style={th} rowSpan={2}>
                  FINAL GRADE
                </th>
                <th style={th} rowSpan={2}>
                  REMARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {periodicRatings.map((row) => {
                const { remark } = describePeriodic(Number(row.finalRating));
                return (
                  <tr key={row.learningArea}>
                    <td style={td}>{row.learningArea}</td>
                    {TERMS.map((t) => (
                      <td key={t} style={{ ...td, textAlign: "center" }}>
                        {row.scores[t] ?? ""}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "center" }}>
                      {row.finalRating}
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>{remark}</td>
                  </tr>
                );
              })}
              <tr>
                <td
                  colSpan={TERMS.length + 1}
                  style={{ ...td, fontWeight: 700, textAlign: "right" }}
                >
                  General Average
                </td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                  {periodicOverallAvg !== null
                    ? periodicOverallAvg.toFixed(1)
                    : ""}
                </td>
                <td style={{ ...td, textAlign: "center" }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend — plain text list, not a bordered table */}
        <div style={{ flex: "1 1 35%", fontSize: "11px" }}>
          <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
            PERFORMANCE DESCRIPTORS
          </p>
          <div
            style={{ display: "flex", fontWeight: 700, marginBottom: "2px" }}
          >
            <span style={{ width: "40%", textAlign: "center" }}>GRADING SCALE</span>
            <span style={{ width: "40%", textAlign: "center" }}>DESCRIPTION</span>
            <span style={{ width: "20%", textAlign: "center" }}>REMARKS</span>
          </div>
          {PERIODIC_SCALE.map((s) => (
            <div key={s.range} style={{ display: "flex" }}>
              <span style={{ width: "40%", textAlign: "center" }}>{s.range}</span>
              <span style={{ width: "40%", textAlign: "center" }}>{s.description}</span>
              <span style={{ width: "20%", textAlign: "center" }}>{s.remark}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holistic Progress */}
      <h2 style={{ ...sectionTitle, marginTop: "30px" }}>Holistic Progress</h2>
      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
          marginTop: "10px",
        }}
      >
        <div style={{ flex: "1 1 55%" }}>
          <table style={table}>
            <colgroup>
              <col style={{ width: "36%" }} />
              {TERMS.map((t) => (
                <col key={t} style={{ width: "10%" }} />
              ))}
              <col style={{ width: "13%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th} rowSpan={2}>
                  Domain
                </th>
                {TERMS.map((t, i) => (
                  <th key={t} style={th}>
                    Term
                    <br />
                    {i + 1}
                  </th>
                ))}
                <th style={th} rowSpan={2}>
                  FINAL GRADE
                </th>
                <th style={th} rowSpan={2}>
                  REMARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {holisticRows.map((row) => {
                const { remark } = describeHolistic(row.finalScore);
                return (
                  <tr key={row.key}>
                    <td style={td}>{row.label}</td>
                    {row.scoresByTerm.map((s, i) => (
                      <td key={i} style={{ ...td, textAlign: "center" }}>
                        {s !== null ? s.toFixed(1) : ""}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "center" }}>
                      {row.finalScore !== null ? row.finalScore.toFixed(1) : ""}
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>{remark}</td>
                  </tr>
                );
              })}
              <tr>
                <td
                  colSpan={TERMS.length + 1}
                  style={{ ...td, fontWeight: 700, textAlign: "right", paddingRight: "10px"}}
                >
                  General Average
                </td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                  {holisticOverallAvg !== null
                    ? holisticOverallAvg.toFixed(1)
                    : ""}
                </td>
                <td style={{ ...td, textAlign: "center" }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend — plain text list, not a bordered table */}
        <div style={{ flex: "1 1 45%", fontSize: "11px" }}>
          <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
            PERFORMANCE DESCRIPTORS
          </p>
          <div
            style={{ display: "flex", fontWeight: 700, marginBottom: "2px" }}
          >
            <span style={{ width: "40%", textAlign: "center" }}>GRADING SCALE</span>
            <span style={{ width: "43%", textAlign: "center" }}>DESCRIPTION</span>
            <span style={{ width: "30%", textAlign: "center" }}>REMARKS</span>
          </div>
          {HOLISTIC_SCALE.map((s) => (
            <div key={s.range} style={{ display: "flex" }}>
              <span style={{ width: "40%", textAlign: "center" }}>{s.range}</span>
              <span style={{ width: "43%", textAlign: "center"}}>{s.description}</span>
              <span style={{ width: "30%", textAlign: "center" }}>{s.remark}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Record */}
      <h2 style={{ ...sectionTitle, marginTop: "30px" }}>Attendance Record</h2>

      {(() => {
        const totalMonthCols = attendanceByTerm.reduce(
          (sum, e) => sum + e.months.length,
          0,
        );
        const monthColWidthPct = 68 / totalMonthCols; // 68% ibinahagi sa lahat ng buwan
        // Month column = 22%, Total column = 10%, natitira (68%) ay ibinahagi sa lahat ng buwan pantay-pantay

        return (
          <table style={{ ...table, marginTop: "10px" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              {attendanceByTerm.flatMap((entry) =>
                entry.months.map((m) => (
                  <col
                    key={`${entry.term}-${m.month}`}
                    style={{ width: `${monthColWidthPct}%` }}
                  />
                )),
              )}
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={th} rowSpan={2}>
                  Month
                </th>
                {attendanceByTerm.map((entry) => (
                  <th key={entry.term} style={th} colSpan={entry.months.length}>
                    {TERM_FILTER_LABELS[entry.term]}
                  </th>
                ))}
                <th style={th} rowSpan={2}>
                  Total
                </th>
              </tr>
              <tr>
                {attendanceByTerm.map((entry) =>
                  entry.months.map((m) => (
                    <th key={`${entry.term}-${m.month}`} style={thSub}>
                      {m.month}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {attendanceMetrics.map((metric) => {
                const values = attendanceByTerm.flatMap((entry) =>
                  entry.months.map((m) => {
                    if (metric.key === "present") return m.present + m.tardy;
                    if (metric.key === "absent") return m.absent + m.excused;
                    return m[metric.key];
                  }),
                );
                const total = values.reduce((sum, v) => sum + (v ?? 0), 0);
                return (
                  <tr key={metric.key}>
                    <td style={{ ...td, fontWeight: 700 }}>{metric.label}</td>
                    {values.map((v, i) => (
                      <td key={i} style={{ ...td, textAlign: "center" }}>
                        {v ?? ""}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      })()}

      {/* Signatures
      <div
        style={{
          marginTop: "40px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ borderTop: "1px solid #111", paddingTop: "4px" }}>
            {meta.classAdviser}
          </div>
          <p style={{ fontSize: "10px", margin: 0 }}>Class Adviser</p>
        </div>
        <div style={{ textAlign: "center", width: "220px" }}>
          <div style={{ borderTop: "1px solid #111", paddingTop: "4px" }}>
            &nbsp;
          </div>
          <p style={{ fontSize: "10px", margin: 0 }}>
            Parent / Guardian Signature
          </p>
        </div>
      </div> */}
    </div>
  );
}

const circleBase: React.CSSProperties = {
  position: "absolute",
  top: "0px",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#3E6FC4",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "12.5px",
  fontWeight: 700,
  textAlign: "center",
  textTransform: "uppercase",
  marginTop: "22px",
  marginBottom: "0px",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed", // <-- importante
  borderTop: "1px solid #111",
  borderLeft: "1px solid #111",
};

const th: React.CSSProperties = {
  borderRight: "1px solid #111",
  borderBottom: "1px solid #111",
  padding: "4px 6px",
  fontSize: "10.5px",
  textAlign: "center",
  fontWeight: 700,
};

const thSub: React.CSSProperties = {
  borderRight: "1px solid #111",
  borderBottom: "1px solid #111",
  padding: "3px 4px",
  fontSize: "10px",
  fontWeight: 700,
  textAlign: "center",
};

const td: React.CSSProperties = {
  borderRight: "1px solid #111",
  borderBottom: "1px solid #111",
  padding: "4px 4px",        
  fontSize: "10px",         
  whiteSpace: "wrap",     
  // overflow: "hidden",
  // textOverflow: "ellipsis",
};
