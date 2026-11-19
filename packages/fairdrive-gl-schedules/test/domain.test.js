// GL schedules: tie-out, aging by control, zero controls and credits on receivables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageSchedules } from '../src/index.js';

const l = (o = {}) => ({ schedule: '230', control_number: 'C1', date: '2026-10-01', amount: '100', ...o });
const b = (o = {}) => ({ schedule: '230', schedule_name: 'Warranty receivable', gl_balance: '100', ...o });
const run = (d, g, o = {}) => ageSchedules(d, g, { asOf: '2026-11-15', ...o });

test('a schedule whose detail equals the ledger with young items has no findings', () => {
  assert.equal(run([l()], [b()]).items.length, 0);
});

test('detail different from the ledger is out of balance, signed detail less ledger', () => {
  const r = run([l()], [b({ gl_balance: '150' })]);
  assert.equal(r.items[0].finding, 'out_of_balance'); assert.equal(r.items[0].amount, -50);
});

test('a control is aged from its oldest line; past 90 days it is listed', () => {
  const r = run([l({ date: '2026-07-01' }), l({ date: '2026-11-01', amount: '50' })], [b({ gl_balance: '150' })]);
  assert.equal(r.items.find((i) => i.finding === 'over_90_days').age, 137);
});

test('lines that net to zero are a control ready to clear', () => {
  assert.equal(run([l(), l({ amount: '-100', date: '2026-11-01' })], [b({ gl_balance: '0' })]).zero_balance_controls, 1);
});

test('a credit on a receivable schedule is flagged; on another schedule it is not', () => {
  assert.equal(run([l({ amount: '-100' })], [b({ gl_balance: '-100' })]).credit_balances, 1);
  assert.equal(run([l({ amount: '-100' })], [b({ gl_balance: '-100', schedule_name: 'Customer deposits' })]).credit_balances, 0);
});

test('detail for a schedule with no ledger balance is reported', () => {
  assert.equal(run([l({ schedule: '999' })], [b()]).items.some((i) => i.finding === 'no_gl_balance'), true);
});
