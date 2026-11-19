// Incentive claims: matching by VIN and program, and each finding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkIncentives, inquiryText } from '../src/index.js';

const V = '7ZZ5R6E05LA192725';
const e = (o = {}) => ({ vin: V, sale_date: '2026-10-01', program: 'RET-1', amount_expected: '1000', claim_submitted: '2026-10-02', ...o });
const s = (o = {}) => ({ vin: V, program: 'RET-1', amount_paid: '1000', paid_date: '2026-10-20', status: 'Paid', ...o });
const run = (x, y, o = {}) => checkIncentives(x, y, { asOf: '2026-11-15', ...o });

test('a claim paid in full is not listed; the VIN tail and program punctuation still match', () => {
  assert.equal(run([e()], [s({ vin: 'LA192725', program: 'ret 1' })]).items.length, 0);
});

test('paid short, rejected and charged back are told apart', () => {
  assert.deepEqual(run([e()], [s({ amount_paid: '600' })]).items[0].findings, ['paid_short']);
  assert.deepEqual(run([e()], [s({ amount_paid: '0', status: 'Rejected', reason: 'No RDR' })]).items[0].findings, ['rejected']);
  assert.deepEqual(run([e()], [s(), s({ amount_paid: '-1000', status: 'Chargeback', paid_date: '2026-11-01' })]).items[0].findings, ['charged_back']);
});

test('not submitted: past the deadline or still due', () => {
  assert.deepEqual(run([e({ claim_submitted: '' })], []).items[0].findings, ['not_submitted_past_deadline']);
  assert.deepEqual(run([e({ claim_submitted: '', sale_date: '2026-11-01' })], []).items[0].findings, ['not_submitted']);
});

test('submitted and missing from the statement is unpaid only after the unpaid days', () => {
  assert.deepEqual(run([e({ claim_submitted: '2026-09-20' })], []).items[0].findings, ['unpaid']);
  assert.equal(run([e({ claim_submitted: '2026-11-01', sale_date: '2026-10-30' })], []).items.length, 0);
});

test('statement lines for nothing expected are listed separately', () => {
  assert.equal(run([e()], [s(), s({ program: 'BONUS' })]).paid_not_expected.length, 1);
});

test('the inquiry covers unpaid, short, rejected and charged-back claims, not those still to submit', () => {
  const r = run([e({ amount_expected: '1000' }), e({ program: 'RET-2', claim_submitted: '' })], [s({ amount_paid: '700' })]);
  const d = inquiryText(r.items, {});
  assert.equal(d.count, 1); assert.equal(d.total, 300); assert.match(d.text, /\[TO CONFIRM manufacturer incentive desk contact\]/);
});
