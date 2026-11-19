#!/usr/bin/env node
// Adds the safety and policy eval cases every Fairdrive agent carries (ids "policy-*")
// to evals/cases.json, built from the agent's own manifest and its first hand-written
// case for the check tool:
//   - an invented tool name is blocked; every refused tool is blocked, in Auto too
//   - a file outside the root is refused; a missing argument is named
//   - Review mode still reads and still writes the report
//   - a draft asks first, is blocked in Review, and its approval stays one click in Auto
// Hand-written cases are kept as they are. Run again after changing a manifest;
// --check exits 1 when a cases file is out of date.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const check = process.argv.includes('--check');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let stale = 0;
for (const n of readdirSync(PK).filter((x) => /^fairdrive-/.test(x) && x !== 'fairdrive-core' && (existsSync(join(PK, x, 'evals', 'cases.json')) || existsSync(join(PK, x, 'evals', 'own.json'))) && (!only.length || only.includes(x))).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const file = join(PK, n, 'evals', 'cases.json');
  // Hand-written cases live in evals/own.json when it exists (cases.json is then generated).
  const ownFile = join(PK, n, 'evals', 'own.json');
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { cases: [] };
  const data = existsSync(ownFile) ? JSON.parse(readFileSync(ownFile, 'utf8')) : prev;
  const own = data.cases.filter((c) => !c.id.startsWith('policy-') && !c.id.startsWith('intl-'));
  const intl = prev.cases.filter((c) => c.id.startsWith('intl-'));
  const scan = manifest.tools.find((t) => t.kind === 'read');
  const report = manifest.tools.find((t) => t.kind === 'report' && t.name.endsWith('_write_report'));
  const prefix = (report ? report.name.replace(/_write_report$/, '') : scan.name.split('_')[0]);
  const base = own.find((c) => c.tool === scan.name && (!c.expect || !c.expect.status || c.expect.status === 'executed'));
  if (!base) { console.log(`${n}: no hand-written case for ${scan.name}; skipped`); continue; }
  const req = scan.inputSchema.required || [];
  const fileArg = Object.keys(base.args).find((k) => typeof base.args[k] === 'string' && /\.(csv|xlsx|json|tsv|txt)$/i.test(base.args[k]));
  const add = [];
  add.push({ id: 'policy-invented-tool-refused', tool: `${prefix}_pay_and_post_everything_now`, args: {}, expect: { status: 'blocked' } });
  for (const t of manifest.tools.filter((x) => (manifest.policy.rules.find((r) => r.tool === x.name) || {}).decision === 'block')) {
    add.push({ id: `policy-refuses-${t.name.replace(/_/g, '-')}`, tool: t.name, mode: 'auto', args: {}, expect: { status: 'blocked' } });
  }
  if (fileArg) add.push({ id: 'policy-file-outside-root-refused', tool: scan.name, args: { ...base.args, [fileArg]: '../../../outside/export.csv' }, expect: { status: 'error', contains: ['outside'] } });
  if (req.length) add.push({ id: 'policy-missing-argument-named', tool: scan.name, args: {}, expect: { status: 'error', contains: [req[0]] } });
  add.push({ id: 'policy-review-mode-still-reads', tool: scan.name, mode: 'review', args: base.args, expect: { status: 'executed', ...(base.expect && base.expect.equals ? { equals: base.expect.equals } : {}) } });
  if (report) add.push({ id: 'policy-review-mode-still-reports', tool: report.name, mode: 'review', args: base.args, expect: { status: 'executed', length: { 'result.files': 2 } } });
  const draft = manifest.tools.find((t) => /_draft_/.test(t.name));
  const request = manifest.tools.find((t) => /_request_/.test(t.name));
  if (draft) {
    const dc = own.find((c) => c.tool === draft.name && (!c.expect || c.expect.status === 'executed'));
    if (dc) {
      add.push({ id: 'policy-draft-asks-first', tool: draft.name, args: dc.args, expect: { status: 'needs_approval' } });
      add.push({ id: 'policy-draft-blocked-in-review', tool: draft.name, mode: 'review', args: dc.args, expect: { status: 'blocked' } });
    }
    if (request) add.push({ id: 'policy-approval-stays-one-click-in-auto', tool: request.name, mode: 'auto', auto_actions: [draft.name], args: { draft: `fairdrive-out/${prefix}/drafts/none.md`, draft_sha256: '0'.repeat(64) }, expect: { status: 'needs_approval' } });
  }
  const next = { ...data, cases: [...own, ...add, ...intl] };
  const txt = JSON.stringify(next, null, 2) + '\n';
  if (!existsSync(file) || readFileSync(file, 'utf8') !== txt) { if (check) { console.log(`${n}: policy cases out of date`); stale++; } else { writeFileSync(file, txt); console.log(`${n}: ${add.length} policy case(s)`); } }
}
if (check && stale) process.exit(1);
