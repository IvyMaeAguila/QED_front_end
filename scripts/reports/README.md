# Monthly attendance template

The application serves public/reports/monthly-attendance.pdf, a vector copy of the supplied official single-page A4 portrait form. The user source PDF is never overwritten. The editor's preview and download share one generated Blob; no raster background is used.

## Template preparation

Run prepare_monthly_attendance.py with the original PDF path and a separate output path. It requires PyMuPDF and pypdf and deliberately removes only the fixed day numbers, sample principal name/designation, and adviser caption. It retains vector grid artwork, original headings, fonts, certification and footer, and adds text fields at the original locations. Redactions use no fill to retain all table rules.

## Explicit field mapping

- Grade / Month / School_Year: selected authorized class, reporting month, active school-year label.
- Enrollment_Year_{Male,Female,Total} and Enrollment_Month_{Male,Female,Total}: current advisory roster as of the selected month; transferees enter daily enrollment on their joining date, total = male + female.
- Average_Daily_Attendance_{Male,Female,Total}: once-daily sums divided by distinct recorded weekdays, rounded by gender, then added; blank for zero days.
- Number_of_Days: distinct weekday reporting dates.
- Row_01 through Row_24: Date (day of month), Enrollment_Male/Female/Total, Morning_Male/Female and Afternoon_Male/Female. AM and PM repeat daily P/L counts. Unused rows remain blank.
- Row_25: ADA label, current enrollment, and rounded gender ADA in parentheses in both session columns.
- Row_26: Sum label and once-daily gender sums repeated in both session columns. Summaries are blank for an empty report.
- Row_01 through Row_09 Student_Name/Student_Date contain active declarations effective in the selected month. Long names continue over spare dropout rows, with the date on the first line. Capacity errors block export without clipping. Row_21 through Row_26 Student_Name/Student_Date contain incoming transferees whose joining date falls in the selected month; complete names wrap within this block. The transfer-out block remains blank.
- Principal_Name / Principal_Designation and Adviser_Name_or_Signature / Adviser_Designation: session-only editor values, with verified profile defaults where available.

Every value is width-checked and scaled to fit its existing field. Unsupported characters, oversized text, or more than 24 daily rows cause an explicit error rather than clipping. The completed export is flattened and dangling widget annotations removed. Calculations and class/year/role authorization live in the backend monthlyAttendanceReport service/controller. Export reads the persisted declaration events but never changes source records; signatory edits remain session-only.

## Verification

- Backend: node --test test/monthlyAttendanceReport*.test.js (from thesis_qed).
- PDF: node --experimental-strip-types --test scripts/tests/monthly-attendance-pdf.test.mjs.
- Browser: npx playwright test tests/monthly-attendance-report.spec.ts tests/teacher-attendance-query.spec.ts. Set QED_ACCEPTANCE_STATIC=1 to avoid development watcher reloads during artifact generation.
- npm run build and targeted ESLint.

Populated and empty downloads were rendered with Poppler and visually inspected. Browser verification compares preview Blob bytes with downloaded PDF bytes. The current scope permits active-year adviser classes only. No historical-year authorization was added.
