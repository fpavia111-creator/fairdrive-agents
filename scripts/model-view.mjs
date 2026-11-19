#!/usr/bin/env node
// What reaches the AI model, per agent: masked fields, fields sent as they are, and free text.
// Also counts the masking canaries (fictional names each agent's contract test proves never reach
// a result). Writes docs/model-view.md.   npm run model-view
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { modelView } from './lib/model-view.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); const PK = join(ROOT, 'packages');
const rows = []; let canaries = 0, noCustomer = 0;
for (const n of readdirSync(PK).filter((x) => x !== 'fairdrive-core' && existsSync(join(PK, x, 'src', 'index.js'))).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const own = JSON.parse(readFileSync(join(PK, n, 'evals', existsSync(join(PK, n, 'evals', 'own.json')) ? 'own.json' : 'cases.json'), 'utf8'));
  const c = (own.pii_canaries || []).length; canaries += c; if (own.pii_none) noCustomer++;
  const v = modelView(manifest);
  rows.push(`| ${n.replace(/^fairdrive-/, '')} | ${v.masked.map((m) => `${m.field} (${m.label})`).join(', ') || 'none read'} | ${[...v.clear, ...v.vin].join(', ')} | ${v.dates.length} dates, ${v.amounts.length} amounts | ${v.free_text.join(', ') || 'none'} | ${c || (own.pii_none ? 'no customer column' : 0)} |`);
}
const md = [
  '# What reaches the AI model (Fairdrive)', '',
  'Written by `npm run model-view` from each agent\'s own source fields and the core masker in its default mode (`--pii mask`). Every tool result passes through the masker before it leaves the agent.', '',
  '- **Masked:** customer names, co-buyers, owners and insureds (`CU-` pseudonyms); staff names: salespeople, technicians, advisors, F&I managers and approvers (`ST-` pseudonyms); phones, e-mails, addresses and SSN-like numbers (placeholders); account, customer and licence numbers. A masked value is also replaced wherever it appears inside other text.',
  '- **Sent as they are:** deal, stock, RO, claim, PO and contract numbers; VINs (pseudonymised with `--pii strict`); dates; amounts; business names (lenders, providers, vendors, insurers, agencies).',
  '- **Free text** (descriptions, reasons, stips, concerns) is sent as written, with known names and phone, e-mail and SSN patterns replaced. Anything else a person typed there reaches the model.',
  '- Results go to whatever model the user\'s AI assistant uses. For data that may not be shared with that provider, use a local model or one covered by the user\'s agreements. No claim of compliance with any law or standard is made.', '',
  `Masking canaries: ${canaries} fictional customer names across the agents, each proven by a contract test never to reach a result; ${noCustomer} agents read no customer column and say so.`, '',
  '| Agent | Masked | Ids, codes, VINs and business names sent | Dates, amounts | Free text sent | Canaries |', '| --- | --- | --- | --- | --- | --- |',
  ...rows, '',
];
mkdirSync(join(ROOT, 'docs'), { recursive: true }); writeFileSync(join(ROOT, 'docs', 'model-view.md'), md.join('\n'));
console.log(`docs/model-view.md: ${rows.length} agents, ${canaries} canaries, ${noCustomer} with no customer column`);
