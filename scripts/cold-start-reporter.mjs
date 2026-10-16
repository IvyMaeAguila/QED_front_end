import fs from 'node:fs';
export default class Reporter {
  steps = [];
  onStepEnd(test, result, step) {
    if (step.category === 'pw:api' || step.category === 'expect') this.steps.push({ title: step.title, start: step.startTime.toISOString(), durationMs: step.duration, error: step.error?.message });
  }
  onTestEnd(test, result) {
    if (process.env.QED_COLD_RESULT) fs.writeFileSync(process.env.QED_COLD_RESULT, JSON.stringify({ title: test.title, status: result.status, durationMs: result.duration, steps: this.steps }, null, 2));
  }
}
