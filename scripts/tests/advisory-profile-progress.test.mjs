import test from 'node:test';
import assert from 'node:assert/strict';
import {progressMonthOptions,studentAttendanceProgress,studentHolisticSnapshot} from '../../src/features/profiles/teacher/pages/roster/components/advisoryProgressData.ts';
const terms=[{startDate:'2026-10-02',endDate:'2026-12-15'},{startDate:'2026-12-16',endDate:'2027-01-31'}];
test('months are distinct, ordered and cross calendar years',()=>{
 assert.deepEqual(progressMonthOptions(terms).map(m=>m.key),['2026-10','2026-11','2026-12','2027-01']);
 assert.deepEqual(progressMonthOptions([]),[]);
});
test('attendance selects the student and term dates; missing marks are not absences',()=>{
 const result=studentAttendanceProgress({'1':{'2026-10-01':'A','2026-10-02':'P','2026-10-03':'L','2026-10-04':'E','2026-11-01':'A'},'2':{'2026-10-02':'A','2026-10-05':'P'}},'1','2026-10',terms);
 assert.deepEqual(result,{schoolDays:4,statusSummary:{present:1,absent:0,late:1,excused:1},unmarked:1});
});
test('empty attendance has no fabricated recorded days',()=>{
 assert.deepEqual(studentAttendanceProgress({},'1','2026-10',terms),{schoolDays:0,statusSummary:{present:0,absent:0,late:0,excused:0},unmarked:0});
});
test('holistic average excludes unevaluated domains and preserves no-data state',()=>{
 const profile={overall:{domainAverages:{cognitive:5,emotional:4,behavioral:null,social:null}}};
 assert.equal(studentHolisticSnapshot(profile,'Term 1').compositeScore,4.5);
 assert.equal(studentHolisticSnapshot({overall:{domainAverages:{cognitive:null,emotional:null,behavioral:null,social:null}}},'Term 1').compositeScore,null);
 assert.equal(studentHolisticSnapshot(undefined,'Term 1'),null);
});
