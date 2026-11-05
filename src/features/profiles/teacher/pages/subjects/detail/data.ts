export interface RosterStudent {
  withdrawalType?: "dropout" | "transfer" | null;
  dropoutEffectiveDate?: string | null;
  dropped?: boolean;
  notEnrolled?: boolean;
  joinedDate?: string | null;
  id: string;
  name: string;
  gender: "M" | "F";
}

export function normalizeRosterGender(gender: unknown): "M" | "F" | null {
  const value = String(gender ?? "").trim().toUpperCase();
  if (value === "M" || value === "MALE") return "M";
  if (value === "F" || value === "FEMALE") return "F";
  return null;
}

// A term is affected if it has not ended before the effective dropout date.
export function isDroppedForPeriod(student: Pick<RosterStudent, 'dropoutEffectiveDate'>, period?: {endDate?: string | null}): boolean {
  return !!student.dropoutEffectiveDate && !!period?.endDate && student.dropoutEffectiveDate <= period.endDate.slice(0,10);
}
export function isDroppedForWeek(student: Pick<RosterStudent, 'dropoutEffectiveDate'>, week: string): boolean {
  if (!student.dropoutEffectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(week)) return false;
  const end = new Date(week+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+4);
  return student.dropoutEffectiveDate <= end.toISOString().slice(0,10);
}

export function isNotEnrolledForPeriod(student: Pick<RosterStudent,'joinedDate'>,period?:{endDate?:string|null}):boolean {
 return !!student.joinedDate&&!!period?.endDate&&student.joinedDate>period.endDate.slice(0,10);
}
export function isNotEnrolledForWeek(student:Pick<RosterStudent,'joinedDate'>,week:string,period?:{endDate?:string|null}|null):boolean {
 if(!student.joinedDate||!/^\d{4}-\d{2}-\d{2}$/.test(week))return false;
 const end=new Date(week+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+4);const friday=end.toISOString().slice(0,10);return student.joinedDate>(period?.endDate&&period.endDate<friday?period.endDate:friday);
}
