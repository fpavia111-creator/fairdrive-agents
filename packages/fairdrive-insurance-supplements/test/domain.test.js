// Insurance supplements: pending, short, denied and response times.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackSupplements, followUpText } from '../src/index.js';

const s = (o = {}) => ({ ro_number: 'B1', insurer: 'Heron Mutual', supplement_number: 'S01', submitted_date: '2026-11-01', amount_requested: '500', status: 'Pending', ...o });
const run = (rows, o = {}) => trackSupplements(rows, { asOf: '2026-11-15', ...o });

test('a supplement waiting past the follow-up days is listed; a recent one is not', () => {
  assert.equal(run([s()]).pending_over, 1);
  assert.equal(run([s({ submitted_date: '2026-11-13' })]).items.length, 0);
});

test('approved in full is clean; approved short and denied are listed with their amounts', () => {
  assert.equal(run([s({ status: 'Approved', response_date: '2026-11-03', amount_approved: '500' })]).items.length, 0);
  assert.equal(run([s({ status: 'Partial', response_date: '2026-11-03', amount_approved: '450' })]).short_amount, 50);
  assert.equal(run([s({ status: 'Denied', response_date: '2026-11-03', amount_approved: '0' })]).denied_amount, 500);
});

test('days to an answer are averaged by insurer', () => {
  const r = run([s({ status: 'Approved', response_date: '2026-11-03', amount_approved: '500' }), s({ ro_number: 'B2', status: 'Approved', response_date: '2026-11-07', amount_approved: '500' })]);
  assert.equal(r.by_insurer[0].average_days_to_response, 4);
});

test('insurer names are grouped', () => {
  assert.equal(run([s(), s({ ro_number: 'B2', insurer: 'Heron' })]).by_insurer.length, 1);
});

test('the same supplement listed twice is counted once', () => {
  assert.equal(run([s(), s()]).supplements, 1);
});

test('the follow-up lists only supplements waiting too long, and asks for attachments', () => {
  const r = run([s(), s({ ro_number: 'B2', status: 'Denied', response_date: '2026-11-03' })]);
  const d = followUpText(r.items, { insurer: 'Heron Mutual' });
  assert.equal(d.count, 1); assert.match(d.text, /\[ATTACH photos/); assert.match(d.text, /\[TO CONFIRM Heron Mutual adjuster\]/);
});
