// Trade payoffs: per diem, late and short payments, clearing and lien releases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payoffOn, checkPayoffs, batchText } from '../src/index.js';

const r = (o = {}) => ({ deal_number: 'D1', lienholder: 'Harbor', deal_date: '2026-11-01', payoff_quote: '10000', quote_good_through: '2026-11-10', per_diem: '2', ...o });
const run = (rows, o = {}) => checkPayoffs(rows, { asOf: '2026-11-15', ...o });

test('owed is the quote until good-through, then plus per diem per day', () => {
  assert.equal(payoffOn(r(), '2026-11-08'), 10000);
  assert.equal(payoffOn(r(), '2026-11-15'), 10010);
  assert.equal(payoffOn(r({ payoff_quote: '' }), '2026-11-15'), null);
});

test('a payoff not sent after the payoff days is listed with what is owed today', () => {
  const x = run([r()]);
  assert.equal(x.not_sent, 1); assert.equal(x.items[0].owed_now, 10010);
  assert.equal(run([r({ deal_date: '2026-11-12' })]).not_sent, 0);
});

test('a payment sent after good-through without the per diem is short by the per diem', () => {
  const x = run([r({ payoff_sent: '2026-11-13', payoff_amount_sent: '10000', payoff_cleared: '2026-11-14' })]);
  assert.deepEqual(x.items[0].findings, ['sent_after_quote_expired', 'short_paid']); assert.equal(x.short_amount, 6);
});

test('a payment covering the per diem is not short', () => {
  assert.equal(run([r({ payoff_sent: '2026-11-13', payoff_amount_sent: '10006', payoff_cleared: '2026-11-14' })]).short_paid, 0);
});

test('sent and not cleared, and cleared with no release, each after their days', () => {
  assert.ok(run([r({ deal_date: '2026-10-01', payoff_sent: '2026-10-02', payoff_amount_sent: '10000' })]).items[0].findings.includes('not_cleared'));
  assert.ok(run([r({ deal_date: '2026-09-01', payoff_sent: '2026-09-02', payoff_amount_sent: '10000', payoff_cleared: '2026-09-05' })]).items[0].findings.includes('lien_release_missing'));
});

test('the batch lists only payoffs not sent, with a CHECK marker for a fresh quote', () => {
  const x = run([r(), r({ deal_number: 'D2', payoff_sent: '2026-11-03', payoff_amount_sent: '10000' })]);
  const b = batchText(x.items, { from: 'J' });
  assert.equal(b.count, 1); assert.equal(b.total, 10010); assert.match(b.text, /\[CHECK each amount with a fresh payoff quote/);
});
