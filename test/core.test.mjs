import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as core from '../dist/core.js';

// Expected values were transcribed from the College Board source files in scripts/expected.py,
// never computed by the code under test.
const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const fns = {
  get_ap_score_distribution: core.getApScoreDistribution,
  estimate_ap_percentile: core.estimateApPercentile,
  compare_ap_exams: core.compareApExams,
  list_ap_exams: core.listApExams,
  estimate_ap_score_from_composite: core.estimateApScoreFromComposite,
};
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);

for (const fx of fixtures) {
  test(`fixture: ${fx.name}`, () => {
    const out = fns[fx.tool](fx.input);
    for (const [path, want] of Object.entries(fx.expect)) assert.deepEqual(get(out, path), want, `${fx.name} -> ${path}`);
    assert.ok(out.summary.length > 40);
    assert.match(out.more, /^https:\/\/examscorecalc\.com\/.*\?utm_source=mcp&utm_medium=ap-score-distributions-mcp$/);
    assert.equal(out.as_of, '2026-11-02');
    assert.match(out.source, /^https:\/\/(apcentral|apstudents|secure-media)\.collegeboard\.org\//);
  });
}

test('fixture count is at least 12', () => assert.ok(fixtures.length >= 12, String(fixtures.length)));

test('every 2024 and 2025 row is internally consistent', () => {
  for (const y of ['2024', '2025']) {
    for (const e of core.listApExams({ year: Number(y) }).exams) {
      const d = core.getApScoreDistribution({ exam: e.exam, year: Number(y) });
      const sum = ['5', '4', '3', '2', '1'].reduce((a, s) => a + d.counts[s], 0);
      assert.equal(sum, d.total_students, `${y} ${e.exam}`);
      assert.equal(d.counts['5'] + d.counts['4'] + d.counts['3'], d.three_plus.count, `${y} ${e.exam} 3+`);
    }
  }
});

test('every 2026 row sums to about 100', () => {
  const r = core.compareApExams({ year: 2026, limit: 60 });
  assert.equal(r.exams.length, 40);
  for (const e of r.exams) {
    const d = core.getApScoreDistribution({ exam: e.exam, year: 2026 });
    const s = Object.values(d.percents).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(s - 100) <= 2, `${e.exam} ${s}`);
  }
});

test('no invented cut scores', () => {
  assert.throws(() => core.estimateApScoreFromComposite({ exam: 'AP Chemistry', multiple_choice_correct: 30, free_response_points: [5] }), /never invented/);
  assert.throws(() => core.estimateApScoreFromComposite({ exam: 'world history', multiple_choice_correct: 30, free_response_points: [5] }), /never invented/);
  assert.throws(() => core.estimateApScoreFromComposite({ exam: 'AP Calculus AB', multiple_choice_correct: 46, free_response_points: [1, 1, 1, 1, 1, 1] }), /0 to 45/);
  assert.throws(() => core.estimateApScoreFromComposite({ exam: 'AP Calculus AB', multiple_choice_correct: 40, free_response_points: [1, 1] }), /needs 6/);
});

test('errors are InputError with clear text', () => {
  assert.throws(() => core.getApScoreDistribution({ exam: '' }), /required/);
  assert.throws(() => core.getApScoreDistribution({ exam: 'AP Biology', year: 2019 }), /year must be one of/);
  assert.throws(() => core.getApScoreDistribution({ exam: 'underwater basket weaving' }), /No AP exam matched/);
  assert.throws(() => core.estimateApPercentile({ exam: 'AP Biology', score: 6 }), /1 to 5/);
  assert.throws(() => core.compareApExams({ year: 2026, sort_by: 'mean' }), /not published 2026/);
});
