import { test, expect } from '@playwright/test';
import type { ExaminationAnalytics } from '../src/features/profiles/principal/pages/reports/services/reports.service';
import { examinationInsights, distributionDescription } from '../src/features/profiles/principal/pages/reports/utils/examinationInsights';

const row = (overrides: Partial<ExaminationAnalytics['rows'][number]> = {}): ExaminationAnalytics['rows'][number] => ({subjectId:1,subject:'Mathematics',examination:'ST1',students:10,count:10,mean:80,sd:10,...overrides});
function data(rows = [row()]): ExaminationAnalytics {
 const count=rows.reduce((sum,r)=>sum+r.count,0);
 return {schoolYear:'1',summary:{count,students:10,mean:80,sd:10},rows,distribution:[{interval:'80–<90%',count}],options:{years:[],terms:[],sections:[],subjects:[]}};
}
const text = (value: ExaminationAnalytics) => examinationInsights(value).map(i=>i.text).join(' ');
test('empty and singleton results do not produce performance conclusions',()=>{
 expect(examinationInsights(undefined)[0].text).toContain('Insufficient');
 expect(text(data([]))).toContain('Insufficient');
 expect(text(data([row({count:1,students:1,sd:0,mean:100})]))).toContain('Insufficient');
});
test('multiple records from one student are insufficient for student observations',()=>{
 const value=data();value.summary.students=1;expect(text(value)).toContain('Insufficient');
 expect(text(data([row({students:1})]))).toContain('Insufficient');
});
test('uniform scores mean identical results, not necessarily perfect scores',()=>{
 const value=data([row({mean:70,sd:0})]);
 expect(text(value)).toContain('All 10 recorded ST1 results');
 expect(text(value)).toContain('70.00%');
 expect(text(value)).not.toMatch(/perfect|100%|Suggested action/);
 expect(examinationInsights(value)).toHaveLength(1);
});
test('a rounded-to-zero SD is never described as exactly uniform',()=>{
 expect(text(data([row({sd:0.000001})]))).toContain('These recorded scores differ');
 expect(text(data([row({sd:0.000001})]))).not.toContain('same normalized score');
});
test('variation describes the sample without high/low labels and offers a review action',()=>{
 const insights=examinationInsights(data());
 expect(insights[0].text).toContain('10.00 percentage points');
 expect(insights[0].text).not.toMatch(/high variation|low variation|poor ability/);
 expect(insights.at(-1)?.kind).toBe('action');
 expect(insights.at(-1)?.text).toContain('Mathematics');
});
test('equal counts without verified cohorts never enable a comparison',()=>{
 expect(examinationInsights(data([row(),row({subjectId:2,subject:'Language',mean:90})])).some(i=>i.title==='Subject comparison')).toBe(false);
});
test('different verified cohorts never enable comparison',()=>{
 const value=data([row({comparisonCohort:1}),row({subjectId:2,comparisonCohort:2,mean:90})]);
 expect(examinationInsights(value).some(i=>i.title==='Subject comparison')).toBe(false);
});
test('matching recorded cohorts enable descriptive comparison and grounded action',()=>{
 const value=data([row({comparisonCohort:1}),row({subjectId:2,subject:'Language',comparisonCohort:1,mean:90,sd:5})]);
 const insights=examinationInsights(value);
 expect(insights[0].text).toContain('lower recorded average');
 expect(insights[0].text).toContain('greater score variation');
 expect(insights[0].text).toContain('assessments may differ');
 expect(insights.at(-1)?.text).toContain('Mathematics');
 expect(insights.length).toBeLessThanOrEqual(3);
});
test('different examinations and unequal record counts cannot be compared',()=>{
 for(const overrides of [{examination:'TE'},{count:9},{students:9}]) {
  const value=data([row({comparisonCohort:1}),row({subjectId:2,comparisonCohort:1,mean:90,...overrides})]);
  expect(examinationInsights(value).some(i=>i.title==='Subject comparison')).toBe(false);
 }
});
test('nonfinite, out-of-range, and missing statistics do not support conclusions',()=>{
 for(const overrides of [{mean:NaN},{mean:Infinity},{mean:101},{mean:-1},{sd:-1},{sd:NaN},{mean:null},{sd:null}]) expect(text(data([row(overrides)]))).toContain('Insufficient');
});
test('filter-specific inputs regenerate insights without retaining prior subjects',()=>{
 expect(text(data([row({subject:'Language'})]))).toContain('Language');
 expect(text(data([row({subject:'Science',mean:100,sd:0})]))).not.toContain('Language');
});
test('distribution majority requires more than half and consistent totals',()=>{
 const value=data();value.distribution=[{interval:'80–<90%',count:6},{interval:'90–100%',count:4}];
 expect(distributionDescription(value)).toContain('Most');
 value.distribution[0].count=5;value.distribution[1].count=5;expect(distributionDescription(value)).toBeNull();
 value.distribution[0].count=10;value.distribution[1].count=0;expect(distributionDescription(value)).toContain('All');
 value.distribution[0].count=11;expect(distributionDescription(value)).toBeNull();
 value.distribution[0].count=-1;expect(distributionDescription(value)).toBeNull();
});
test('no threshold or completeness claims are invented',()=>{
 expect(text(data())).not.toMatch(/below.*threshold|incomplete|complete records|passing/);
});

test('differences below displayed precision do not yield indistinguishable comparisons',()=>{
 const value=data([row({comparisonCohort:1,mean:80.001}),row({subjectId:2,comparisonCohort:1,mean:80.002})]);
 expect(examinationInsights(value).some(i=>i.title==='Subject comparison')).toBe(false);
});
