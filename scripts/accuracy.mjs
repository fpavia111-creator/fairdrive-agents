#!/usr/bin/env node
// Accuracy on fictional data, per agent and for the family.
//
//   node scripts/accuracy.mjs [agent ...] [--show] [--json]
//
// Each agent's fixtures/accuracy.json says:
//   case       the hand-written eval case that reads the planted fixtures (evals/own.json, or the
//              hand-written cases in evals/cases.json)
//   id         the item field(s) that name a finding (joined with "/")
//   planted    every problem planted in the fixtures, as [item id, finding code]; each one was
//              checked by hand against the fixture rows
//   lists      other result lists that carry findings (for example statement lines that match no
//              contract): { "<result key>": { "id": field(s), "code": "<code>" } }
//   only_when  codes that are information lines unless a field is true (a contract in transit is
//              only a problem once it is over the alert days): { "<code>": "<field>" }
//   clean      edits that turn the planted files into a clean set: drop the rows that carry a
//              planted problem, or repair one cell. The clean set must give no finding at all.
//   mutations  one fact changed in the clean set (usually one cell); every finding listed under
//              "expect" must appear and nothing else may.
//
// Finding codes come from the item's "finding", "findings", "gaps" (OFAC/Red Flags) or
// "missing_codes"/"unsigned_codes" (deal jackets, as missing:<doc> / unsigned:<doc>), else from
// the item's class field or the spec's "code".
// Recall = planted findings returned / planted findings. False positives = findings on the planted
// set that are not planted, plus findings on the clean set. Writes docs/accuracy.md and
// docs/accuracy.json. Fictional data only; no network; nothing outside a temporary folder is written
// except those two files.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); const PK = join(ROOT, 'packages');
const { AgentRuntime, parseCsv, toCsv } = await import(pathToFileURL(join(PK, 'fairdrive-core', 'src', 'index.js')).href);
const argv = process.argv.slice(2); const only = argv.filter((a) => !a.startsWith('--')); const show = argv.includes('--show');
const agents = readdirSync(PK).filter((n) => n !== 'fairdrive-core' && existsSync(join(PK, n, 'fixtures', 'accuracy.json')) && (!only.length || only.includes(n))).sort();
const allAgents = readdirSync(PK).filter((n) => n !== 'fairdrive-core').length;

const key = ([id, code]) => `${id} :: ${code}`;
const idOf = (it, f) => [].concat(f).map((k) => String(it[k] ?? '')).join('/');
function codesOf(it, spec) {
  const c = [];
  if (typeof it.finding === 'string' && it.finding) c.push(it.finding);
  if (Array.isArray(it.findings)) c.push(...it.findings.map((f) => (typeof f === 'string' ? f : f.code)));
  if (Array.isArray(it.gaps)) c.push(...it.gaps);
  if (Array.isArray(it.missing_codes)) c.push(...it.missing_codes.map((x) => `missing:${x}`));
  if (Array.isArray(it.unsigned_codes)) c.push(...it.unsigned_codes.map((x) => `unsigned:${x}`));
  if (!c.length && spec.class_field && it[spec.class_field]) c.push(String(it[spec.class_field]));
  if (!c.length && spec.code) c.push(spec.code);
  return c;
}
function findingsOf(r, spec) {
  const out = []; const info = [];
  for (const it of (r.result && r.result.items) || []) for (const code of codesOf(it, spec)) {
    const gate = (spec.only_when || {})[code];
    (gate && !it[gate] ? info : out).push([idOf(it, spec.id), code]);
  }
  for (const [list, l] of Object.entries(spec.lists || {})) for (const it of (r.result && r.result[list]) || []) out.push([typeof it === 'string' ? it : idOf(it, l.id), l.code]);
  return { out, info };
}

