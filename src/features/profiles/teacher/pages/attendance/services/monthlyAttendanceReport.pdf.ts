import { PDFDocument, PDFName, StandardFonts, TextAlignment } from 'pdf-lib';
import type { MonthlyAttendanceReport, ReportSignatories } from './monthlyAttendanceReport.service';

// The official vector form has 26 rows. Two are reserved for the sample-style
// rounded averages and monthly sums. No input is dropped if capacity changes.
export const REPORT_DAY_CAPACITY = 24;
export async function createMonthlyAttendancePdf(report: MonthlyAttendanceReport, signatories: ReportSignatories, templateBytes?: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if ((report.dropouts?.length ?? 0) > 9) throw new Error('The official template has space for nine dropout entries. This report exceeds capacity; no entries were exported.');
  if (report.days.length > REPORT_DAY_CAPACITY) throw new Error('This month exceeds the official template’s 24 daily rows. No records were exported.');
  let template = templateBytes;
  if (!template) {
    const response = await fetch(import.meta.env.BASE_URL + 'reports/monthly-attendance.pdf');
    if (!response.ok) throw new Error('The official report template could not be loaded.');
    template = await response.arrayBuffer();
  }
  const pdf = await PDFDocument.load(template);
  const form = pdf.getForm();
  const regular = await pdf.embedFont(StandardFonts.TimesRoman), bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  // Blank every unused form field, including the deferred movement lists.
  for (const field of form.getFields()) form.getTextField(field.getName()).setText('');
  function put(name: string, value: string | number | null, align = TextAlignment.Center, preferredSize = 10, heavy = false) {
    const field = form.getTextField(name), text = value === null ? '' : String(value).trim();
    const rect = field.acroField.getWidgets()[0].getRectangle();
    const font = heavy ? bold : regular;
    let size = Math.min(preferredSize, rect.height - 3);
    try {
      while (text && font.widthOfTextAtSize(text, size) > rect.width - 5 && size >= 6.5) size -= 0.25;
      if (size < 6.5 && text) throw new Error('length');
      field.setText(text); field.setAlignment(align); field.setFontSize(Math.max(6.5, size));
      field.updateAppearances(font);
    } catch {
      throw new Error('The value for ' + name.replaceAll('_', ' ') + ' is too long or contains unsupported characters. Shorten it or use supported characters before previewing.');
    }
  }
  const monthName = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(report.month + '-01T12:00:00Z'));
  put('Grade', report.gradeSection.replace(/^Grade\s+/i, ''), TextAlignment.Left, 11);
  put('Month', monthName.toUpperCase(), TextAlignment.Left, 11);
  put('School_Year', report.schoolYearLabel, TextAlignment.Left, 10);
  for (const period of ['Year', 'Month']) {
    const enrollment=period==='Year'?(report.annualEnrollment??report.enrollment):report.enrollment;
    put('Enrollment_' + period + '_Male', enrollment.male);
    put('Enrollment_' + period + '_Female', enrollment.female);
    put('Enrollment_' + period + '_Total', enrollment.total);
  }
  for (const gender of ['Male', 'Female', 'Total'] as const) put('Average_Daily_Attendance_' + gender, report.ada?.[gender.toLowerCase() as 'male' | 'female' | 'total'] ?? null, TextAlignment.Center, 9);
  put('Number_of_Days', report.numberOfDays, TextAlignment.Center, 9);
  const rowField = (row: number, suffix: string, value: string | number | null, size = 10) => put('Row_' + String(row).padStart(2, '0') + '_' + suffix, value, TextAlignment.Center, size);
  function enrollmentRow(row: number, enrollment=report.enrollment) {
    rowField(row, 'Enrollment_Male', enrollment.male); rowField(row, 'Enrollment_Female', enrollment.female); rowField(row, 'Enrollment_Total', enrollment.total);
  }
  function attendanceRow(row: number, male: number, female: number, parentheses = false) {
    // AM and PM repeat one daily mark; sums and ADA come from the source once.
    for (const session of ['Morning', 'Afternoon']) {
      rowField(row, session + '_Male', parentheses ? '(' + male + ')' : male);
      rowField(row, session + '_Female', parentheses ? '(' + female + ')' : female);
    }
  }
  report.days.forEach((day, index) => {
    const row = index + 1;
    rowField(row, 'Date', Number(day.date.slice(8))); enrollmentRow(row,day.enrollment??report.enrollment);
    attendanceRow(row, day.malePresent, day.femalePresent);
  });
  if (report.ada) {
    enrollmentRow(25);
    attendanceRow(25, report.ada.male, report.ada.female, true);
    attendanceRow(26, report.sums.male, report.sums.female);
  }
  function movementList(entries:{name:string;date:string}[],start:number,end:number,label:string){
  let dropoutRow=start;
  for (const entry of entries) {
    const width=form.getTextField('Row_'+String(start).padStart(2,'0')+'_Student_Name').acroField.getWidgets()[0].getRectangle().width-5;
    const lines:string[]=[];let line='';
    // Continue the complete name over spare rows in the official dropout block.
    // Never abbreviate a student name or silently overwrite the transfer block.
    for(const word of entry.name.trim().split(/\s+/)){
      if(line&&regular.widthOfTextAtSize(line+' '+word,8)<=width){line+=' '+word;continue;}
      if(line){lines.push(line);line='';}
      for(const character of word){if(line&&regular.widthOfTextAtSize(line+character,8)>width){lines.push(line);line='';}line+=character;}
    }
    if(line)lines.push(line);
    if(dropoutRow+lines.length-1>end)throw new Error('The complete '+label+' names exceed the official template capacity. No names were clipped or exported.');
    for(const [index,text] of lines.entries()){
      const prefix='Row_'+String(dropoutRow++).padStart(2,'0');
      put(prefix+'_Student_Name',text,TextAlignment.Left,8);
      if(index===0)put(prefix+'_Student_Date',entry.date,TextAlignment.Center,8);
    }
  }
  }
  movementList((report.dropouts??[]).map(e=>({name:e.name,date:e.effectiveDate})),1,9,'dropout');
  movementList((report.transferIns??[]).map(e=>({name:e.name,date:e.joinedDate})),21,26,'transfer-in');
  put('Adviser_Name_or_Signature', signatories.adviserName, TextAlignment.Center, 11);
  put('Adviser_Designation', signatories.adviserDesignation, TextAlignment.Left, 12);
  put('Principal_Name', signatories.principalName, TextAlignment.Left, 12, true);
  put('Principal_Designation', signatories.principalDesignation, TextAlignment.Left, 12);
  form.flatten();
  // MuPDF-created widgets have separate parent fields. Remove any dangling
  // annotation references after flattening; the export is intentionally static.
  for (const page of pdf.getPages()) page.node.delete(PDFName.of("Annots"));
  pdf.catalog.delete(PDFName.of("AcroForm"));
  pdf.setTitle('Monthly Attendance Report - ' + report.gradeSection + ' - ' + report.month);
  pdf.setSubject('Current advisory roster; weekday recorded dates; P/L present, A/E absent. AM and PM repeat daily attendance.');
  pdf.setProducer('QED Monthly Attendance Report');
  return pdf.save();
}
