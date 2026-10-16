import {defineConfig} from '@playwright/test';
import acceptance from './playwright.acceptance.config';
export default defineConfig({...acceptance,testMatch:[
 '**/student-form-loading.spec.ts','**/admin-class-view.spec.ts','**/class-form-loading.spec.ts',
 '**/add-subject-loading.spec.ts','**/subject-edit-modal-loading.spec.ts','**/subject-template-loading.spec.ts',
 '**/calendar-loading.spec.ts','**/admin-dashboard-acceptance.spec.ts','**/admin-users-acceptance.spec.ts',
 '**/admin-remaining-*.spec.ts',
],reporter:[['list'],['json',{outputFile:'test-results/admin-focused-results.json'}]]});
