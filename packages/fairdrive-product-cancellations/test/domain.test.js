// F&I cancellations: the expected dealer chargeback, and what is flagged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expectedChargeback, checkCancellations, disputeText } from '../src/index.js';

const row = (o = {}) => ({ deal_number: 'D1', product: 'Service Contract', provider: 'Larkfield', sale_date: '2026-01-01', cancel_date: '2026-07-01', term_months: '48', product_price: '2000', product_cost: '1000', ...o });

test('inside the full chargeback window the whole profit comes back', () => {
  assert.deepEqual(expectedChargeback(row({ cancel_date: '2026-03-01' })), { profit: 1000, used_days: 59, unused_share: 1, expected: 1000 });
});

test('after the window the profit is charged back pro rata by days of term left', () => {
  const e = expectedChargeback(row());
  assert.equal(e.used_days, 181); assert.equal(e.expected, 876.11);
});

test('a product used past its whole term gives nothing back', () => {
  assert.equal(expectedChargeback(row({ term_months: '6', cancel_date: '2026-12-01' })).expected, 0);
});

test('a missing price, cost or term is reported as cannot_compute, not guessed', () => {
  assert.ok(checkCancellations([row({ product_cost: '' })], { asOf: '2026-07-10' }).items[0].findings.includes('cannot_compute'));
  assert.ok(checkCancellations([row({ term_months: '' })], { asOf: '2026-07-10' }).items[0].findings.includes('cannot_compute'));
});

test('a chargeback within the tolerance is not listed; above it is, with the arithmetic', () => {
  assert.equal(checkCancellations([row({ chargeback: '878', refund_sent: '2026-07-05' })], { asOf: '2026-08-01' }).items.length, 0);
  const r = checkCancellations([row({ chargeback: '1000', refund_sent: '2026-07-05' })], { asOf: '2026-08-01' });
  assert.deepEqual(r.items[0].findings, ['chargeback_above_expected']); assert.equal(r.overcharged, 123.89);
});

test('a chargeback larger than the profit is flagged on its own', () => {
  const r = checkCancellations([row({ chargeback: '1500', refund_sent: '2026-07-05' })], { asOf: '2026-08-01' });
  assert.ok(r.items[0].findings.includes('chargeback_above_profit'));
});

test('the full chargeback window is a setting', () => {
  const r = checkCancellations([row({ chargeback: '1000', refund_sent: '2026-07-05' })], { asOf: '2026-08-01', fullDays: 200 });
  assert.equal(r.items.length, 0);
});

test('a refund with no date is flagged only after the refund window', () => {
  assert.equal(checkCancellations([row({ chargeback: '876.11' })], { asOf: '2026-07-20' }).refunds_not_sent, 0);
  assert.equal(checkCancellations([row({ chargeback: '876.11' })], { asOf: '2026-08-15' }).refunds_not_sent, 1);
  assert.equal(checkCancellations([row({ chargeback: '876.11', refund_amount: '0' })], { asOf: '2026-08-15' }).refunds_not_sent, 0);
});

test('the same product listed twice for one deal is counted once', () => {
  assert.equal(checkCancellations([row({ chargeback: '1000' }), row({ chargeback: '1000' })], { asOf: '2026-08-15' }).cancellations, 1);
});

test('the review request carries every overcharged contract and a CHECK marker about the method', () => {
  const r = checkCancellations([row({ chargeback: '1000', contract_number: 'SC-1' }), row({ deal_number: 'D2', chargeback: '900', contract_number: 'SC-2' })], { asOf: '2026-07-10' });
  const d = disputeText(r.items, { provider: 'Larkfield' });
  assert.equal(d.total, 147.78); assert.match(d.text, /SC-1/); assert.match(d.text, /\[CHECK the cancellation method/);
});
