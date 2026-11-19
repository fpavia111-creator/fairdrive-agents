// Service contract remittances: matching and each finding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRemittances } from '../src/index.js';

const s = (o = {}) => ({ deal_number: 'D1', contract_number: 'SC-1', provider: 'Larkfield', sale_date: '2026-10-01', dealer_cost: '1000', ...o });
const r = (o = {}) => ({ contract_number: 'SC-1', provider: 'Larkfield', remit_date: '2026-10-10', amount: '1000', ...o });
const f = (a, b, o = {}) => checkRemittances(a, b, { asOf: '2026-11-15', ...o }).items.map((i) => i.finding);

test('a contract remitted in full and on time is clean', () => {
  assert.deepEqual(f([s()], [r()]), []);
});

test('a remittance with no contract number matches by deal and provider', () => {
  assert.deepEqual(f([s()], [r({ contract_number: '', deal_number: 'D1' })]), []);
  assert.deepEqual(f([s()], [r({ contract_number: '', deal_number: 'D1', provider: 'Other Co' })]).sort(), ['not_remitted_overdue', 'remittance_no_sale']);
});

test('not remitted: overdue after the days, due soon in the last week, quiet before', () => {
  assert.deepEqual(f([s()], []), ['not_remitted_overdue']);
  assert.deepEqual(f([s({ sale_date: '2026-10-20' })], []), ['due_soon']);
  assert.deepEqual(f([s({ sale_date: '2026-11-10' })], []), []);
});

test('short, over and twice', () => {
  assert.deepEqual(f([s()], [r({ amount: '900' })]), ['remitted_short']);
  assert.deepEqual(f([s()], [r({ amount: '1100' })]), ['remitted_over']);
  assert.deepEqual(f([s()], [r(), r()]), ['remitted_twice']);
});

test('remitted after the deadline is late, with the amount remitted', () => {
  const x = checkRemittances([s()], [r({ remit_date: '2026-11-05' })], { asOf: '2026-11-15' });
  assert.equal(x.items[0].finding, 'remitted_late'); assert.equal(x.items[0].remit_by, '2026-10-31');
});

test('the same contract sold twice in the file is counted once', () => {
  assert.equal(checkRemittances([s(), s()], [r()], { asOf: '2026-11-15' }).contracts, 1);
});
