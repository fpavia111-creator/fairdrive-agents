// Title tracking: each finding and its day limit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackTitles } from '../src/index.js';

const d = (o = {}) => ({ deal_number: 'D1', delivery_date: '2026-11-01', ...o });
const f = (o, s = {}) => (trackTitles([d(o)], { asOf: '2026-11-15', ...s }).items[0] || { findings: [] }).findings;

test('no application after the submit days is late; within a week of it is due soon', () => {
  assert.deepEqual(f({ delivery_date: '2026-10-01' }), ['application_late']);
  assert.deepEqual(f({ delivery_date: '2026-10-20' }), ['application_due_soon']);
  assert.deepEqual(f({}), []);
});

test('a trade without its title past the trade-title days is flagged; with the title it is not', () => {
  assert.ok(f({ trade_vin: 'X1', title_application_sent: '2026-11-02', delivery_date: '2026-10-25' }).includes('trade_title_missing'));
  assert.ok(!f({ trade_vin: 'X1', trade_title_received: '2026-10-30', title_application_sent: '2026-11-02', delivery_date: '2026-10-25' }).includes('trade_title_missing'));
});

test('a temporary tag past or near expiry with no registration is flagged; a registration clears it', () => {
  assert.ok(f({ temp_tag_expires: '2026-11-10', title_application_sent: '2026-11-02' }).includes('temp_tag_expired'));
  assert.ok(f({ temp_tag_expires: '2026-11-18', title_application_sent: '2026-11-02' }).includes('temp_tag_expiring'));
  assert.deepEqual(f({ temp_tag_expires: '2026-11-10', title_application_sent: '2026-11-02', registration_issued: '2026-11-09' }), []);
});

test('an application sent long ago with no registration is pending', () => {
  assert.ok(f({ delivery_date: '2026-09-01', title_application_sent: '2026-09-05' }).includes('registration_pending'));
  assert.deepEqual(f({ delivery_date: '2026-09-01', title_application_sent: '2026-09-05' }, { registrationDays: 90 }), []);
});

test('deals without a delivery date are not counted; a deal listed twice is counted once', () => {
  const r = trackTitles([d({ delivery_date: '' }), d({ deal_number: 'D2' }), d({ deal_number: 'D2' })], { asOf: '2026-11-15' });
  assert.equal(r.deals, 1);
});

test('the settings in force are returned with the result', () => {
  assert.deepEqual(trackTitles([], { asOf: '2026-11-15', submitDays: 20 }).settings, { submit_days: 20, trade_title_days: 15, tag_warning_days: 7, registration_days: 45 });
});
