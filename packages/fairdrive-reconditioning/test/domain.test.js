// Reconditioning: days, cost and the findings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRecon } from '../src/index.js';

const unit = (o = {}) => ({ stock_number: 'R1', acquired_date: '2026-11-01', ...o });
const ro = (o = {}) => ({ stock_number: 'R1', ro_number: 'RO1', opened: '2026-11-02', closed: '2026-11-04', total: '800', ...o });
const run = (u, r, o = {}) => checkRecon(u, r, { asOf: '2026-11-15', ...o });

test('days run to the front-line date when there is one, otherwise to as_of', () => {
  assert.equal(run([unit({ frontline_date: '2026-11-05' })], [ro()]).items.length, 0);
  assert.equal(run([unit()], [ro({ closed: '' })]).items[0].days, 14);
});

test('recon cost adds every repair order once, even when listed twice', () => {
  const r = run([unit({ frontline_date: '2026-11-05' })], [ro(), ro(), ro({ ro_number: 'RO2', total: '900' })]);
  assert.equal(r.recon_cost, 1700); assert.ok(r.items[0].findings.includes('over_budget'));
});

test('a unit off target with an open order is stuck; with no order at all it is waiting', () => {
  assert.deepEqual(run([unit()], [ro({ closed: '' })]).items[0].findings, ['stuck']);
  assert.deepEqual(run([unit()], []).items[0].findings, ['waiting_no_ro']);
});

test('front-line ready with an order still open is flagged, since cost may still come', () => {
  assert.ok(run([unit({ frontline_date: '2026-11-05' })], [ro({ closed: '' })]).items[0].findings.includes('open_ro_after_frontline'));
});

test('sold units are skipped; repair orders for unknown stock numbers are listed', () => {
  const r = run([unit({ status: 'Sold' })], [ro({ stock_number: 'R9' })]);
  assert.equal(r.units, 0); assert.equal(r.skipped_sold, 1); assert.equal(r.repair_orders_without_a_unit[0].stock_number, 'R9');
});

test('stock numbers match whatever their punctuation', () => {
  assert.equal(run([unit({ stock_number: 'r-1', frontline_date: '2026-11-03' })], [ro({ stock_number: 'R1' })]).recon_cost, 800);
});
