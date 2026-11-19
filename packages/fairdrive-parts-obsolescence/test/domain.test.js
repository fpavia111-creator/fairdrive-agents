// Parts obsolescence: classes by months idle, values, returnable stock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyParts } from '../src/index.js';

const p = (o = {}) => ({ part_number: 'P1', on_hand: '2', unit_cost: '50', last_sale_date: '2026-10-01', ...o });
const run = (rows, o = {}) => classifyParts(rows, { asOf: '2026-11-15', ...o });

test('a part sold recently is active and not listed', () => {
  const r = run([p()]); assert.equal(r.items.length, 0); assert.equal(r.by_class[0].value, 100);
});

test('months idle put a part in slow, candidate or obsolete', () => {
  assert.equal(run([p({ last_sale_date: '2026-04-01' })]).items[0].class, 'slow');
  assert.equal(run([p({ last_sale_date: '2026-01-01' })]).items[0].class, 'obsolete_candidate');
  assert.equal(run([p({ last_sale_date: '2025-06-01' })]).items[0].class, 'obsolete');
});

test('a part never sold is aged from its last receipt; with neither date it is obsolete', () => {
  assert.equal(run([p({ last_sale_date: '', last_receipt_date: '2026-10-01' })]).items.length, 0);
  assert.equal(run([p({ last_sale_date: '' })]).items[0].class, 'obsolete');
});

test('parts with nothing on hand are left out', () => {
  assert.equal(run([p({ on_hand: '0' })]).parts, 0);
});

test('returnable value counts only idle parts flagged returnable', () => {
  const r = run([p({ last_sale_date: '2025-06-01', returnable: 'Y' }), p({ part_number: 'P2', last_sale_date: '2025-06-01', returnable: 'N' }), p({ part_number: 'P3', returnable: 'Y' })]);
  assert.equal(r.returnable_value, 100);
});

test('the obsolete percent is of the whole value on hand', () => {
  const r = run([p({ last_sale_date: '2025-06-01' }), p({ part_number: 'P2', on_hand: '3' })]);
  assert.equal(r.obsolete_pct, 40);
});
