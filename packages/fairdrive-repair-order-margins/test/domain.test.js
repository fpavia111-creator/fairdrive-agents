// Repair order margins: pay types, floors and below-cost parts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkMargins, payType } from '../src/index.js';

const l = (o = {}) => ({ ro_number: 'R1', advisor: 'Lena', labor_type: 'CP', labor_sale: '500', labor_cost: '150', parts_sale: '400', parts_cost: '240', ...o });

test('pay types are read from the words shops use', () => {
  assert.deepEqual(['Customer pay', 'C', 'W', 'Warranty', 'Internal', 'I', 'Policy'].map(payType), ['customer_pay', 'customer_pay', 'warranty', 'warranty', 'internal', 'internal', 'internal']);
});

test('a healthy customer-pay order is not listed', () => {
  assert.equal(checkMargins([l()]).items.length, 0);
});

test('lines of one order are added up before the floors are applied', () => {
  const r = checkMargins([l({ labor_sale: '100', labor_cost: '60' }), l({ labor_sale: '400', labor_cost: '90' })]);
  assert.equal(r.items.length, 0); assert.equal(r.by_pay_type[0].labor_gp_pct, 70);
});

test('floors apply to customer pay only; warranty and internal are not judged against them', () => {
  assert.equal(checkMargins([l({ labor_type: 'Warranty', labor_sale: '300', labor_cost: '200' })]).items.length, 0);
  assert.equal(checkMargins([l({ labor_sale: '300', labor_cost: '200' })]).labor_below_floor, 1);
});

test('parts below cost are flagged on any pay type', () => {
  assert.equal(checkMargins([l({ labor_type: 'Internal', parts_sale: '90', parts_cost: '110' })]).parts_below_cost, 1);
});

test('customer-pay labor cost with no labor sold is given away', () => {
  assert.deepEqual(checkMargins([l({ labor_sale: '0', labor_cost: '90' })]).items[0].findings, ['labor_given_away']);
});
