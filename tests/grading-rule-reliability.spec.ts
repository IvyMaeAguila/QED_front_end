import { test, expect, type Page } from '@playwright/test';
import { mockTeacher } from './fixtures/teacher';

const validRules = { source: 'manual', ww: 37, pt: 43, exam: 20 };

async function fixture(page: Page) {
  (await mockTeacher(page, false))();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const state = { status: 200, data: validRules as unknown, calls: 0, ownAdvisory: true, writes: [] as unknown[], scores: {} as Record<string, Record<string, number>>, gate: Promise.resolve(), release: () => {} };
  await page.route('**/api/gradingPeriods', route => route.fulfill({ json: { success: true, data: [1, 2, 3].map(id => ({ id: String(id), schoolYearId: '2026', termNumber: id, termLabel: `Term ${id}`, isActive: id === 1 })) } }));
  await page.route('**/api/teacherGrading/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== 'GET') { const body = route.request().postDataJSON(); state.writes.push(body); if(path.endsWith('/scores'))state.scores[body.studentId] = { ...state.scores[body.studentId], [body.itemId]: body.value }; return route.fulfill({ json: { success: true, data: {} } }); }
    const data = path.endsWith('/items') ? [{ id: 'item1', tab: 'writtenWorks', date: '2026-10-01', activityName: 'Practice', topic: 'Numbers', format: 'Quiz', maxItems: 20, gradingPeriodId: '1' }]
      : path.endsWith('/scores') ? state.scores : path.endsWith('/holistic') ? {}
      : path.endsWith('/topics') ? [{ id: 'topic1', topicName: 'Numbers' }]
      : path.endsWith('/submission') ? { submitted: false, submittedAt: null, submissionVersion: null }
      : { subjectName: 'Mathematics', gradeLevel: 'Grade 1', roster: [{ id: '1', name: 'Synthetic Learner', gender: 'F' }], isOwnAdvisory: state.ownAdvisory, adviserName: 'Synthetic Teacher' };
    return route.fulfill({ json: { success: true, data } });
  });
  await page.route('**/api/subject/getEffectiveWeights/**', async route => {
    state.calls++; const status = state.status, data = state.data; await state.gate;
    return route.fulfill({ status, json: status === 200 ? { success: true, data } : { success: false, message: 'Synthetic rules unavailable' } });
  });
  return state;
}

async function openRecords(page: Page) {
  await page.addInitScript(() => history.replaceState({ usr: {
    queryOwner: { session: 1, role: 'TEACHER', user: '1' }, subjectName: 'Mathematics', subjectCategory: null, gradeLevel: 'Grade 1', tab: 'writtenWorks',
    roster: [], items: [], scores: {}, holistic: {}, terms: [1, 2, 3].map(id => ({ id: String(id), label: `Term ${id}`, termNumber: id })), selectedTerm: '1', isOwnAdvisory: true,
  }, key: 'f05-records', idx: 0 }, '', location.href));
  await page.goto('/teacher/subjects/1/records');
}

async function refreshRules(page: Page) {
  await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    await queryClient.invalidateQueries({ predicate: query => query.queryKey.includes('weights') && query.queryKey.at(-1) === '1' });
  });
}

test('F05: HTTP 500 is a query error rather than successful cached null', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/subject/getEffectiveWeights/**', route => route.fulfill({ status: 500, json: { success: false } }));
  await page.goto('/loading-harness.html');
  const result = await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
    const key = ['f05-before'];
    try { await queryClient.fetchQuery({ queryKey: key, retry: false, queryFn: async ({ signal }) => (await getEffectiveWeightsSafe(1, '1', { signal })) ?? null }); } catch { /* inspect the authoritative Query state below */ }
    const state = queryClient.getQueryState(key)!;
    return { status: state.status, data: state.data === undefined ? 'unset' : state.data };
  });
  expect(result).toEqual({ status: 'error', data: 'unset' });
});

