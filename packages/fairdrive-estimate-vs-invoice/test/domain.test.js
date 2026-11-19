// Estimate vs invoice: the latest version, the comparison and the categories.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareEstimates, versionRank } from '../src/index.js';

const e = (o = {}) => ({ ro_number: 'B1', version: 'E01', estimate_date: '2026-10-01', labor: '1000', parts: '2000', materials: '0', sublet: '0', total: '3000', ...o });
const i = (o = {}) => ({ ro_number: 'B1', invoice_date: '2026-10-10', labor: '1000', parts: '2000', materials: '0', sublet: '0', total: '3000', ...o });
const run = (a, b, o = {}) => compareEstimates(a, b, { asOf: '2026-11-15', ...o });

test('versions order E01, then S01, S02, whatever their case or spacing', () => {
  assert.ok(versionRank('E01') < versionRank('s 1')); assert.ok(versionRank('S01') < versionRank('S02'));
});

test('the latest supplement is what the invoice is compared with', () => {
  assert.equal(run([e(), e({ version: 'S01', total: '3500', labor: '1500' })], [i({ total: '3500', labor: '1500' })]).items.length, 0);
});

test('over and under the estimate beyond the tolerance, with the categories that differ', () => {
  const over = run([e()], [i({ total: '3200', labor: '1200' })]);
  assert.equal(over.items[0].finding, 'invoiced_over_estimate'); assert.deepEqual(over.items[0].categories, ['labor +200']);
  assert.equal(run([e()], [i({ total: '2900', parts: '1900' })]).under_amount, 100);
  assert.equal(run([e()], [i({ total: '3005' })]).items.length, 0);
});

test('an invoice with no estimate, and an old estimate with no invoice', () => {
  assert.equal(run([], [i()]).no_estimate, 1);
  assert.equal(run([e()], []).not_invoiced, 1);
  assert.equal(run([e({ estimate_date: '2026-11-10' })], []).not_invoiced, 0);
});

test('RO numbers match without punctuation', () => {
  assert.equal(run([e({ ro_number: 'b-1' })], [i()]).items.length, 0);
});

test('several invoice lines for one RO are added up', () => {
  assert.equal(run([e()], [i({ total: '1000' }), i({ total: '2000' })]).items.length, 0);
});
