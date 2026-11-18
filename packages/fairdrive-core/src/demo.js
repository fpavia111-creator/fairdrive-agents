import { mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRuntime } from './runtime.js';

/** Copy bundled fixtures into a temp folder and return a runtime rooted there. */
export function demoRuntime(manifest, fixturesDir, options = {}) {
  const root = mkdtempSync(join(tmpdir(), `${manifest.name}-demo-`));
  cpSync(fixturesDir, root, { recursive: true });
  return new AgentRuntime(manifest, { root, ...options });
}

export function printStep(label, r) {
  const head = `\n▶ ${label}\n  status: ${r.status}  decision: ${r.decision}${r.approved_by ? `  approved by: ${r.approved_by}` : ''}${r.auto ? '  (auto)' : ''}`;
  process.stdout.write(head + '\n');
  if (r.reason && r.status !== 'executed') process.stdout.write(`  reason: ${r.reason}\n`);
  if (r.result && r.result.summary) process.stdout.write(`  ${r.result.summary}\n`);
}

/**
 * The demo every Fairdrive check runs: the check, the report, and (when the agent drafts
 * something) the draft, the one-click request that waits for a named person even in Auto,
 * the same request after the click, and a refused tool. `show(result)` prints a few lines.
 */
export async function checkDemo(manifest, fixturesDir, { intro, args, show, draft = null, refused = null }) {
  const scanTool = manifest.tools.find((t) => t.kind === 'read').name;
  const draftTool = manifest.tools.find((t) => /_draft_/.test(t.name));
  const reqTool = manifest.tools.find((t) => /_request_/.test(t.name));
  const rt = demoRuntime(manifest, fixturesDir, { mode: 'auto', autoActions: draftTool ? [draftTool.name] : [] });
  process.stdout.write(`${intro}
`);
  const r = await rt.call(scanTool, args);
  printStep('Run the check on the exported files', r);
  if (show && r.result) for (const line of show(r.result).slice(0, 12)) process.stdout.write(`    ${line}
`);
  printStep('Write the report (CSV and HTML)', await rt.call(`${manifest.tools[0].name.split('_')[0]}_write_report`, args));
  if (draft && draftTool && reqTool) {
    const d = await rt.call(draftTool.name, { ...args, ...draft.args });
    printStep(draft.label || 'Write the draft', d);
    if (d.status === 'executed') {
      const a = { draft: d.result.draft, draft_sha256: d.result.draft_sha256, accept_open_issues: true, note: draft.note || 'Open items checked by phone (fictional)' };
      const p = await rt.call(reqTool.name, a);
      printStep('Approve it: waits for a named person, even in Auto', p);
      if (p.approval_id) { rt.approvals.approve(p.approval_id, 'Jordan Reyes (fictional)'); printStep('The same call after the click (recorded; a person acts on it)', await rt.call(reqTool.name, a)); }
    }
  }
  if (refused) printStep(`The agent tries ${refused} itself`, await rt.call(refused, {}));
}