// Edits to the files of one case, in a sandbox root. CSV: dropWhere {column: [values]},
// set [{where: [column, value] or [[column, value], ...], column, value}] (where must match one row).
function edit(root, args, edits = []) {
  for (const e of edits) {
    const rel = args[e.arg]; if (!rel) throw new Error(`no argument "${e.arg}"`); const f = join(root, rel);
    const rows = parseCsv(readFileSync(f, 'utf8')); const cols = Object.keys(rows[0] || {}); let keep = rows;
    for (const [col, vals] of Object.entries(e.dropWhere || {})) { if (!cols.includes(col)) throw new Error(`${rel}: no column ${col}`); keep = keep.filter((r) => !vals.includes(String(r[col]))); }
    for (const s of e.set || []) {
      const conds = Array.isArray(s.where[0]) ? s.where : [s.where];
      const hit = keep.filter((r) => conds.every(([c, v]) => String(r[c]) === String(v)));
      if (hit.length !== 1) throw new Error(`${rel}: ${hit.length} rows match ${JSON.stringify(s.where)}`);
      if (!cols.includes(s.column)) throw new Error(`${rel}: no column ${s.column}`);
      hit[0][s.column] = s.value;
    }
    writeFileSync(f, toCsv(keep, cols, { raw: true }));
  }
}
const rowsIn = (root, args) => Object.values(args).filter((v) => typeof v === 'string' && /\.csv$/i.test(v) && existsSync(join(root, v))).reduce((n, v) => n + parseCsv(readFileSync(join(root, v), 'utf8')).length, 0);

async function run(n, manifest, spec, c, edits) {
  const parent = mkdtempSync(join(tmpdir(), `acc-${n}-`)); const root = join(parent, 'root'); cpSync(join(PK, n, 'fixtures'), join(root, 'fixtures'), { recursive: true });
  try {
    edit(root, c.args, edits);
    // Masking off: findings are matched on the fixture's own ids and names (masking is checked by the canary tests).
    const rt = new AgentRuntime(manifest, { root, stateDir: null, audit: false, pii: 'off' });
    const r = await rt.call(c.tool, c.args); if (r.status !== 'executed') throw new Error(`${c.tool}: ${r.status} ${r.reason || ''}`);
    return { ...findingsOf(r, spec), rows: rowsIn(root, c.args) };
  } finally { rmSync(parent, { recursive: true, force: true }); }
}
const casesOf = (n) => { const f = join(PK, n, 'evals', existsSync(join(PK, n, 'evals', 'own.json')) ? 'own.json' : 'cases.json'); return JSON.parse(readFileSync(f, 'utf8')).cases.filter((x) => !/^(policy|intl)-/.test(x.id)); };

const results = [];
for (const n of agents) {
  const spec = JSON.parse(readFileSync(join(PK, n, 'fixtures', 'accuracy.json'), 'utf8'));
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const c = casesOf(n).find((x) => x.id === spec.case); if (!c) throw new Error(`${n}: no eval case ${spec.case}`);
  const row = { agent: n, case: spec.case, problems: [] };
  const p = await run(n, manifest, spec, c, []); const got = new Set(p.out.map(key)); const want = new Set(spec.planted.map(key));
  if (want.size !== spec.planted.length) row.problems.push('planted list has duplicates');
  row.planted_rows = p.rows; row.planted_total = want.size; row.planted_found = [...want].filter((k) => got.has(k)).length;
  const extra = [...got].filter((k) => !want.has(k)); row.planted_extra = extra.length;
  for (const k of [...want].filter((x) => !got.has(x))) row.problems.push(`missed: ${k}`);
  for (const k of extra) row.problems.push(`not planted: ${k}`);
  const cl = await run(n, manifest, spec, c, spec.clean); row.clean_rows = cl.rows; row.clean_findings = cl.out.length; row.clean_info_lines = cl.info.length;
  for (const f of cl.out) row.problems.push(`clean set: ${key(f)}`);
  row.mutations = (spec.mutations || []).length; row.mutations_caught = 0;
  for (const m of spec.mutations || []) {
    const r = await run(n, manifest, spec, c, [...spec.clean, ...m.edits]); const g = new Set(r.out.map(key)); const e = new Set(m.expect.map(key));
    const miss = [...e].filter((k) => !g.has(k)); const more = [...g].filter((k) => !e.has(k));
    if (!miss.length && !more.length) row.mutations_caught++;
    for (const k of miss) row.problems.push(`mutation "${m.name}" missed: ${k}`);
    for (const k of more) row.problems.push(`mutation "${m.name}" also gave: ${k}`);
    if (show) console.log(`   mutation ${m.name}: ${[...g].join(' | ') || '(none)'}`);
  }
  if (show) { console.log(`\n## ${n}\n planted run: ${p.out.map(key).join(' | ')}\n info lines: ${p.info.map(key).join(' | ')}\n clean run: ${cl.out.map(key).join(' | ') || '(none)'}  info: ${cl.info.map(key).join(' | ') || '(none)'}`); }
  results.push(row);
}

