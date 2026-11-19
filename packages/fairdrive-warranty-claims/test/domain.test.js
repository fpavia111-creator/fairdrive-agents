// Warranty claims: paid, short, rejected with a deadline, debited, unpaid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkWarranty, reviewText } from '../src/index.js';

const c = (o = {}) => ({ claim_number: 'C1', submitted_date: '2026-10-01', total_claimed: '1000', ...o });
const s = (o = {}) => ({ claim_number: 'C1', paid_date: '2026-10-20', amount_paid: '1000', status: 'Paid', ...o });
const run = (x, y, o = {}) => checkWarranty(x, y, { asOf: '2026-11-15', ...o });

test('a claim paid in full is not listed; claim numbers match in any case and without punctuation', () => {
  assert.equal(run([c({ claim_number: 'c-1' })], [s({ claim_number: 'C 1' })]).items.length, 0);
});

test('the total is labor plus parts when no total is given', () => {
  assert.equal(run([c({ total_claimed: '', labor_amount: '300', parts_amount: '200' })], []).claimed, 500);
});

test('a rejection carries its resubmit-by date and turns past_deadline after it', () => {
  const r = run([c()], [s({ amount_paid: '0', status: 'Rejected', reason: 'No photo', paid_date: '2026-11-01' })]);
  assert.equal(r.items[0].resubmit_by, '2026-12-01'); assert.deepEqual(r.items[0].findings, ['rejected']);
  assert.deepEqual(run([c()], [s({ amount_paid: '0', status: 'Rejected', paid_date: '2026-10-01' })]).items[0].findings, ['rejected_past_deadline']);
});

test('a debit after payment wins over every other finding', () => {
  const r = run([c()], [s(), s({ amount_paid: '-400', status: 'Debit', paid_date: '2026-11-02' })]);
  assert.deepEqual(r.items[0].findings, ['debited_after_payment']); assert.equal(r.items[0].outstanding, 400);
});

test('unpaid claims are aged into buckets', () => {
  const r = run([c(), c({ claim_number: 'C2', submitted_date: '2026-07-01' })], []);
  assert.deepEqual(r.unpaid_by_age.map((b) => b.claims), [0, 1, 0, 1]);
});

test('the review request leaves unpaid claims out and asks for attachments', () => {
  const r = run([c(), c({ claim_number: 'C2' })], [s({ amount_paid: '800' })]);
  const d = reviewText(r.items, {});
  assert.equal(d.count, 1); assert.equal(d.total, 200); assert.match(d.text, /\[ATTACH the repair order/);
});