test('F05: initial rule failure blocks score recording and explicit Retry recovers', async ({ page }) => {
  const state = await fixture(page); state.status = 500;
  await page.goto('/teacher/subjects/1');
  await expect(page.getByRole('alert').filter({ hasText: 'grading rules' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect(page.getByRole('spinbutton', { name: 'Synthetic Learner score for Practice, out of 20', exact: true })).toBeDisabled();
  expect(state.writes).toEqual([]);
  state.status = 200;
  await page.getByRole('alert').filter({ hasText: 'grading rules' }).getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  expect(state.writes).toEqual([]);
});

for (const scenario of [
  { name: 'manual subject weights', status: 200, body: { success: true, data: validRules }, result: validRules },
  { name: 'template and term metadata', status: 200, body: { success: true, data: { ...validRules, source: 'template', templateId: 19, templateChecksum: 'synthetic', examSubWeights: { st1: 20, st2: 30, te: 50 }, templateStructure: { ww: { domains: [] }, pt: { domains: [] }, termConfigurations: { '2': { examWeightPercent: 20 } } } } }, result: { ...validRules, source: 'template', templateId: 19, templateChecksum: 'synthetic', examSubWeights: { st1: 20, st2: 30, te: 50 }, templateStructure: { ww: { domains: [] }, pt: { domains: [] }, termConfigurations: { '2': { examWeightPercent: 20 } } } } },
  { name: 'explicit missing configuration', status: 200, body: { success: true, data: null }, result: null },
  ...[401, 403, 404, 500, 503].map(status => ({ name: `HTTP ${status}`, status, body: { success: false }, error: true })),
  { name: 'unsuccessful 200 envelope', status: 200, body: { success: false, data: null }, error: true },
  { name: 'missing data field', status: 200, body: { success: true }, error: true },
  { name: 'invalid numeric weights', status: 200, body: { success: true, data: { ...validRules, ww: '37' } }, error: true },
  { name: 'out-of-range weights', status: 200, body: { success: true, data: { ...validRules, ww: -1 } }, error: true },
  { name: 'non-JSON response', status: 200, text: '<html>unavailable</html>', contentType: 'text/html', error: true },
  { name: 'malformed JSON response', status: 200, text: '{', contentType: 'application/json', error: true },
] as Array<{ name: string; status: number; body?: unknown; text?: string; contentType?: string; result?: unknown; error?: boolean }>) {
  test(`F05 service/cache: ${scenario.name}`, async ({ page }) => {
    let calls = 0; const urls: string[] = [];
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('**/api/subject/getEffectiveWeights/**', route => {
      calls++; urls.push(route.request().url());
      return scenario.text !== undefined ? route.fulfill({ status: scenario.status, contentType: scenario.contentType, body: scenario.text }) : route.fulfill({ status: scenario.status, json: scenario.body });
    });
    await page.goto('/loading-harness.html?latency=60');
    const result = await page.evaluate(async () => {
      const { queryClient } = await import('/src/shared/query/queryClient.ts');
      const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
      let expirations = 0; const key = ['f05-contract'];
      try { await queryClient.fetchQuery({ queryKey: key, retry: false, queryFn: ({ signal }) => getEffectiveWeightsSafe(12, 'term & 2', { signal, onUnauthorized: () => expirations++ }) }); } catch { /* failures must remain errors, as asserted below */ }
      const state = queryClient.getQueryState(key)!;
      return { status: state.status, data: state.data === undefined ? 'unset' : state.data, expirations, errorStatus: (state.error as { status?: number } | null)?.status };
    });
    expect(result.status).toBe(scenario.error ? 'error' : 'success');
    expect(result.data).toEqual(scenario.error ? 'unset' : scenario.result);
    expect(result.expirations).toBe(scenario.status === 401 ? 1 : 0);
    if (scenario.status >= 400) expect(result.errorStatus).toBe(scenario.status);
    expect(calls).toBe(1);
    expect(new URL(urls[0]).pathname).toBe('/api/subject/getEffectiveWeights/12');
    expect(new URL(urls[0]).searchParams.get('gradingPeriodId')).toBe('term & 2');
  });
}

test('F05 service/cache: network rejection remains an error', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  let calls = 0; await page.route('**/api/subject/getEffectiveWeights/**', route => { calls++; return route.abort('internetdisconnected'); });
  await page.goto('/loading-harness.html?latency=60');
  const result = await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
    const key = ['f05-network'];
    try { await queryClient.fetchQuery({ queryKey: key, retry: false, queryFn: ({ signal }) => getEffectiveWeightsSafe(1, '1', { signal }) }); } catch { /* query state is the assertion subject */ }
    const state = queryClient.getQueryState(key)!;
    return { status: state.status, hasData: state.data !== undefined, errorName: state.error?.name };
  });
  expect(result).toEqual({ status: 'error', hasData: false, errorName: 'TypeError' }); expect(calls).toBe(1);
});

