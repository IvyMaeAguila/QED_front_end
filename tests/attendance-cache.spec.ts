import {test,expect} from '@playwright/test';
import {QueryClient} from '@tanstack/react-query';
import {confirmAttendance} from '../src/features/profiles/teacher/query/attendanceCache';
test('confirmed individual and bulk marks update matching caches without leaking across class, term or session',()=>{
 const c=new QueryClient(),scope=['teacher','user-1'];
 const key=(cls='1',term='1',all=false)=>[...scope,'attendance',cls,term,all];
 for(const k of [key(),key('1','active'),key('1','active',true),key('1','2'),key('2'),['teacher','user-2','attendance','1','1',false]])c.setQueryData(k,{data:{'1':{'2026-10-27':'A'}},termId:k[4]==='2'?'2':'1',presentTotals:{'1':0}});
 confirmAttendance(c,scope,'1',['1','2'],'2026-10-27','P','1');
 for(const k of [key(),key('1','active'),key('1','active',true)])expect(c.getQueryData(k)).toMatchObject({data:{'1':{'2026-10-27':'P'},'2':{'2026-10-27':'P'}},presentTotals:{'1':1,'2':1}});
 for(const k of [key('1','2'),key('2'),['teacher','user-2','attendance','1','1',false]])expect(c.getQueryData(k)).toMatchObject({data:{'1':{'2026-10-27':'A'}}});
 confirmAttendance(c,scope,'1',['1'],'2026-10-27',null,'1');
 expect(c.getQueryData(key())).toMatchObject({data:{'1':{'2026-10-27':null}},presentTotals:{'1':0}});
 c.clear();
});
