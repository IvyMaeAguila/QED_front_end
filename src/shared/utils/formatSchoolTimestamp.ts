// Submission timestamps carry an explicit offset; display the school's clock
// consistently even when the viewer's device uses another timezone.
export function formatSchoolTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-PH', {timeZone: 'Asia/Manila'});
}
