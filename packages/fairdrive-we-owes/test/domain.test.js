// We-owes: open, late, unscheduled and cost booking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkWeOwes } from '../src/index.js';

const w = (o = {}) => ({ deal_number: 'D1', delivery_date: '2026-11-01', item: 'Key fob', promised_date: '2026-11-30', estimated_cost: '100', ro_number: 'R1', ...o });
const f = (o, s = {}) => (checkWeOwes([w(o)], { asOf: '2026-11-15', ...s }).items[0] || { findings: [] }).findings;

test('an open we-owe with a future promise and an RO is open but not listed', () => {
  const r = checkWeOwes([w()], { asOf: '2026-11-15' });
  assert.equal(r.open, 1); assert.equal(r.items.length, 0); assert.equal(r.open_cost, 100);
});

test('past the promised date', () => {
  assert.deepEqual(f({ promised_date: '2026-11-10' }), ['past_promise']);
});

test('no repair order after the schedule days, and no promise date for too long', () => {
  assert.deepEqual(f({ ro_number: '' }), ['not_scheduled']);
  assert.deepEqual(f({ promised_date: '', delivery_date: '2026-09-01' }), ['open_long']);
});

test('completed with no cost booked is listed; with a cost it is closed', () => {
  assert.deepEqual(f({ completed_date: '2026-11-05' }), ['cost_not_booked']);
  assert.deepEqual(f({ completed_date: '2026-11-05', cost_booked: '80' }), []);
});

test('the same item on the same deal is counted once', () => {
  assert.equal(checkWeOwes([w(), w({ item: 'KEY FOB' })], { asOf: '2026-11-15' }).we_owes, 1);
});

test('open cost is bucketed by days since delivery', () => {
  const r = checkWeOwes([w(), w({ deal_number: 'D2', delivery_date: '2026-08-01' })], { asOf: '2026-11-15' });
  assert.deepEqual(r.open_by_age.map((b) => b.we_owes), [1, 0, 0, 1]);
});
