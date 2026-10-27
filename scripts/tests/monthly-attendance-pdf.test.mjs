import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { createMonthlyAttendancePdf } from '../../src/features/profiles/teacher/pages/attendance/services/monthlyAttendanceReport.pdf.ts';
const template=readFileSync(new URL('../../public/reports/monthly-attendance.pdf',import.meta.url));
const base={classId:'1',schoolYearId:'1',schoolYearLabel:'2026-2027',gradeSection:'Grade 1 - Maroon',month:'2026-10',months:['2026-10'],enrollment:{male:1,female:1,total:2},rosterCount:2,unknownGender:[],days:[],numberOfDays:0,sums:{male:0,female:0},ada:null,adviserName:'Teacher',principalName:'Principal',principalDesignation:'Principal',principalSource:'system'};
const names={adviserName:'Teacher Muñoz',adviserDesignation:'Adviser’s Signature over printed name',principalName:'Principal Example',principalDesignation:'Elementary Principal'};
test('empty and populated exports retain A4, vector page content and remove all form widgets',async()=>{
 for(const days of [[],[{date:'2026-10-01',malePresent:1,femalePresent:1,maleAbsent:0,femaleAbsent:0,unmarked:0}]]){
  const result=await createMonthlyAttendancePdf({...base,days,numberOfDays:days.length,ada:days.length?{male:1,female:1,total:2}:null},names,template);
  const pdf=await PDFDocument.load(result);assert.equal(pdf.getPages().length,1);assert.equal(pdf.getPage(0).getWidth(),595.32);assert.equal(pdf.getPage(0).getHeight(),841.92);assert.equal(pdf.getForm().getFields().length,0);assert.equal(pdf.getPage(0).node.Annots(),undefined);
 }
});
test('capacity overflow and oversized signatories fail explicitly instead of clipping',async()=>{
 await assert.rejects(createMonthlyAttendancePdf({...base,days:Array.from({length:25},()=>({date:'2026-10-01',malePresent:0,femalePresent:0}))},names,template),/exceeds/);
 await assert.rejects(createMonthlyAttendancePdf(base,{...names,principalName:'W'.repeat(160)},template),/too long/);
});
test('official template has an explicit field for every dynamic date and signatory',async()=>{
 const pdf=await PDFDocument.load(template),form=pdf.getForm();for(let row=1;row<=26;row++)assert.ok(form.getTextField('Row_'+String(row).padStart(2,'0')+'_Date'));
 for(const name of ['Grade','Month','School_Year','Principal_Name','Principal_Designation','Adviser_Name_or_Signature','Adviser_Designation'])assert.ok(form.getTextField(name));
});
