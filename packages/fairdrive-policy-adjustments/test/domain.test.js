// Policy adjustments: each finding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPolicy } from '../src/index.js';

const a = (o = {}) => ({ ro_number: '1', date: '2026-10-01', advisor: 'Lena Moreau', vin: '7ZZ5R6E05LA192725', amount: '100', reason: 'Goodwill', approved_by: 'Dana Whitlock', ...o });
const f = (rows, o = {}) => checkPolicy(rows, o).items.map((i) => i.findings);

test('an approved, explained, small adjustment is not listed', () => {
  assert.deepEqual(f([a()]), []);
});

test('no approver, and approved by the advisor in any case', () => {
  assert.deepEqual(f([a({ approved_by: '' })]), [['no_approver']]);
  assert.deepEqual(f([a({ approved_by: 'lena  moreau' })]), [['self_approved']]);
});

test('over the review line and no reason', () => {
  assert.deepEqual(f([a({ amount: '300', reason: '' })]), [['large_adjustment', 'no_reason']]);
  assert.deepEqual(f([a({ amount: '300' })], { approvalLimit: 500 }), []);
});

test('a second adjustment on the same vehicle inside the window is a repeat', () => {
  assert.deepEqual(f([a(), a({ ro_number: '2', date: '2026-11-01' })]), [['repeat_vehicle']]);
  assert.deepEqual(f([a(), a({ ro_number: '2', date: '2026-11-01' })], { repeatDays: 20 }), []);
});

test('totals by advisor and by reason cover every adjustment', () => {
  const r = checkPolicy([a(), a({ ro_number: '2', advisor: 'Marco', amount: '50', vin: '' })]);
  assert.equal(r.amount, 150); assert.equal(r.by_reason[0].amount, 150); assert.equal(r.by_advisor.length, 2);
});

test('the same adjustment listed twice is counted once', () => {
  assert.equal(checkPolicy([a(), a()]).adjustments, 1);
});
