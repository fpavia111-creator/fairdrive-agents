import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentRuntime } from 'fairdrive-core';
import { manifest } from '../src/index.js';

const FIX = fileURLToPath(new URL('../fixtures', import.meta.url));

test('the model sees salespeople as ST- pseudonyms and can draft a sheet with one; the draft file keeps the real name', async () => {
  const root = mkdtempSync(join(tmpdir(), 'commissions-st-')); cpSync(FIX, join(root, 'fixtures'), { recursive: true });
  const rt = new AgentRuntime(manifest, { root, stateDir: null, audit: false, mode: 'auto', autoActions: ['commissions_draft_sheet'] });
  const args = { deals: 'fixtures/deals.csv', plans: 'fixtures/pay-plans.csv' };
  const r = await rt.call('commissions_compute', args);
  assert.equal(r.status, 'executed');
  const names = r.result.by_salesperson.map((x) => x.salesperson);
  assert.ok(names.every((n) => /^ST-[0-9a-f]{8}$/.test(n)), names.join(', '));
  assert.ok(!JSON.stringify(r).includes('Bianca Sol'));
  const bianca = r.result.lines.find((l) => l.deal_number === 'D14003').salesperson;
  const d = await rt.call('commissions_draft_sheet', { ...args, salesperson: bianca, period: 'November 2026' });
  assert.equal(d.status, 'executed', d.reason);
  assert.equal(d.result.id, bianca, 'the draft is named by the pseudonym, never the name');
  assert.ok(!JSON.stringify(d).includes('Bianca Sol'));
  assert.ok(d.result.draft.endsWith(`sheet-${bianca}.md`));
  assert.match(readFileSync(join(root, d.result.draft), 'utf8'), /Bianca Sol/, 'the file on disk keeps the real name');
});