test('F05 service/cache: bounded read timeout fails without retry or cached absence', async ({ page }) => {
  await page.clock.install(); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  let calls = 0; await page.route('**/api/subject/getEffectiveWeights/**', () => { calls++; /* Deliberately leave this read unanswered until its AbortSignal fires. */ });
  await page.goto('/loading-harness.html?latency=60');
  await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
    (window as unknown as { f05Done: Promise<unknown> }).f05Done = queryClient.fetchQuery({ queryKey: ['f05-timeout'], retry: false, queryFn: ({ signal }) => getEffectiveWeightsSafe(1, '1', { signal }) }).then(() => ({ resolved: true }), error => ({ name: error.name }));
  });
  await expect.poll(() => calls).toBe(1); await page.clock.fastForward(15_001);
  const result = await page.evaluate(async () => {
    const outcome = await (window as unknown as { f05Done: Promise<unknown> }).f05Done;
    const { queryClient } = await import('/src/shared/query/queryClient.ts'); const state = queryClient.getQueryState(['f05-timeout'])!;
    return { outcome, status: state.status, hasData: state.data !== undefined };
  });
  expect(result).toEqual({ outcome: { name: 'TimeoutError' }, status: 'error', hasData: false }); expect(calls).toBe(1);
});

test('F05 service: caller cancellation remains a rejected read', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort()); await page.goto('/loading-harness.html?latency=60');
  const result = await page.evaluate(async () => {
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
    const controller = new AbortController(); controller.abort();
    try { await getEffectiveWeightsSafe(1, '1', { signal: controller.signal }); return 'resolved'; } catch (error) { return (error as Error).name; }
  });
  expect(result).toBe('AbortError');
});

test('F05 cache: failed refresh preserves valid weights; explicit retry replaces them only with verified data', async ({ page }) => {
  let status = 200, calls = 0;
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/subject/getEffectiveWeights/**', route => { calls++; return route.fulfill({ status, json: status === 200 ? { success: true, data: validRules } : { success: false } }); });
  await page.goto('/loading-harness.html?latency=60');
  const load = () => page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts'); const key = ['f05-refresh'];
    try { await queryClient.fetchQuery({ queryKey: key, staleTime: 0, retry: false, queryFn: ({ signal }) => getEffectiveWeightsSafe(1, '1', { signal }) }); } catch { /* inspect cache after rejection */ }
    const state = queryClient.getQueryState(key)!; return { status: state.status, data: state.data, updatedAt: state.dataUpdatedAt, hasError: !!state.error };
  });
  const first = await load(); expect(first.status).toBe('success'); expect(first.data).toEqual(validRules);
  status = 503; const failed = await load(); expect(failed).toEqual({ ...first, status: 'error', hasError: true }); expect(calls).toBe(2);
  status = 200; const recovered = await load(); expect(recovered.status).toBe('success'); expect(recovered.data).toEqual(validRules); expect(recovered.hasError).toBe(false); expect(calls).toBe(3);
});

test('F05 UI: pending verification blocks grading until its successful response', async ({ page }) => {
  const state = await fixture(page); state.gate = new Promise(resolve => { state.release = resolve; });
  await page.goto('/teacher/subjects/1');
  await expect.poll(() => state.calls).toBe(1);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  expect(state.writes).toEqual([]); state.release();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled(); expect(state.writes).toEqual([]);
});

for (const status of [503, 403]) test(`F05 UI: ${status} rule failure stays recoverable without signing out`, async ({ page }) => {
  const state = await fixture(page); state.status = status;
  await page.goto('/teacher/subjects/1');
  await expect(page.getByRole('alert').filter({ hasText: 'grading rules' })).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/subjects\/1$/); expect(state.writes).toEqual([]);
  state.status = 200; await page.getByRole('alert').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled(); expect(state.writes).toEqual([]);
});

