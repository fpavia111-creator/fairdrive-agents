// Sales tax: the taxable amount, trade credit, doc fee, caps and county matching.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expectedTax, checkSalesTax } from '../src/index.js';

const d = (o = {}) => ({ deal_number: 'D1', state: 'TX', county: 'Harrow', sale_price: '20000', trade_allowance: '5000', doc_fee: '150', tax_charged: '937.50', ...o });
const r = (o = {}) => ({ state: 'TX', county: 'Harrow', rate_pct: '6.25', trade_credit: 'yes', doc_fee_taxable: 'no', ...o });

test('the trade reduces the taxable amount when the table says so', () => {
  assert.deepEqual(expectedTax(d(), r()), { taxable: 15000, tax: 937.5 });
  assert.equal(expectedTax(d(), r({ trade_credit: 'no' })).tax, 1250);
});

test('a taxable doc fee is added, and the cap applies', () => {
  assert.equal(expectedTax(d(), r({ doc_fee_taxable: 'yes' })).taxable, 15150);
  assert.equal(expectedTax(d(), r({ max_tax: '500' })).tax, 500);
});

test('a trade larger than the price leaves nothing to tax, never a negative', () => {
  assert.equal(expectedTax(d({ trade_allowance: '25000' }), r()).tax, 0);
});

test('tax charged right is not listed; over and under are, with the amount', () => {
  assert.equal(checkSalesTax([d()], [r()]).items.length, 0);
  assert.equal(checkSalesTax([d({ tax_charged: '1000' })], [r()]).overcharged_amount, 62.5);
  assert.equal(checkSalesTax([d({ tax_charged: '900' })], [r()]).undercharged_amount, 37.5);
});

test('a county matches without its state when it is the only one of that name; otherwise no_rate', () => {
  assert.equal(checkSalesTax([d({ state: '' })], [r()]).items.length, 0);
  assert.equal(checkSalesTax([d({ state: '' })], [r(), r({ state: 'OK' })]).no_rate, 1);
});

test('county names match in any case', () => {
  assert.equal(checkSalesTax([d({ county: 'HARROW' })], [r()]).items.length, 0);
});
