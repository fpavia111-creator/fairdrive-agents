// Loaner fleet: day and mile limits, near-limit warnings and agreements.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFleet } from '../src/index.js';

const u = (o = {}) => ({ stock_number: 'L1', use: 'Loaner', in_service_date: '2026-10-01', odometer: '1000', odometer_in_service: '0', ...o });
const a = (o = {}) => ({ stock_number: 'L1', out_date: '2026-11-10', ro_number: 'R1', customer: 'A Driver', ...o });
const f = (fleet, ag = [], o = {}) => (checkFleet(fleet, ag, { asOf: '2026-11-15', ...o }).items[0] || { findings: [] }).findings;

test('a young unit with few miles has no findings', () => {
  assert.deepEqual(f([u()]), []);
});

test('past the day or mile limit', () => {
  assert.deepEqual(f([u({ in_service_date: '2026-04-01' })]), ['over_days']);
  assert.deepEqual(f([u({ odometer: '7000' })]), ['over_miles']);
});

test('miles are counted from the odometer when put in service', () => {
  assert.deepEqual(f([u({ odometer: '7000', odometer_in_service: '2000' })]), ['near_limit']);
});

test('near a limit only when not already past one', () => {
  assert.deepEqual(f([u({ in_service_date: '2026-05-20' })]), ['near_limit']);
  assert.deepEqual(f([u({ in_service_date: '2026-04-01', odometer: '5000' })]), ['over_days']);
});

test('an open agreement with no RO, and one open past the days', () => {
  assert.deepEqual(f([u()], [a({ ro_number: '' })]), ['loaner_out_no_ro']);
  assert.deepEqual(f([u()], [a({ out_date: '2026-10-20' })]), ['agreement_open_long']);
  assert.deepEqual(f([u()], [a({ out_date: '2026-10-20', return_date: '2026-10-22' })]), []);
});

test('retailed units are skipped and counted', () => {
  const r = checkFleet([u({ status: 'Retailed' }), u({ stock_number: 'L2' })], [], { asOf: '2026-11-15' });
  assert.equal(r.units, 1); assert.equal(r.skipped_retailed, 1);
});
