
export type RiskLevel = "HIGH" | "MEDIUM" | "NONE";

export type ChartDomainKey = "cognitive" | "emotional" | "social" | "behavioral";

export type ScoreBand = 1 | 2 | 3 | 4 | 5;

export interface DomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

/** Everything the Whole-Child Snapshot card needs to render. */
export interface WholeChildSnapshotData {
  domainAverages: DomainAverages;
  evaluationCount: number;
  lastEvaluation: string | null;
  riskLevel: RiskLevel;
}

/** A single past evaluation period, for the "previous results" comparison view. */
export interface HistoryEntry {
  /** Short label for this period, e.g. "Week of Aug 17" or "Q1". */
  label: string;
  /** Optional exact date string, shown alongside the label. */
  date?: string;
  domainAverages: DomainAverages;
}

/** Latest score + week-over-week change for one domain. */
export interface DomainSummary {
  key: ChartDomainKey;
  /** Latest weekly average, 1.0–5.0, or null if no data yet. */
  latest: number | null;
}
 
/** Minimal theme shape this section needs — pass your existing AdminThemeContext values. */
export interface DataMeaningTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}
 