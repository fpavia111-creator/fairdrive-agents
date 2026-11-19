// Parts receiving: quantities, prices and duplicate lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchReceiving, creditText } from '../src/index.js';

const r = (o = {}) => ({ po_number: 'PO-1', part_number: 'P1', received_date: '2026-11-01', qty_received: '5', unit_cost: '10', ...o });
const i = (o = {}) => ({ invoice_number: 'I1', po_number: 'PO-1', part_number: 'P1', qty_billed: '5', unit_price: '10', invoice_date: '2026-11-02', vendor: 'Northline', ...o });
const run = (x, y, o = {}) => matchReceiving(x, y, { asOf: '2026-11-15', ...o });

test('a line received and billed at the order cost is clean; PO and part punctuation does not matter', () => {
  assert.equal(run([r({ po_number: 'po 1' })], [i({ part_number: 'p-1' })]).items.length, 0);
});

test('billed more than received is billed_not_received at the billed price', () => {
  const x = run([r({ qty_received: '3' })], [i()]);
  assert.equal(x.items[0].finding, 'billed_not_received'); assert.equal(x.items[0].amount, 20);
});

test('received and not billed only after the days set', () => {
  assert.equal(run([r()], []).received_not_billed, 0);
  assert.equal(run([r({ received_date: '2026-09-01' })], []).received_not_billed, 1);
});

test('a price above the order cost by more than the percent is flagged on the matched quantity', () => {
  const x = run([r()], [i({ unit_price: '11' })]);
  assert.equal(x.price_above_cost, 1); assert.equal(x.overbilled, 5);
  assert.equal(run([r()], [i({ unit_price: '10.05' })]).price_above_cost, 0);
});

test('an invoice line repeated exactly is a duplicate and is not counted as billed twice', () => {
  const x = run([r()], [i(), i()]);
  assert.equal(x.duplicate_invoice_lines, 1); assert.equal(x.billed_not_received, 0); assert.equal(x.billed, 50);
});

test('the credit request covers one vendor and leaves out parts received but not billed', () => {
  const x = run([r({ qty_received: '3' }), r({ po_number: 'PO-2', received_date: '2026-09-01' })], [i(), i({ po_number: 'PO-3', vendor: 'Other Co' })]);
  const d = creditText(x.items, { vendor: 'Northline' });
  assert.equal(d.count, 1); assert.equal(d.total, 20);
});
