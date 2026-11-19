// Commissions: plan arithmetic, minimums, splits and the paid comparison.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commissionFor, computeCommissions, sheetText } from '../src/index.js';

const plan = { salesperson: 'Aiden', front_pct: '25', back_pct: '5', mini: '150' };
const deal = (o = {}) => ({ deal_number: 'D1', salesperson: 'Aiden', front_gross: '2000', back_gross: '1000', ...o });

test('commission is front percent plus back percent, or the mini when that is larger', () => {
  assert.equal(commissionFor(deal(), plan), 550);
  assert.equal(commissionFor(deal({ front_gross: '100', back_gross: '0' }), plan), 150);
});

test('negative gross counts as zero, not as a deduction', () => {
  assert.equal(commissionFor(deal({ front_gross: '-500' }), plan), 150);
});

test('a split deal is shared equally, mini included', () => {
  const r = computeCommissions([deal({ split_with: 'Bianca' })], [plan, { salesperson: 'Bianca', front_pct: '20', mini: '200' }]);
  assert.deepEqual(r.lines.map((l) => l.commission), [275, 200]);
});

test('names match in any case and spacing; no plan is a finding, not a zero', () => {
  const r = computeCommissions([deal({ salesperson: 'aiden ' }), deal({ deal_number: 'D2', salesperson: 'Zed' })], [plan]);
  assert.equal(r.lines[0].commission, 550); assert.equal(r.no_plan, 1); assert.equal(r.lines[1].commission, null);
});

test('with a paid file: underpaid, overpaid and unpaid are told apart', () => {
  const r = computeCommissions([deal(), deal({ deal_number: 'D2' }), deal({ deal_number: 'D3' })], [plan], [{ salesperson: 'Aiden', deal_number: 'D1', amount_paid: '500' }, { salesperson: 'Aiden', deal_number: 'D2', amount_paid: '600' }]);
  assert.deepEqual(r.items.map((i) => i.finding), ['underpaid', 'overpaid', 'unpaid']);
});

test('the sheet totals the lines and marks a missing plan', () => {
  const s = sheetText([{ deal_number: 'D1', share: 1, front_gross: 1, back_gross: 1, commission: 100 }, { deal_number: 'D2', share: 1, front_gross: 1, back_gross: 1, commission: null }], { salesperson: 'Aiden' });
  assert.equal(s.total, 100); assert.match(s.text, /\[MISSING pay plan\]/);
});
