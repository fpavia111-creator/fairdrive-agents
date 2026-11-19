// Comebacks: what counts as the same work, and the day and mile limits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findComebacks, sameWork } from '../src/index.js';

const V = '7ZZ5R6E05LA192725';
const ro = (o = {}) => ({ ro_number: '1', vin: V, opened: '2026-10-01', odometer: '1000', technician: 'Ines', op_code: 'BRK01', concern: 'Brakes grinding', ...o });

test('same op code, or two shared concern words, is the same work; one shared word is not', () => {
  assert.equal(sameWork({ op_code: 'brk-01' }, { op_code: 'BRK01' }), 'same_op_code');
  assert.equal(sameWork({ concern: 'AC blowing warm' }, { concern: 'blowing warm air' }), 'same_concern');
  assert.equal(sameWork({ concern: 'Battery dead' }, { concern: 'Battery new install' }), null);
});

test('a return inside the days and miles is a comeback charged to the first technician', () => {
  const r = findComebacks([ro(), ro({ ro_number: '2', opened: '2026-10-10', odometer: '1300', technician: 'Mei' })]);
  assert.equal(r.comebacks, 1); assert.equal(r.items[0].technician, 'Ines'); assert.equal(r.items[0].miles, 300);
});

test('outside the days or the miles it is not', () => {
  assert.equal(findComebacks([ro(), ro({ ro_number: '2', opened: '2026-11-15' })]).comebacks, 0);
  assert.equal(findComebacks([ro(), ro({ ro_number: '2', opened: '2026-10-10', odometer: '3000' })]).comebacks, 0);
});

test('a missing odometer falls back to days only', () => {
  assert.equal(findComebacks([ro({ odometer: '' }), ro({ ro_number: '2', opened: '2026-10-10' })]).comebacks, 1);
});

test('days count from the close date of the first visit when there is one', () => {
  assert.equal(findComebacks([ro({ closed: '2026-10-20' }), ro({ ro_number: '2', opened: '2026-11-15' })]).items[0].days, 26);
});

test('an internal first visit is not a comeback source; different vehicles are never compared', () => {
  assert.equal(findComebacks([ro({ labor_type: 'Internal' }), ro({ ro_number: '2', opened: '2026-10-05' })]).comebacks, 0);
  assert.equal(findComebacks([ro(), ro({ ro_number: '2', vin: '7ZZ9U1LW1MA734429', opened: '2026-10-05' })]).comebacks, 0);
});
