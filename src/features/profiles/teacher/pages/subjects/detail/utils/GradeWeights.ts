// Pure grade-computation math per DepEd Order No. 015, s. 2026. These
// functions don't know or care where weights come from (uploaded
// template, admin-entered subject_weight_distribution, or a last-resort
// default) — that resolution now happens server-side via
// getEffectiveWeightsSafe. This file only turns raw scores + weights into
// PS / WS / Initial Grade numbers.

export interface ExamSubWeights {
  st1: number;
  st2: number;
  te: number;
}

// PS = (raw score / highest possible score) * 100
export function computePS(total: number, highestPossible: number): number | null {
  if (!highestPossible) return null;
  return (total / highestPossible) * 100;
}

// WS = PS * component weight%
export function computeWS(ps: number | null, weight: number): number | null {
  if (ps === null) return null;
  return (ps * weight) / 100;
}

// Initial Grade is the weighted score sum before applying the uploaded
// template's transmutation table. The transmuted Term Grade is the official
// reported grade wherever the approved template provides that table.
export function computeInitialGrade(
  ws1: number | null,
  ws2: number | null,
  ws3: number | null,
): number | null {
  const scores = [ws1, ws2, ws3].filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0);
}

/**
 * Combines ST1/ST2/TE percentage scores into one overall Exam PS, using
 * each sub-type's own weight (e.g. 30/30/40) rather than pooling all exam
 * items into one Total/highestPossible. Requires a PS for every sub-type —
 * returns null if any sub-type has no items or isn't fully scorable yet,
 * matching how computePS already returns null on a missing denominator.
 */
export function computeExamPS(
  totalsByType: Partial<Record<"ST1" | "ST2" | "TE", { total: number; highestPossible: number }>>,
  subWeights: ExamSubWeights,
): number | null {
  const types: ("ST1" | "ST2" | "TE")[] = ["ST1", "ST2", "TE"];
  const subWeightMap = { ST1: subWeights.st1, ST2: subWeights.st2, TE: subWeights.te };

  let combined = 0;
  for (const t of types) {
    const data = totalsByType[t];
    if (!data || !data.highestPossible) return null;
    const ps = computePS(data.total, data.highestPossible);
    if (ps === null) return null;
    combined += (ps * subWeightMap[t]) / 100;
  }
  return combined;
}

export interface TemplateTransmutationRow {
  igMin: number;
  igMax: number;
  transmuted: number;
}

export function computeTransmutedGrade(
  initialGrade: number | null,
  table: TemplateTransmutationRow[] | undefined,
): number | null {
  if (initialGrade === null || !table?.length) return null;
  const row = table.find((entry) => initialGrade >= entry.igMin && initialGrade <= entry.igMax);
  return row?.transmuted ?? null;
}
