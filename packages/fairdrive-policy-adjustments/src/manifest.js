import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { ADJ_FIELDS, checkPolicy, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  adjustments: { type: 'string', description: 'Policy and goodwill adjustments under --root (CSV, Excel or JSON) from the DMS: RO number, date, advisor, customer, VIN, amount, reason, approved by' },
  approval_limit: { type: 'number', minimum: 0, maximum: 100000, description: 'Adjustments above this amount are listed for a manager review (default 250)' },
  repeat_days: { type: 'integer', minimum: 1, maximum: 365, description: 'A second adjustment on the same vehicle within this many days is listed (default 90)' },
};
const run = (a, ctx) => checkPolicy(ctx.records(a.adjustments), { approvalLimit: a.approval_limit ?? 250, repeatDays: a.repeat_days ?? 90 });

export const manifest = checkAgent({
  name: 'fairdrive-policy-adjustments', version: pkg.version, prefix: 'policy',
  description: 'Lists policy and goodwill adjustments with no approver, approved by the advisor who wrote them, over your review line, with no reason, or repeated on the same vehicle, and totals adjustments by advisor and by reason. It never posts, changes or reverses an adjustment.',
  sources: { adjustments: { label: 'Policy adjustments', args: ['adjustments'], fields: ADJ_FIELDS } },
  args, required: ['adjustments'], run, line,
  scan: { name: 'policy_check', title: 'Check policy and goodwill adjustments', description: 'One row per adjustment that needs a look, largest first: RO, advisor, amount, reason, approver, findings (no_approver, self_approved, large_adjustment, no_reason, repeat_vehicle). Totals by advisor and by reason.' },
  report: { base: 'policy-adjustments', what: 'policy adjustment report', title: 'Policy and goodwill adjustments', columns: ['ro_number', 'date', 'advisor', 'customer', 'vin', 'amount', 'reason', 'approved_by', 'findings', 'why'],
    sections: (r) => [{ title: 'By advisor', rows: r.by_advisor, columns: ['advisor', 'adjustments', 'amount'] }, { title: 'By reason', rows: r.by_reason, columns: ['reason', 'adjustments', 'amount'] }],
    limits: [LIMITS.files, 'It reads the approver as written; it cannot tell whether that person had authority.', LIMITS.pii] },
  refused: [{ name: 'dms_post_policy', category: 'production_deploy', description: 'It never posts, changes or reverses a policy adjustment.' }, { name: 'gl_post_entry', category: 'production_deploy', description: 'It never posts to the ledger.' }],
  prompt: { name: 'policy_adjustments', title: 'Review policy adjustments', description: 'Walks the host model through a policy review.', arguments: [{ name: 'adjustments', description: 'Policy adjustments', required: true }],
    text: 'You are helping a service director or controller with fairdrive-policy-adjustments. Adjustments: {{adjustments}}.\n\nRules: it reads files and writes a report. It never posts or reverses anything. Customer names are masked.\n\n1. Call policy_check with the store review line. Lead with self-approved and unapproved adjustments.\n2. Call policy_write_report.' },
});
