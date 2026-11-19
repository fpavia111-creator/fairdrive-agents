#!/usr/bin/env node
// Writes sample-reports/: the HTML and CSV reports a few agents write on their own fictional
// fixtures, in English, plus an index page. Run again after changing an agent or a fixture.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, copyFileSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages');
const OUT = join(ROOT, 'sample-reports');
const { AgentRuntime, escapeHtml, htmlPage } = await import(pathToFileURL(join(PK, 'fairdrive-core', 'src', 'index.js')).href);
const PICK = ['fairdrive-floorplan-audit', 'fairdrive-contracts-in-transit', 'fairdrive-deal-jackets', 'fairdrive-warranty-claims', 'fairdrive-repair-order-margins', 'fairdrive-trade-payoffs', 'fairdrive-estimate-vs-invoice', 'fairdrive-gl-schedules'];
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) rmSync(join(OUT, f), { force: true });
const rows = [];
for (const n of PICK) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const cases = JSON.parse(readFileSync(join(PK, n, 'evals', 'cases.json'), 'utf8')).cases;
  const c = cases.find((x) => /_write_report$/.test(x.tool) && (!x.mode || x.mode === 'assist'));
  const root = mkdtempSync(join(tmpdir(), `${n}-sample-`));
  cpSync(join(PK, n), root, { recursive: true, filter: (p) => !/node_modules|fairdrive-out/.test(p) });
  const r = await new AgentRuntime(manifest, { root, audit: false }).call(c.tool, c.args);
  if (r.status !== 'executed') throw new Error(`${n}: ${r.reason}`);
  const short = n.replace(/^fairdrive-/, '');
  for (const f of r.result.files) { const ext = f.split('.').pop(); copyFileSync(resolve(root, f), join(OUT, `${short}.${ext}`)); }
  rows.push({ n, short, summary: r.result.summary.replace(/^Report written\.\s*/, '') });
  rmSync(root, { recursive: true, force: true });
}
const body = [
  '<h1>Fairdrive sample reports</h1>',
  '<p class="mut">Written by the agents themselves on their bundled fictional fixtures (made-up stores, customers, lenders, insurers and vehicles). Each page has a CSV twin with the same rows for people to work.</p>',
  '<table><thead><tr><th>Agent</th><th>What the run found</th><th>Files</th></tr></thead><tbody>',
  ...rows.map((x) => `<tr><td>${escapeHtml(x.n)}</td><td>${escapeHtml(x.summary)}</td><td><a href="${x.short}.html">HTML</a> · <a href="${x.short}.csv">CSV</a></td></tr>`),
  '</tbody></table>',
].join('\n');
writeFileSync(join(OUT, 'index.html'), htmlPage({ title: 'Fairdrive sample reports', bodyHtml: body, footer: 'Fictional data only. Nothing was sent, paid, funded, titled or posted.', lang: 'en' }));
console.log(`${rows.length} sample report(s) in sample-reports/`);
