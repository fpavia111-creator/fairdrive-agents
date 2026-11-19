// Dealer helpers, customer-data masking and the checkAgent builder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normVin, vinCheck, sameVin, vinIndex, vinYear, normId, ageBucket, bucketLabels, partyKey, sameParty, partyGrouper, yes, tally, PiiMasker, piiKindOf, checkAgent, AgentRuntime, ONE_CLICK_CATEGORIES } from '../src/index.js';

test('VINs: normalised, check digit verified, tails matched', () => {
  assert.equal(normVin(' 0zz-0zmjdxma909511 '), '0ZZ0ZMJDXMA909511');
  assert.equal(vinCheck('0ZZ0ZMJDXMA909511'), true);
  assert.equal(vinCheck('0ZZ0ZMJD0MA909511'), false);
  assert.equal(vinCheck('SHORT123'), null);
  assert.equal(vinCheck('0ZZ0ZMJDOMA909511'), false, 'the letter O is never in a VIN');
  assert.ok(sameVin('0ZZ0ZMJDXMA909511', 'MA909511')); assert.ok(!sameVin('0ZZ0ZMJDXMA909511', '909511X'));
  assert.equal(vinYear('0ZZ0ZMJDXMA909511', 2026), 2021);
});

test('vinIndex finds a row by full VIN or by a unique tail', () => {
  const idx = vinIndex([{ vin: '0ZZ0ZMJDXMA909511' }, { vin: 'NA140940' }]);
  assert.equal(idx.get('MA909511').vin, '0ZZ0ZMJDXMA909511');
  assert.equal(idx.get('0ZZ54RK49NA140940').vin, 'NA140940');
  assert.equal(idx.get('XXXXX'), null);
});

test('ids and aging buckets', () => {
  assert.equal(normId('d-00412'), 'D00412'); assert.equal(normId('00412'), '412');
  assert.deepEqual([0, 30, 31, 61, 91, null].map((d) => ageBucket(d)), ['0-30', '0-30', '31-60', '61-90', '90+', 'unknown']);
  assert.deepEqual(bucketLabels([7, 14]), ['0-7', '8-14', '14+']);
});

test('party names: legal forms dropped, a short name joins one longer name only', () => {
  assert.equal(partyKey('Harbor Auto Finance, LLC'), partyKey('Harbor Auto Finance'));
  assert.ok(sameParty('Harbor', 'Harbor Auto Finance'));
  const g = partyGrouper(['Summit', 'Summit Credit Union', 'Summit Bank']);
  assert.equal(g('Summit'), 'summit', 'two longer names: not guessed');
});

test('yes/no in several languages, and tally', () => {
  assert.deepEqual(['Y', 'yes', 'ja', 'oui', 'はい', 'no', 'nein', '', 'maybe'].map(yes), [true, true, true, true, true, false, false, null, null]);
  assert.deepEqual(tally([{ k: 'a' }, { k: 'b' }, { k: 'a' }], (r) => r.k, 'key'), [{ key: 'a', count: 2 }, { key: 'b', count: 1 }]);
});

test('masking: customer and staff fields become stable pseudonyms; text is scrubbed', () => {
  const m = new PiiMasker();
  const out = m.maskResult({ customer: 'Dana Whitfield', salesperson: 'Avery Lund', phone: '555-201-3344', why: 'Call Dana Whitfield at dana@example.test' });
  assert.match(out.customer, /^CU-[0-9a-f]{8}$/); assert.match(out.salesperson, /^ST-[0-9a-f]{8}$/); assert.equal(m.maskResult({ technician: 'Avery Lund' }).technician, out.salesperson); assert.ok(m.same('Avery Lund', out.salesperson, 'staff')); assert.equal(out.phone, '[PHONE]');
  assert.equal(out.why, `Call ${out.customer} at [EMAIL]`);
  assert.equal(new PiiMasker().maskResult({ customer: 'Whitfield, Dana' }).customer, out.customer, 'same person, same pseudonym');
  assert.equal(piiKindOf('vin'), null); assert.equal(piiKindOf('vin', 'strict'), 'vin');
});

const spec = (run) => checkAgent({ name: 'fairdrive-test-agent', version: '0.0.1', prefix: 'testing', description: 'Test agent.', sources: { a: { label: 'A', args: ['a'], fields: { id: { aliases: ['ID'], required: true }, customer: { aliases: [], pii: 'name' } } }, b: { label: 'B', args: ['b'], fields: { code: { aliases: ['Code'], required: true } } } },
  args: { a: { type: 'string', description: 'File A' }, b: { type: 'string', description: 'File B' } }, required: ['a', 'b'], run, line: (r) => `${r.n} rows`,
  scan: { name: 'testing_scan', title: 'Scan', description: 'Scan.' }, report: { base: 'testing', title: 'Test', columns: ['id'] },
  refused: [{ name: 'bank_pay', category: 'move_money', description: 'Never pays.' }] });

test('checkAgent: scan, report and refused tools, a default block, and one-click categories never allowed', () => {
  const m = spec(() => ({ n: 0, items: [] }));
  assert.deepEqual(m.tools.map((t) => t.name), ['testing_scan', 'testing_write_report', 'bank_pay']);
  assert.equal(m.policy.rules.at(-1).decision, 'block');
  for (const t of m.tools) if (ONE_CLICK_CATEGORIES.includes(t.category)) assert.notEqual(m.policy.rules.find((r) => r.tool === t.name).decision, 'allow');
});

test('runtime: the same file given for two arguments is read once per argument, each with its own columns', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fd-two-'));
  writeFileSync(join(root, 'x.csv'), 'ID,Code,customer\n1,Z,Pat Example\n');
  let seen;
  const m = spec((a, ctx) => { const A = ctx.records(a.a); const B = ctx.records(a.b); seen = { A: Object.keys(A[0]), B: Object.keys(B[0]) }; return { n: A.length, items: A }; });
  const r = await new AgentRuntime(m, { root, audit: false }).call('testing_scan', { a: 'x.csv', b: 'x.csv' });
  assert.equal(r.status, 'executed', r.reason);
  assert.ok(seen.A.includes('id') && seen.B.includes('code'), JSON.stringify(seen));
  assert.doesNotMatch(JSON.stringify(r), /Pat Example/, 'the customer name is masked in the result');
});

test('safePath refuses over-long paths before the file system sees them (a recursive mkdir would hang on Windows)', async () => {
  const { safePath } = await import('../src/util.js');
  assert.throws(() => safePath(tmpdir(), 'A'.repeat(200000)), /too long/);
  assert.throws(() => safePath(tmpdir(), `out/${'B'.repeat(300)}/x.csv`), /too long/);
  assert.ok(safePath(tmpdir(), 'fairdrive-out/ok'));
});

test('vinYear: a numeric 7th character means 1980-2009, a letter 2010-2039 (never past next year)', () => {
  assert.equal(vinYear('0ZZ12345XFAB12345', 2026), 1985, 'numeric 7th character: F is 1985');
  assert.equal(vinYear('0ZZ123A5XFAB12345', 2026), 2015, 'letter 7th character: F is 2015');
  assert.equal(vinYear('0ZZ123A5XWAB12345', 2026), 1998, 'W would be 2028, after next year: 1998');
  assert.equal(vinYear('0ZZ123456', 2026), null);
});