const sum = (k) => results.reduce((s, r) => s + (r[k] || 0), 0);
const family = { agents_measured: results.length, agents_in_family: allAgents, planted_found: sum('planted_found'), planted_total: sum('planted_total'), planted_extra: sum('planted_extra'), clean_rows: sum('clean_rows'), clean_false_positives: sum('clean_findings'), mutation_cases: sum('mutations'), mutation_caught: sum('mutations_caught'), date: new Date().toISOString().slice(0, 10) };
const md = [
  '# Fairdrive accuracy on fictional test data', '',
  `Written by \`npm run accuracy\` (scripts/accuracy.mjs) on ${family.date}. Fictional fixtures only; no real dealer data.`, '',
  `**Family:** ${family.agents_measured} of ${family.agents_in_family} agents measured. Planted problems found: **${family.planted_found} of ${family.planted_total}**; findings on the planted set that were not planted: **${family.planted_extra}**. Clean set: **${family.clean_rows} rows, ${family.clean_false_positives} findings** (false positives). One-fact mutations caught: **${family.mutation_caught} of ${family.mutation_cases}**.`, '',
  'Planted: every problem written into the fixtures on purpose, listed in each agent\'s `fixtures/accuracy.json`. Clean: the same files with those rows dropped or the one wrong cell repaired; it must give no finding. Mutation: one fact changed in the clean set; exactly the named finding must appear.', '',
  '| Agent | Planted found | Not planted | Clean rows | Clean findings | Mutations caught |', '| --- | --- | --- | --- | --- | --- |',
  ...results.map((r) => `| ${r.agent} | ${r.planted_found} / ${r.planted_total} | ${r.planted_extra} | ${r.clean_rows} | ${r.clean_findings} | ${r.mutations_caught} / ${r.mutations} |`),
  '', results.some((r) => r.problems.length) ? '## Problems\n\n' + results.filter((r) => r.problems.length).map((r) => `- ${r.agent}: ${r.problems.join('; ')}`).join('\n') : 'No problems: every planted finding found, nothing else on the planted set, nothing on the clean set, every mutation caught.', '',
];
if (!only.length) { mkdirSync(join(ROOT, 'docs'), { recursive: true }); writeFileSync(join(ROOT, 'docs', 'accuracy.md'), md.join('\n')); writeFileSync(join(ROOT, 'docs', 'accuracy.json'), JSON.stringify({ family, agents: results }, null, 2) + '\n'); }
if (argv.includes('--json')) console.log(JSON.stringify({ family, agents: results }, null, 2));
else {
  for (const r of results) console.log(`${r.problems.length ? 'FAIL' : 'ok  '} ${r.agent.padEnd(42)} planted ${r.planted_found}/${r.planted_total} (+${r.planted_extra})  clean ${r.clean_rows} rows ${r.clean_findings} findings  mutations ${r.mutations_caught}/${r.mutations}${r.problems.length ? '\n       ' + r.problems.join('\n       ') : ''}`);
  console.log(`\nFamily: planted ${family.planted_found}/${family.planted_total}, not planted ${family.planted_extra}, clean ${family.clean_rows} rows ${family.clean_false_positives} findings, mutations ${family.mutation_caught}/${family.mutation_cases}`);
}
process.exitCode = results.some((r) => r.problems.length) ? 1 : 0;
