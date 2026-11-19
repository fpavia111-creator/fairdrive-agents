// Open repair orders: ages, buckets and each finding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOpenRos } from '../src/index.js';

const ro = (o = {}) => ({ ro_number: '1', opened: '2026-11-10', advisor: 'Lena', labor_type: 'Customer pay', total: '100', ...o });
const f = (o, s = {}) => (ageOpenRos([ro(o)], { asOf: '2026-11-15', ...s }).items[0] || { findings: [] }).findings;

test('a young order with nothing wrong is counted but not listed', () => {
  const r = ageOpenRos([ro()], { asOf: '2026-11-15' });
  assert.equal(r.open, 1); assert.equal(r.items.length, 0); assert.equal(r.by_age[0].repair_orders, 1);
});

test('past the promised date, and waiting on parts by flag or by status', () => {
  assert.deepEqual(f({ promised_date: '2026-11-12' }), ['past_promise']);
  assert.deepEqual(f({ parts_on_order: 'Y' }), ['waiting_parts']);
  assert.deepEqual(f({ status: 'Parts ordered' }), ['waiting_parts']);
});

test('warranty and internal orders have their own day limits', () => {
  assert.deepEqual(f({ labor_type: 'W', opened: '2026-10-01' }), ['warranty_open_long']);
  assert.deepEqual(f({ labor_type: 'Internal', opened: '2026-10-25' }), ['internal_open_long']);
  assert.deepEqual(f({ labor_type: 'Internal', opened: '2026-10-25' }, { internalDays: 30 }), []);
});

test('customer-pay orders open past the long days are flagged', () => {
  assert.deepEqual(f({ opened: '2026-10-01' }), ['open_long']);
});

test('totals by advisor and pay type add up every open order', () => {
  const r = ageOpenRos([ro(), ro({ ro_number: '2', advisor: 'Marco', labor_type: 'Warranty', total: '50' })], { asOf: '2026-11-15' });
  assert.equal(r.amount, 150); assert.equal(r.by_pay_type[1].amount, 50); assert.equal(r.by_advisor[0].advisor, 'Lena');
});

test('the same RO listed twice is counted once', () => {
  assert.equal(ageOpenRos([ro(), ro()], { asOf: '2026-11-15' }).open, 1);
});