test('F05 UI: rule 401 expires the session and exposes no score controls', async ({ page }) => {
  const state = await fixture(page); state.status = 401;
  await page.goto('/teacher/subjects/1'); await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0); expect(state.writes).toEqual([]);
});

test('F05 UI: configured absence is distinct from failure and blocks grading', async ({ page }) => {
  const state = await fixture(page); state.data = null;
  await page.goto('/teacher/subjects/1');
  await expect(page.getByRole('alert')).toContainText('No grading rules are configured');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled(); expect(state.writes).toEqual([]);
});

test('F05 UI: failed background refresh retains the score draft and requires explicit recovery before saving', async ({ page }) => {
  const state = await fixture(page); await page.goto('/teacher/subjects/1');
  const input = page.getByRole('spinbutton', { name: 'Synthetic Learner score for Practice, out of 20', exact: true });
  await expect(input).toBeEnabled(); await input.fill('17'); state.status = 503;
  await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    await queryClient.invalidateQueries({ predicate: query => query.queryKey.includes('weights') });
  });
  await expect(page.getByRole('alert').filter({ hasText: 'grading rules' })).toBeVisible();
  await expect(input).toBeDisabled(); await expect(input).toHaveValue('17'); expect(state.writes).toEqual([]);
  const cached = await page.evaluate(async () => { const { queryClient } = await import('/src/shared/query/queryClient.ts'); const matches = queryClient.getQueryCache().findAll().filter(query => query.queryKey.slice(-5).join('|') === 'subject|2026|1|weights|1'); const query = matches[0]; return { matches: matches.length, status: query?.state.status, data: query?.state.data }; });
  expect(cached).toEqual({ matches: 1, status: 'error', data: validRules });
  state.status = 200; await page.getByRole('alert').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(input).toBeEnabled(); await expect(input).toHaveValue('17'); expect(state.writes).toEqual([]);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes).toEqual([{ studentId: '1', itemId: 'item1', value: 17, expectedValue: null }]);
});

