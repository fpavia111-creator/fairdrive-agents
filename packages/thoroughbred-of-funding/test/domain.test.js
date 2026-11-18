// Contracts in transit: what counts as funded, how the lender statement is matched, and the follow-up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFunding, followUpText } from '../src/index.js';

const c = (o = {}) => ({ deal_number: 'D1', lender: 'Harbor Auto Finance', contract_date: '2026-10-01', amount_financed: '20000', ...o });
const AS_OF = '2026-11-15';

test('an unfunded contract is aged from its contract date and bucketed', () => {
  const r = checkFunding([c()], null, { asOf: AS_OF });
  assert.deepEqual([r.items[0].finding, r.items[0].days, r.items[0].bucket, r.in_transit_amount], ['in_transit', 45, '30+', 20000]);
});

test('a funded date or a funded status both count as funded', () => {
  assert.equal(checkFunding([c({ funded_date: '2026-10-05', funded_amount: '20000' })], null, { asOf: AS_OF }).in_transit, 0);
  assert.equal(checkFunding([c({ status: 'Funded' })], null, { asOf: AS_OF }).in_transit, 0);
});

test('returned contracts stay in transit and are listed first', () => {
  const r = checkFunding([c({ deal_number: 'D2', contract_date: '2026-11-01' }), c({ status: 'Kicked back', stips: 'Re-sign' })], null, { asOf: AS_OF });
  assert.equal(r.items[0].finding, 'returned_by_lender'); assert.equal(r.in_transit, 2); assert.match(r.items[0].why, /Re-sign/);
});

test('funding within the tolerance is not a difference; beyond it is short or over', () => {
  assert.equal(checkFunding([c({ funded_date: '2026-10-05', funded_amount: '19999.50' })], null, { asOf: AS_OF }).items.length, 0);
  const short = checkFunding([c({ funded_date: '2026-10-05', funded_amount: '19750' })], null, { asOf: AS_OF });
  assert.equal(short.items[0].finding, 'funded_short'); assert.equal(short.funded_short, -250);
  assert.equal(checkFunding([c({ funded_date: '2026-10-05', funded_amount: '20300' })], null, { asOf: AS_OF }).items[0].finding, 'funded_over');
});

test('expected funding, when the DMS gives it, is what the funded amount is compared with', () => {
  assert.equal(checkFunding([c({ expected_funding: '19500', funded_date: '2026-10-05', funded_amount: '19500' })], null, { asOf: AS_OF }).items.length, 0);
});

test('money on the lender statement for a contract still open in the DMS is funded_not_posted', () => {
  const r = checkFunding([c()], [{ lender: 'Harbor', deal_number: 'd-1', funded_date: '2026-10-09', funded_amount: '20000' }], { asOf: AS_OF });
  assert.equal(r.items[0].finding, 'funded_not_posted'); assert.equal(r.in_transit, 0); assert.equal(r.items[0].days, 8);
});

test('statement lines without a deal number match by the VIN tail', () => {
  const r = checkFunding([c({ vin: '7ZZAWVY04SA868254', funded_date: '2026-10-05', funded_amount: '20000' })], [{ vin: 'SA868254', funded_date: '2026-10-05', funded_amount: '20000' }], { asOf: AS_OF });
  assert.equal(r.items.length, 0); assert.equal(r.statement_lines_not_matched.length, 0);
});

test('a contract marked funded with no statement line, and a statement line with no contract, are both reported', () => {
  const r = checkFunding([c({ funded_date: '2026-10-05', funded_amount: '20000' })], [{ deal_number: 'D9', funded_date: '2026-10-05', funded_amount: '5000' }], { asOf: AS_OF });
  assert.equal(r.not_on_statement, 1); assert.equal(r.statement_lines_not_matched[0].funded_amount, 5000);
});

test('lender names are grouped, so "Harbor" and "Harbor Auto Finance, LLC" are one lender', () => {
  const r = checkFunding([c(), c({ deal_number: 'D2', lender: 'Harbor Auto Finance, LLC' })], null, { asOf: AS_OF });
  assert.equal(r.by_lender.length, 1); assert.equal(r.by_lender[0].contracts, 2);
});

test('the follow-up lists only contracts still waiting, with stips, and leaves open markers for what is unknown', () => {
  const r = checkFunding([c({ stips: 'Proof of income' }), c({ deal_number: 'D2', funded_date: '2026-10-03', funded_amount: '1' })], null, { asOf: AS_OF });
  const text = followUpText(r.items, { lender: 'Harbor Auto Finance' });
  assert.match(text, /\| D1 \|.*Proof of income/); assert.doesNotMatch(text, /\| D2 \|/);
  assert.match(text, /\[TO CONFIRM Harbor Auto Finance funding contact\]/);
});
