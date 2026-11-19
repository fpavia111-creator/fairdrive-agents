// OFAC and Red Flags records: presence, dates, co-buyers and recorded results.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRecords, checkKind } from '../src/index.js';

const d = (o = {}) => ({ deal_number: 'D1', customer: 'A Buyer', delivery_date: '2026-10-10', deal_type: 'Cash', ...o });
const c = (o = {}) => ({ deal_number: 'D1', check_type: 'OFAC', person: 'Buyer', check_date: '2026-10-09', result_recorded: 'yes', ...o });
const gaps = (deals, checks) => (checkRecords(deals, checks).items[0] || { gaps: [] }).gaps;

test('check types are read from the names tools use', () => {
  assert.deepEqual(['OFAC', 'SDN search', 'Red Flags Checklist', 'Identity verification', 'ID check', 'Privacy notice'].map(checkKind), ['ofac', 'ofac', 'red_flags', 'red_flags', 'red_flags', null]);
});

test('a cash deal with an OFAC record before delivery has no gap', () => {
  assert.deepEqual(gaps([d()], [c()]), []);
});

test('an OFAC record dated after delivery is a gap of its own; the same day is fine', () => {
  assert.deepEqual(gaps([d()], [c({ check_date: '2026-10-11' })]), ['ofac_after_delivery']);
  assert.deepEqual(gaps([d()], [c({ check_date: '2026-10-10' })]), []);
});

test('credit makes a Red Flags record required, by deal type or by the credit flag', () => {
  assert.deepEqual(gaps([d({ deal_type: 'Lease' })], [c()]), ['red_flags_missing']);
  assert.deepEqual(gaps([d({ credit_pulled: 'Y' })], [c()]), ['red_flags_missing']);
});

test('a co-buyer needs their own OFAC record', () => {
  assert.deepEqual(gaps([d({ co_buyer: 'C Buyer' })], [c()]), ['co_buyer_not_checked']);
  assert.deepEqual(gaps([d({ co_buyer: 'C Buyer' })], [c(), c({ person: 'Co-buyer' })]), []);
});

test('a record whose result was not recorded is a gap; unwound deals are skipped', () => {
  assert.deepEqual(gaps([d()], [c({ result_recorded: 'no' })]), ['result_not_recorded']);
  assert.equal(checkRecords([d({ status: 'Unwound' })], []).deals, 0);
});
