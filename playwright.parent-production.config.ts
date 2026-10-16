import {defineConfig} from '@playwright/test';
import base from './playwright.acceptance-build.config';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const evidence=process.env.QED_PARENT_EVIDENCE_DIR??join(tmpdir(),'qed-parent-phase4-20261014');
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'**/parent-*.spec.ts','**/courseware-loading.spec.ts','**/pet-quiz-loading.spec.ts'],reporter:[['list'],['json',{outputFile:join(evidence,'full-production-results.json')}]]});
