// Used vehicle aging: ages, buckets and the pricing flags.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageInventory } from '../src/index.js';

const u = (o = {}) => ({ stock_number: 'U1', received_date: '2026-10-01', cost: '20000', list_price: '23000', market_price: '23000', last_price_change: '2026-11-10', ...o });
const run = (rows, o = {}) => ageInventory(rows, { asOf: '2026-11-15', ...o });

test('a fresh, well-priced unit has no findings and lands in its bucket', () => {
  const r = run([u()]);
  assert.equal(r.items.length, 0); assert.equal(r.by_age[1].units, 1);
});

test('past the wholesale line is flagged; the line is a setting', () => {
  assert.equal(run([u({ received_date: '2026-09-01' })]).over_wholesale_age, 1);
  assert.equal(run([u({ received_date: '2026-09-01' })], { wholesaleDays: 90 }).over_wholesale_age, 0);
});

test('price to market above and well below the band', () => {
  assert.ok(run([u({ list_price: '24000' })]).items[0].findings.includes('priced_above_market'));
  assert.ok(run([u({ list_price: '20500' })]).items[0].findings.includes('priced_well_below_market'));
  assert.equal(run([u({ list_price: '23500' })]).items.length, 0);
});

test('below cost and no price are their own findings', () => {
  assert.ok(run([u({ list_price: '19000', market_price: '' })]).items[0].findings.includes('price_below_cost'));
  assert.deepEqual(run([u({ list_price: '', received_date: '2026-11-10' })]).items[0].findings, ['no_price']);
});

test('a price unchanged too long is stale only once the unit is past 30 days; no change date counts from receipt', () => {
  assert.ok(run([u({ last_price_change: '2026-10-15' })]).items[0].findings.includes('stale_price'));
  assert.equal(run([u({ received_date: '2026-10-20', last_price_change: '' })]).items.length, 0);
  assert.ok(run([u({ received_date: '2026-10-01', last_price_change: '' })]).items[0].findings.includes('stale_price'));
});

test('sold, wholesaled and transferred units are left out and counted', () => {
  const r = run([u({ status: 'Wholesaled' }), u({ stock_number: 'U2', status: 'Transferred' }), u({ stock_number: 'U3' })]);
  assert.equal(r.units, 1); assert.equal(r.skipped_sold, 2);
});

test('average age and cost totals cover every unit in stock, not only flagged ones', () => {
  const r = run([u(), u({ stock_number: 'U2', received_date: '2026-11-05', cost: '10000' })]);
  assert.equal(r.total_cost, 30000); assert.equal(r.average_age, 27.5);
});
