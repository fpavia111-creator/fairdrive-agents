// Floorplan audit: matching by VIN, what a sold unit still floored means, and the payoff list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditFloorplan, payoffText } from '../src/index.js';

const V1 = '7ZZCAEMU5PA994811', V2 = '7ZZPNMXP6RA120301';
const unit = (o = {}) => ({ stock_number: 'S1', vin: V1, status: 'In stock', ...o });
const stmt = (o = {}) => ({ vin: V1, floor_date: '2026-09-01', balance: '30000', ...o });

test('a unit in stock and on the statement with the same balance is not listed', () => {
  assert.equal(auditFloorplan([unit({ floorplan_balance: '30000' })], [stmt()], { asOf: '2026-11-15' }).items.length, 0);
});

test('a sold unit still floored past the payoff days is sold_not_paid_off; inside them it is payoff_due', () => {
  assert.equal(auditFloorplan([unit({ status: 'Sold', sold_date: '2026-11-01' })], [stmt()], { asOf: '2026-11-15' }).items[0].finding, 'sold_not_paid_off');
  assert.equal(auditFloorplan([unit({ status: 'Sold', sold_date: '2026-11-13' })], [stmt()], { asOf: '2026-11-15' }).items[0].finding, 'payoff_due');
});

test('a sold date alone marks a unit sold, whatever the status says', () => {
  assert.equal(auditFloorplan([unit({ sold_date: '2026-10-01' })], [stmt()], { asOf: '2026-11-15' }).sold_not_paid_off, 1);
});

test('VINs match in any case and spacing, and by the last eight characters', () => {
  assert.equal(auditFloorplan([unit({ vin: '7zz-caemu5pa994811' })], [stmt({ vin: 'PA994811' })], { asOf: '2026-11-15' }).floored_units, 1);
});

test('statement lines with no inventory unit and stock with no statement line are both listed', () => {
  const r = auditFloorplan([unit({ vin: V2 })], [stmt()], { asOf: '2026-11-15' });
  assert.deepEqual(r.items.map((i) => i.finding).sort(), ['not_floored', 'on_statement_not_in_inventory']);
});

test('a DMS balance different from the lender beyond the tolerance is a difference, signed DMS less lender', () => {
  const r = auditFloorplan([unit({ floorplan_balance: '29000' })], [stmt()], { asOf: '2026-11-15' });
  assert.equal(r.items[0].finding, 'balance_differs'); assert.equal(r.items[0].amount, -1000);
});

test('the payoff list totals sold units still floored and asks for the payoff quote', () => {
  const r = auditFloorplan([unit({ status: 'Sold', sold_date: '2026-11-01' }), unit({ stock_number: 'S2', vin: V2 })], [stmt(), stmt({ vin: V2, balance: '5000' })], { asOf: '2026-11-15' });
  const d = payoffText(r.items, { lender: 'Northgate' });
  assert.equal(d.total, 30000); assert.match(d.text, /\[CHECK each amount against the lender payoff quote/);
});
