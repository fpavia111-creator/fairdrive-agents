// Curtailments: what a schedule asks for on a date, and what is overdue or coming due.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { position, scheduleCurtailments, DEFAULT_NEW, DEFAULT_USED } from '../src/index.js';

const u = (o = {}) => ({ vin: '0ZZ0TCCU5PA503360', floor_date: '2026-01-01', original_amount: '20000', balance: '20000', new_used: 'New', ...o });

test('nothing is due before the first step', () => {
  const p = position(u(), DEFAULT_NEW, '2026-03-01');
  assert.deepEqual([p.required_now, p.overdue, p.next_date, p.next_amount], [0, 0, '2026-04-02', 2000]);
});

test('each step adds its percent of the original amount; payments made count against it', () => {
  assert.equal(position(u(), DEFAULT_NEW, '2026-07-15').overdue, 4000);
  assert.equal(position(u({ balance: '17000' }), DEFAULT_NEW, '2026-07-15').overdue, 1000);
});

test('past the last step the whole balance is due, never more than the original', () => {
  const p = position(u({ balance: '16000' }), DEFAULT_NEW, '2027-02-01');
  assert.equal(p.required_now, 20000); assert.equal(p.overdue, 16000); assert.ok(p.past_last_step);
});

test('used units follow the used schedule', () => {
  assert.equal(scheduleCurtailments([u({ new_used: 'Used' })], { asOf: '2026-03-05' }).overdue_amount, 2000);
  assert.equal(scheduleCurtailments([u({ new_used: 'Used' })], { asOf: '2026-03-05', usedSchedule: [{ day: 90, pct: 10 }] }).overdue_amount, 0);
});

test('a curtailment due inside the horizon is listed with its date; outside it is not', () => {
  const r = scheduleCurtailments([u()], { asOf: '2026-03-25', weeks: 2 });
  assert.equal(r.items[0].due_date, '2026-04-02'); assert.equal(r.by_week[1].amount, 2000);
  assert.equal(scheduleCurtailments([u()], { asOf: '2026-03-01', weeks: 2 }).items.length, 0);
});

test('paying ahead of the schedule leaves nothing overdue and lowers the next amount', () => {
  const p = position(u({ balance: '17000' }), DEFAULT_NEW, '2026-05-01');
  assert.equal(p.overdue, 0); assert.equal(p.next_amount, 1000);
});

test('the same VIN listed twice is counted once', () => {
  assert.equal(scheduleCurtailments([u(), u()], { asOf: '2026-05-01' }).units, 1);
  assert.equal(DEFAULT_USED.at(-1).pct, 100);
});
