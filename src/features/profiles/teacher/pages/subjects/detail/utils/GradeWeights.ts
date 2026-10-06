// Pure grade-computation math per DepEd Order No. 015, s. 2026. These
// functions don't know or care where weights come from (uploaded
// template, admin-entered subject_weight_distribution, or a last-resort
// default) — that resolution now happens server-side via
// getEffectiveWeightsSafe. This file only turns raw scores + weights into
// PS / WS / Initial Grade numbers.

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
