// Sublet: matching invoices to lines and what each finding means.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchSublet } from '../src/index.js';

const l = (o = {}) => ({ ro_number: '1', po_number: 'PO-1', vendor: 'Ridgeway Glass', sublet_cost: '300', sublet_sale: '400', ro_closed: '2026-11-01', ...o });
const i = (o = {}) => ({ invoice_number: 'G1', vendor: 'Ridgeway Glass', po_number: 'PO-1', amount: '300', invoice_date: '2026-11-02', ...o });
const run = (a, b, o = {}) => matchSublet(a, b, { asOf: '2026-11-15', ...o });

test('an invoice matching its PO and a sale above cost is clean', () => {
  assert.equal(run([l()], [i()]).items.length, 0);
});

test('an invoice with no PO matches by RO number and vendor', () => {
  assert.equal(run([l()], [i({ po_number: '', ro_number: '1' })]).items.length, 0);
  assert.equal(run([l()], [i({ po_number: '', ro_number: '1', vendor: 'Other Glass' })]).invoices_no_ro, 1);
});

test('invoiced above the PO, and the sale then below the invoiced cost', () => {
  const r = run([l({ sublet_sale: '320' })], [i({ amount: '350' })]);
  assert.deepEqual(r.items.map((x) => x.finding).sort(), ['invoice_over_po', 'sold_below_cost']);
});

test('a closed RO without an invoice is unbooked cost only after the closed days', () => {
  assert.equal(run([l({ ro_closed: '2026-11-12' })], []).closed_no_invoice, 0);
  assert.equal(run([l()], []).unbooked_cost, 300);
});

test('nothing billed to the customer is not_billed, not sold_below_cost', () => {
  assert.deepEqual(run([l({ sublet_sale: '0' })], [i()]).items.map((x) => x.finding), ['not_billed']);
});

test('the same vendor invoice number twice is a duplicate, counted once against the line', () => {
  const r = run([l()], [i(), i()]);
  assert.equal(r.duplicate_invoices, 1); assert.equal(r.invoice_over_po, 0);
});
