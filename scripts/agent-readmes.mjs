#!/usr/bin/env node
// Writes the hand-written part of each agent README from the agent itself (title,
// what it does, what it reads, limits) when the README does not exist yet or was
// written by this script before. scripts/readme-sections.mjs then adds the generated
// part (demo run, tools, columns, install, modes, CLI). A README edited by hand is
// left alone (it no longer carries the marker line).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { modelViewLines } from './lib/model-view.mjs';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const MARK = '<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->';
const ACRONYM = { dmv: 'DMV', ofac: 'OFAC', gl: 'GL' };
const titleOf = (n) => n.split('-').map((w) => ACRONYM[w] || w[0].toUpperCase() + w.slice(1)).join(' ').replace(/^Fairdrive /, 'Fairdrive ').replace(' Vs ', ' vs ');
for (const n of readdirSync(PK).filter((x) => x.startsWith('fairdrive-') && x !== 'fairdrive-core').sort()) {
  const f = join(PK, n, 'README.md');
  if (existsSync(f) && !readFileSync(f, 'utf8').includes(MARK)) continue;
  const { manifest: m } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const scan = m.tools.find((t) => t.kind === 'read');
  const draft = m.tools.find((t) => /_draft_/.test(t.name));
  const req = m.tools.find((t) => /_request_/.test(t.name));
  const refused = m.tools.filter((t) => (m.policy.rules.find((r) => r.tool === t.name) || {}).decision === 'block');
  const sources = Object.values(m.sources || {}).map((s) => `- **${s.label}** (\`${s.args.join('`, `')}\`)`);
  const argLine = (scan.inputSchema.required || []).map((k) => `--${k}`).join(' ');
  const text = [
    MARK, '',
    `# ${titleOf(n)} (\`${n}\`)`, '',
    m.description, '',
    `MIT · Node 20 or newer · local files only · built on [\`fairdrive-core\`](../fairdrive-core) · part of [Fairdrive](../../README.md)`, '',
    '```bash', `npx -y ${n} demo`, `npx -y ${n} mcp --root ./exports`, '```', '',
    '## What it reads', '', ...sources, '',
    'Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent\'s own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.', '',
    '## What it does', '',
    `- \`${scan.name}\`: ${scan.description}`,
    `- \`${m.tools.find((t) => /_write_report$/.test(t.name)).name}\`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with \`--lang\`).`,
    ...(draft ? [`- \`${draft.name}\`: ${draft.description}`, `- \`${req.name}\`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.`] : []),
    ...refused.map((t) => `- \`${t.name}\` is listed and refused: ${t.description.replace(/^Listed so agents can see it is refused\.\s*/, '')}`), '',
    '## What the AI model sees', '',
    ...modelViewLines(m), '',
    '## Limits', '', ...(m.reportLimits || []).map((l) => `- ${l}`), '- Every figure comes from your files and settings. Check it before you act on it.', '',
  ].join('\n');
  // Keep the generated part (readme-sections.mjs) when rewriting.
  const old = existsSync(f) ? readFileSync(f, 'utf8') : '';
  const gen = /<!-- generated:start -->[\s\S]*?<!-- generated:end -->/.exec(old);
  writeFileSync(f, gen ? text.replace('\n## Limits', `\n${gen[0]}\n\n## Limits`) : text);
  console.log(`${n}: README written`);
}