for (const status of [500, 503, 403, 404]) test(`F05 records: ${status} blocks calculations and editing until read recovery`, async ({ page }) => {
  const state = await fixture(page); state.status = status; await openRecords(page);
  await expect(page.getByRole('alert').filter({ hasText: 'grading rules' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-sk-region="subject-record-student"]')).toHaveCount(0); expect(state.writes).toEqual([]);
  state.status = 200; await page.getByRole('alert').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toBeEnabled();
  await expect(page.getByRole('columnheader').filter({ hasText: '37%' }).first()).toBeVisible(); expect(state.writes).toEqual([]);
});

test('F05 records: explicit absent configuration displays guidance without default weights', async ({ page }) => {
  const state = await fixture(page); state.data = null; await openRecords(page);
  await expect(page.getByRole('alert')).toContainText('No grading rules are configured');
  await expect(page.locator('[data-sk-region="subject-record-student"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toHaveCount(0); expect(state.writes).toEqual([]);
});

test('F05 records: failed refresh preserves editing values and verified retry applies the subject weights without replay', async ({ page }) => {
  const state = await fixture(page); state.scores = { '1': { item1: 9 } }; await openRecords(page);
  await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Edit Records', exact: true }).click();
  const input = page.getByRole('spinbutton').first(); await expect(input).toHaveValue('9');
  state.status = 503; await refreshRules(page);
  await expect(page.getByRole('alert')).toContainText('grading rules');
  await expect(input).toBeDisabled(); await expect(input).toHaveValue('9');
  await expect(page.getByRole('columnheader').filter({ hasText: '37%' }).first()).toBeVisible(); expect(state.writes).toEqual([]);
  state.status = 200; state.data = { source: 'manual', ww: 20, pt: 60, exam: 20 };
  await page.getByRole('alert').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(input).toBeEnabled(); await expect(input).toHaveValue('9');
  await expect(page.getByRole('columnheader').filter({ hasText: '60%' }).first()).toBeVisible();
  await expect(page.getByRole('columnheader').filter({ hasText: '37%' })).toHaveCount(0); expect(state.writes).toEqual([]);
});

test('F05 final grades: rule error is recoverable and never presented as successful blanks', async ({ page }) => {
  const state = await fixture(page); state.status = 500; await openRecords(page);
  await page.getByRole('button', { name: 'Final Grades', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Final Grades', exact: true });
  await expect(summary.getByRole('alert')).toContainText('rules');
  await expect(summary.getByRole('button', { name: 'Export Final Grades', exact: true })).toBeDisabled();
  await expect(summary.locator('tbody')).toHaveCount(0); expect(state.writes).toEqual([]);
  state.status = 200; await summary.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(summary.getByRole('alert')).toHaveCount(0); await expect(summary.locator('tbody')).toBeVisible(); expect(state.writes).toEqual([]);
});

test('F05 final grades: configured absence is explicit and disables official export', async ({ page }) => {
  const state = await fixture(page); state.data = null; await openRecords(page);
  await page.getByRole('button', { name: 'Final Grades', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Final Grades', exact: true });
  await expect(summary.getByRole('status')).toContainText('No grading rules are configured');
  await expect(summary.getByRole('button', { name: 'Export Final Grades', exact: true })).toBeDisabled(); expect(state.writes).toEqual([]);
});

test('F05 submission: a confirmation opened before rule failure cannot submit through its portal', async ({ page }) => {
  const state = await fixture(page); state.ownAdvisory = false; state.scores = { '1': { item1: 20 } };
  state.data = { source: 'template', ww: 100, pt: 0, exam: 0, templateId: 1, templateStructure: { ww: { domains: [] }, pt: { domains: [] }, examinations: { enabled: false, components: [] }, transmutationTable: [{ igMin: 0, igMax: 100, transmuted: 95 }], descriptorTable: [] } };
  await openRecords(page);
  await expect(page.getByRole('button', { name: 'Submit Grades', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Submit Grades', exact: true }).click();
  const dialog = page.getByRole('alertdialog'); await expect(dialog).toContainText('Confirm Submission');
  state.status = 503; await refreshRules(page);
  await expect(dialog.getByRole('button', { name: 'Confirm & Submit', exact: true })).toBeDisabled(); expect(state.writes).toEqual([]);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(state.writes).toEqual([]);
});

test('F05 UI: network read failure has explicit Retry and sends no academic mutation', async ({ page }) => {
  const state = await fixture(page);
  await page.route('**/api/subject/getEffectiveWeights/**', route => route.abort('internetdisconnected'));
  await page.goto('/teacher/subjects/1');
  await expect(page.getByRole('alert').filter({ hasText: 'grading rules' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled(); expect(state.writes).toEqual([]);
  await page.unroute('**/api/subject/getEffectiveWeights/**');
  await page.route('**/api/subject/getEffectiveWeights/**', route => route.fulfill({ json: { success: true, data: validRules } }));
  await page.getByRole('alert').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled(); expect(state.writes).toEqual([]);
});

test('F05 cache: subject and period keys preserve distinct configured weights', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/subject/getEffectiveWeights/**', route => {
    const url = new URL(route.request().url()), subject = url.pathname.split('/').at(-1), period = url.searchParams.get('gradingPeriodId');
    return route.fulfill({ json: { success: true, data: { source: 'manual', ww: subject === '1' ? 20 : 40, pt: period === '1' ? 60 : 40, exam: 20 } } });
  });
  await page.goto('/loading-harness.html?latency=60');
  const result = await page.evaluate(async () => {
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    const { subjectKey } = await import('/src/features/profiles/teacher/query/teacherSubjectKeys.ts');
    const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
    return Promise.all([['1', '1'], ['2', '2']].map(([subject, period]) => queryClient.fetchQuery({ queryKey: subjectKey('2026', subject, 'weights', period), queryFn: ({ signal }) => getEffectiveWeightsSafe(Number(subject), period, { signal }) })));
  });
  expect(result).toEqual([{ source: 'manual', ww: 20, pt: 60, exam: 20 }, { source: 'manual', ww: 40, pt: 40, exam: 20 }]);
});
