import {test,expect} from '@playwright/test';
import {mergeScoreDraft,removeItemScores} from '../src/features/profiles/teacher/query/subjectScoreCache';
test('confirmed saves preserve unsaved students and explicit clearing',()=>{
 const previous={'1':{a:3},'2':{a:2}},draft={'1':{a:4},'2':{a:null}},confirmed={'1':{a:4},'2':{a:2},'3':{a:5}};
 expect(mergeScoreDraft(draft,previous,confirmed)).toEqual({'1':{a:4},'2':{a:null},'3':{a:5}});
 expect(previous['1'].a).toBe(3);
});
test('deleted item scores are removed without changing other assessment values',()=>{
 const original={'1':{a:3,b:4},'2':{a:null,b:0}};
 expect(removeItemScores(original,'a')).toEqual({'1':{b:4},'2':{b:0}});expect(original['1'].a).toBe(3);
});
