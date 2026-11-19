// Customer deposits: each finding and what is left out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchDeposits } from '../src/index.js';

const p = (o = {}) => ({ receipt_number: 'R1', date: '2026-11-01', amount: '500', deal_number: 'D1', status: 'Held', ...o });
const d = (o = {}) => ({ deal_number: 'D1', status: 'Pending', ...o });
const f = (dep, deals, o = {}) => matchDeposits(dep, deals, { asOf: '2026-11-15', ...o }).items.map((i) => i.finding);

test('a deposit on a pending deal is held and not listed', () => {
  const r = matchDeposits([p()], [d()], { asOf: '2026-11-15' });
  assert.equal(r.held_amount, 500); assert.equal(r.items.length, 0);
});

test('a delivered deal with its deposit still held is not_applied', () => {
  assert.deepEqual(f([p()], [d({ status: 'Delivered' })]), ['not_applied']);
});

test('a dead deal makes the deposit due back, overdue after the refund days', () => {
  assert.deepEqual(f([p({ date: '2026-11-10' })], [d({ status: 'Dead' })]), ['refund_due']);
  assert.deepEqual(f([p()], [d({ status: 'Unwound' })]), ['refund_overdue']);
});

test('no deal after the held days, and a deal not in the file', () => {
  assert.deepEqual(f([p({ deal_number: '', date: '2026-10-01' })], []), ['held_no_deal']);
  assert.deepEqual(f([p({ deal_number: '', date: '2026-11-10' })], []), []);
  assert.deepEqual(f([p({ deal_number: 'D9' })], [d()]), ['applied_to_missing_deal']);
});

test('refunded and applied deposits are not held', () => {
  const r = matchDeposits([p({ status: 'Refunded' }), p({ receipt_number: 'R2', refunded_date: '2026-11-02' }), p({ receipt_number: 'R3', status: 'Applied' })], [d()], { asOf: '2026-11-15' });
  assert.equal(r.deposits, 3); assert.equal(r.held, 0);
});

test('deal numbers match without punctuation', () => {
  assert.deepEqual(f([p({ deal_number: 'd-1' })], [d({ status: 'Delivered' })]), ['not_applied']);
});
