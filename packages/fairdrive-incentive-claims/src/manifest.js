import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, exportProfile } from 'fairdrive-core';
import { EXPECTED_FIELDS, STATEMENT_FIELDS, checkIncentives, inquiryText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  expected: { type: 'string', description: 'Incentives you expect per unit under --root (CSV, Excel or JSON): deal number, VIN, sale date, program code, amount expected, claim submitted date, claim number. Holdback as a program line' },
  statement: { type: 'string', description: 'Manufacturer incentive and holdback statement: VIN, program, amount paid (negative for a chargeback), date, status, reason' },
  deadline_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Days after the sale within which a claim must be submitted (default 30; set from the program bulletin)' },
  unpaid_days: { type: 'integer', minimum: 1, maximum: 180, description: 'A submitted claim not on the statement after this many days is flagged (default 45)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkIncentives(ctx.records(a.expected), ctx.records(a.statement), { asOf: a.as_of, deadlineDays: a.deadline_days ?? 30, unpaidDays: a.unpaid_days ?? 45 });

export const manifest = checkAgent({
  name: 'fairdrive-incentive-claims', version: pkg.version, prefix: 'incentives',
  description: 'Matches the manufacturer incentives, rebates, dealer cash and holdback you expect on each unit against the manufacturer statement by VIN and program, and lists claims not submitted (past your deadline or still due), submitted but unpaid, paid short, rejected or charged back, plus statement lines you did not expect. Drafts an inquiry to the incentive desk for a person to send. It never submits a claim.',
  sources: { expected: { label: 'Incentives expected', args: ['expected'], fields: EXPECTED_FIELDS }, statement: { label: 'Manufacturer incentive statement', args: ['statement'], fields: STATEMENT_FIELDS, profiles: [exportProfile('oem_incentive_statement', { vin: 'VIN', program: ['Program Code', 'Program'], amount_paid: ['Amount Paid', 'Paid Amount', 'Credit Amount'], paid_date: ['Statement Date', 'Paid Date'], status: ['Claim Status', 'Status'], reason: ['Reason Code', 'Comment'] })] } },
  args, required: ['expected', 'statement'], run, line,
  scan: { name: 'incentives_check', title: 'Check incentive claims against the manufacturer statement', description: 'One row per expected incentive that needs action, largest outstanding first: expected, paid, outstanding, findings (not_submitted_past_deadline, not_submitted, unpaid, paid_short, rejected, charged_back). Totals and paid lines not expected.' },
  report: { base: 'incentive-claims', what: 'incentive claims report', title: (r) => `Incentive claims at ${r.as_of}`, columns: ['deal_number', 'vin', 'program', 'sale_date', 'claim_submitted', 'claim_number', 'expected', 'paid', 'outstanding', 'findings', 'why'],
    sections: (r) => [{ title: 'Paid lines not expected', rows: r.paid_not_expected, columns: ['vin', 'program', 'amount', 'paid_date'] }],
    limits: [LIMITS.files, 'Program rules, amounts and deadlines are the ones in your file and settings; the current program bulletin decides.', LIMITS.advice] },
  draft: { noun: 'inquiry', verb: 'send', category: 'binding_send', actor: 'the incentive or office manager', title: 'Draft an inquiry to the incentive desk',
    description: 'Write drafts/inquiry-<date>.md: claims unpaid, paid short, rejected or charged back, with VIN, program and amounts. Marked DRAFT. Sending goes through incentives_request_send (one click).',
    args: { from: { type: 'string', description: 'Your name and dealer code' }, contact: { type: 'string', description: 'Manufacturer incentive desk contact' } },
    build: (a, ctx, r) => { const d = inquiryText(r.items, { from: a.from, contact: a.contact }); if (!d.count) throw new Error('no unpaid, short, rejected or charged-back claims to ask about'); return { id: r.as_of, to: a.contact, text: d.text, amount: d.total, extra: { claims: d.count } }; } },
  refused: [{ name: 'oem_portal_submit_claim', category: 'binding_send', description: 'It never submits or resubmits an incentive claim.' }, { name: 'gl_post_receivable', category: 'production_deploy', description: 'It never posts to the factory receivable.' }],
  prompt: { name: 'incentive_claims', title: 'Check incentive claims', description: 'Walks the host model through an incentive review.', arguments: [{ name: 'expected', description: 'Expected incentives', required: true }, { name: 'statement', description: 'Manufacturer statement', required: true }],
    text: 'You are helping an incentive or office manager with fairdrive-incentive-claims. Expected: {{expected}}. Statement: {{statement}}.\n\nRules: it reads files and drafts. It never submits a claim. Program bulletins decide rules and deadlines.\n\n1. Call incentives_check with the deadline from the bulletin. Lead with claims not submitted past the deadline (money at risk), then rejected and charged back.\n2. Call incentives_write_report.\n3. Only when asked, incentives_draft_inquiry, then incentives_request_send.' },
});
