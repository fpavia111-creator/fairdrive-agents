// Flat-rate hours: proficiency, efficiency and the line findings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFlatRate } from '../src/index.js';

const f = (o = {}) => ({ technician: 'Ines Alvarez', ro_number: 'R1', date: '2026-11-09', flag_hours: '8', actual_hours: '7', ...o });
const c = (o = {}) => ({ technician: 'Ines Alvarez', date: '2026-11-09', clock_hours: '8', ...o });

test('proficiency is flagged over clocked; efficiency is flagged over punched', () => {
  const r = checkFlatRate([f()], [c()]);
  assert.deepEqual([r.by_technician[0].proficiency_pct, r.by_technician[0].efficiency_pct, r.by_technician[0].productivity_pct], [100, 114.29, 87.5]);
  assert.equal(r.items.length, 0);
});

test('technician names match in any case and spacing', () => {
  assert.equal(checkFlatRate([f({ technician: 'ines  alvarez' })], [c()]).technicians, 1);
});

test('a job flagged with no time punched is flagged_no_time', () => {
  assert.equal(checkFlatRate([f({ actual_hours: '' })], [c()]).items[0].finding, 'flagged_no_time');
});

test('a job flagged at three times the punch or more is flag_far_above_time; small flags are left alone', () => {
  assert.equal(checkFlatRate([f({ flag_hours: '6', actual_hours: '2' })], [c()]).flag_far_above_time, 1);
  assert.equal(checkFlatRate([f({ flag_hours: '0.3', actual_hours: '0.1' })], [c()]).flag_far_above_time, 0);
});

test('a day with flags and no attendance is listed with its repair orders', () => {
  const r = checkFlatRate([f({ date: '2026-11-10' }), f({ ro_number: 'R2', date: '2026-11-10' })], [c()]);
  const day = r.items.find((i) => i.finding === 'flags_without_clock');
  assert.equal(day.ro_number, 'R1 / R2'); assert.equal(day.flag_hours, 16);
});

test('the proficiency floor is a setting, and the same flag line twice is counted once', () => {
  assert.equal(checkFlatRate([f({ flag_hours: '6' })], [c()]).below_floor, 1);
  assert.equal(checkFlatRate([f({ flag_hours: '6' })], [c()], { floorPct: 70 }).below_floor, 0);
  assert.equal(checkFlatRate([f(), f()], [c()]).flagged_hours, 8);
});
