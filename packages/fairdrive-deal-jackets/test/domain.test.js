// Deal jackets: which documents a deal needs, how names are read, and what counts as a gap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkJackets, requiredFor, docCode } from '../src/index.js';

const deal = (o = {}) => ({ deal_number: 'D1', deal_date: '2026-10-01', delivery_date: '2026-10-02', deal_type: 'Cash', sale_type: 'New', ...o });
const docs = (id, codes, extra = {}) => codes.map((c) => ({ deal_number: id, document: c, signed: 'yes', ...extra }));
const EVERY = ['buyers_order', 'odometer', 'title_application', 'privacy_notice', 'ofac', 'red_flags', 'insurance', 'drivers_license'];

test('a cash new deal needs the eight common documents and nothing about credit', () => {
  const need = requiredFor(deal());
  assert.deepEqual(need, EVERY);
  assert.equal(checkJackets([deal()], docs('D1', EVERY), { asOf: '2026-11-15' }).complete, 1);
});

test('a used car needs a Buyers Guide; a financed one the credit application, contract and score notice', () => {
  const need = requiredFor(deal({ sale_type: 'Pre-Owned', deal_type: 'Retail Finance' }));
  for (const c of ['buyers_guide', 'credit_application', 'installment_contract', 'credit_notice']) assert.ok(need.includes(c), c);
  assert.ok(!need.includes('lease_agreement'));
});

test('a lease needs the lease agreement, not an installment contract; a trade adds title and power of attorney', () => {
  const lease = requiredFor(deal({ deal_type: 'Lease', trade_vin: '0ZZUFBHK6LA997328' }));
  assert.ok(lease.includes('lease_agreement') && !lease.includes('installment_contract'));
  assert.ok(lease.includes('trade_title') && lease.includes('power_of_attorney'));
});

test('document names are read from the words stores use', () => {
  assert.equal(docCode('RISC'), 'installment_contract');
  assert.equal(docCode('Bill of Sale'), 'buyers_order');
  assert.equal(docCode('GLBA Privacy Notice'), 'privacy_notice');
  assert.equal(docCode('Payoff Authorization'), 'trade_title');
  assert.equal(docCode('installment_contract'), 'installment_contract');
  assert.equal(docCode('We Owe form'), null);
});

test('an unsigned copy is a gap of its own; a signed copy anywhere in the jacket wins', () => {
  const unsigned = checkJackets([deal()], [...docs('D1', EVERY.slice(1)), { deal_number: 'D1', document: "Buyer's Order", signed: 'no' }], { asOf: '2026-11-15' });
  assert.deepEqual([unsigned.unsigned_documents, unsigned.missing_documents], [1, 0]);
  const both = checkJackets([deal()], [...docs('D1', EVERY), { deal_number: 'D1', document: "Buyer's Order", signed: 'no' }], { asOf: '2026-11-15' });
  assert.equal(both.complete, 1);
});

test('unwound, cancelled and wholesale deals are skipped and counted', () => {
  const r = checkJackets([deal({ status: 'Unwound' }), deal({ deal_number: 'D2', status: 'Cancelled' }), deal({ deal_number: 'D3' })], [], { asOf: '2026-11-15' });
  assert.equal(r.skipped_unwound, 2); assert.equal(r.deals, 1); assert.equal(r.incomplete, 1);
});

test('deal numbers match across files whatever their zeros and punctuation', () => {
  const r = checkJackets([deal({ deal_number: '00412' })], docs('412', EVERY), { asOf: '2026-11-15' });
  assert.equal(r.complete, 1); assert.deepEqual(r.documents_without_a_deal, []);
});

test('days since delivery count from as_of; delivery date falls back to the deal date', () => {
  const r = checkJackets([deal({ delivery_date: '' })], [], { asOf: '2026-11-15' });
  assert.equal(r.items[0].delivered, '2026-10-01'); assert.equal(r.items[0].days_since_delivery, 45);
});

test('store settings add or drop documents from every checklist', () => {
  assert.ok(requiredFor(deal(), { extra: ['buyers_guide'] }).includes('buyers_guide'));
  assert.ok(!requiredFor(deal(), { notRequired: ['ofac'] }).includes('ofac'));
});

test('scanned jackets for deals that are not in the deal file are listed, not counted', () => {
  const r = checkJackets([deal()], [...docs('D1', EVERY), ...docs('D9', ['buyers_order'])], { asOf: '2026-11-15' });
  assert.deepEqual(r.documents_without_a_deal, ['D9']); assert.equal(r.deals, 1);
});
