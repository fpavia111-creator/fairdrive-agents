// Finance reserve: the expected figure, what counts as paid, and the inquiry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { financeCharge, expectedReserve, checkReserve, inquiryText } from '../src/index.js';

const deal = (o = {}) => ({ deal_number: 'D1', lender: 'Harbor Auto Finance', contract_date: '2026-08-01', amount_financed: '12000', buy_rate: '0', contract_rate: '6', term_months: '12', ...o });

test('finance charge: zero at 0%, and the amortised figure at 6% for 12 months (payment 1032.80)', () => {
  assert.equal(financeCharge(12000, 0, 12), 0);
  assert.equal(financeCharge(12000, 6, 12), 393.58);
  assert.equal(financeCharge(0, 6, 12), null);
});

test('expected reserve is the share of the markup in finance charge', () => {
  assert.deepEqual(expectedReserve(deal()), { method: 'rate_markup', expected: 295.19 });
  assert.equal(expectedReserve(deal(), { sharePct: 100 }).expected, 393.58);
  assert.equal(expectedReserve(deal(), { cap: 200 }).expected, 200);
});

test('a flat fee wins over the rates; no markup earns nothing; missing rates cannot be computed', () => {
  assert.deepEqual(expectedReserve(deal({ flat_fee: '300' })), { method: 'flat', expected: 300 });
  assert.equal(expectedReserve(deal({ contract_rate: '0' })).method, 'no_markup');
  assert.equal(expectedReserve(deal({ buy_rate: '' })).method, 'cannot_compute');
});

test('payments with a reserve kind or no kind count as reserve; product commissions count as product income', () => {
  const r = checkReserve([deal({ product_income_expected: '500' })], [{ deal_number: 'D1', kind: 'Reserve', amount: '200' }, { deal_number: 'D1', amount: '95.19' }, { deal_number: 'D1', kind: 'GAP commission', amount: '500' }], { asOf: '2026-11-01' });
  assert.equal(r.items.length, 0); assert.equal(r.reserve_received, 295.19);
});

test('no reserve after the grace days is missing; inside them it is not chased', () => {
  assert.equal(checkReserve([deal()], [], { asOf: '2026-11-01' }).missing, 1);
  assert.equal(checkReserve([deal({ contract_date: '2026-10-25' })], [], { asOf: '2026-11-01' }).missing, 0);
});

test('short and over beyond the tolerance are flagged; inside it they are not', () => {
  assert.equal(checkReserve([deal()], [{ deal_number: 'D1', kind: 'Reserve', amount: '292' }], { asOf: '2026-11-01' }).items.length, 0);
  assert.equal(checkReserve([deal()], [{ deal_number: 'D1', kind: 'Reserve', amount: '250' }], { asOf: '2026-11-01' }).short_paid, 1);
  assert.equal(checkReserve([deal()], [{ deal_number: 'D1', kind: 'Reserve', amount: '350' }], { asOf: '2026-11-01' }).over_paid, 1);
});

test('product income missing and short are separate findings', () => {
  assert.ok(checkReserve([deal({ flat_fee: '1', product_income_expected: '800' })], [{ deal_number: 'D1', kind: 'flat', amount: '1' }], { asOf: '2026-11-01' }).items[0].findings.includes('product_income_missing'));
  assert.ok(checkReserve([deal({ flat_fee: '1', product_income_expected: '800' })], [{ deal_number: 'D1', kind: 'flat', amount: '1' }, { deal_number: 'D1', kind: 'VSC', amount: '500' }], { asOf: '2026-11-01' }).items[0].findings.includes('product_income_short'));
});

test('a payment for a deal not in the deal file is listed, not counted', () => {
  const r = checkReserve([deal({ flat_fee: '10' })], [{ deal_number: 'D1', kind: 'flat', amount: '10' }, { deal_number: 'D9', kind: 'Reserve', amount: '40' }], { asOf: '2026-11-01' });
  assert.deepEqual(r.payments_without_a_deal, [{ deal_number: 'D9', amount: 40 }]); assert.equal(r.reserve_received, 10);
});

test('the inquiry lists shortfalls and asks the person to check the share assumed', () => {
  const r = checkReserve([deal()], [], { asOf: '2026-11-01' });
  const d = inquiryText(r.items, { lender: 'Harbor Auto Finance', sharePct: 75 });
  assert.equal(d.total, 295.19); assert.match(d.text, /\[CHECK the reserve terms/); assert.match(d.text, /75%/);
});
