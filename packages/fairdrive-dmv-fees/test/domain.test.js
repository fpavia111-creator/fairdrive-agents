// DMV fees: matching charges to deals and each finding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileFees } from '../src/index.js';

const V = '0ZZ5R6E04LA192725';
const d = (o = {}) => ({ deal_number: 'D1', vin: V, delivery_date: '2026-10-01', fees_collected: '300', ...o });
const c = (o = {}) => ({ deal_number: 'D1', charge_date: '2026-10-08', amount: '300', ...o });
const run = (x, y, o = {}) => reconcileFees(x, y, { asOf: '2026-11-15', ...o });

test('collected equal to charged is clean', () => {
  assert.equal(run([d()], [c()]).items.length, 0);
});

test('a charge with no deal number matches by the VIN tail, and several charges add up', () => {
  assert.equal(run([d()], [c({ deal_number: '', vin: 'LA192725', amount: '200' }), c({ deal_number: '', vin: V, amount: '100' })]).items.length, 0);
});

test('over- and under-collected are signed from the deal side', () => {
  assert.equal(run([d({ fees_collected: '350' })], [c()]).items[0].finding, 'overcollected');
  const u = run([d({ fees_collected: '250' })], [c()]);
  assert.equal(u.items[0].finding, 'undercollected'); assert.equal(u.undercollected_amount, 50);
});

test('no charge yet is flagged only after the paid days', () => {
  assert.equal(run([d({ delivery_date: '2026-11-01' })], []).not_paid_yet, 0);
  assert.equal(run([d()], []).not_paid_yet, 1);
});

test('a charge for an unknown deal and VIN is listed on its own', () => {
  assert.equal(run([d()], [c(), c({ deal_number: 'D9', vin: '0ZZ9U1LW0MA734429' })]).charges_without_deal, 1);
});

test('a deal listed twice is counted once', () => {
  assert.equal(run([d(), d()], [c()]).collected, 300);
});
