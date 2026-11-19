import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, exportProfile } from 'fairdrive-core';
import { CLAIM_FIELDS, STATEMENT_FIELDS, checkWarranty, reviewText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  claims: { type: 'string', description: 'Warranty claims submitted under --root (CSV, Excel or JSON) from the DMS warranty schedule: claim number, RO number, VIN, submitted date, labor, parts, total claimed' },
  statement: { type: 'string', description: 'Manufacturer warranty statement: claim number, date, amount paid (negative for a debit), status, reason or debit code' },
  resubmit_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Days after a rejection within which a claim can be resubmitted (default 30; set from the warranty policy manual)' },
  as_of: { type: 'string', format: 'date', description: 'Date to age from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkWarranty(ctx.records(a.claims), ctx.records(a.statement), { asOf: a.as_of, resubmitDays: a.resubmit_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-warranty-claims', version: pkg.version, prefix: 'warranty',
  description: 'Matches warranty claims submitted against the manufacturer warranty statement and lists unpaid claims by age, claims paid short, rejections with the date they must be resubmitted by, and debits after payment, with totals by reason and statement lines with no claim on your schedule. Drafts a review request to the warranty representative for a person to send. It never resubmits or writes off a claim.',
  sources: { claims: { label: 'Warranty claims submitted', args: ['claims'], fields: CLAIM_FIELDS }, statement: { label: 'Manufacturer warranty statement', args: ['statement'], fields: STATEMENT_FIELDS, profiles: [exportProfile('oem_warranty_statement', { claim_number: 'Claim Number', amount_paid: ['Amount Paid', 'Paid Amount'], status: 'Claim Status', reason: ['Debit Code', 'Reason'], paid_date: ['Statement Date', 'Paid Date'] })] } },
  args, required: ['claims', 'statement'], run, line,
  scan: { name: 'warranty_check', title: 'Check warranty claims against the manufacturer statement', description: 'One row per claim that needs action, largest outstanding first: claimed, paid, outstanding, age, resubmit-by date, reason, findings (unpaid, paid_short, rejected, rejected_past_deadline, debited_after_payment). Totals, unpaid by age, by reason, and statement lines not on the schedule.' },
  report: { base: 'warranty-claims', what: 'warranty claims report', title: (r) => `Warranty claims at ${r.as_of}`, columns: ['claim_number', 'ro_number', 'vin', 'submitted_date', 'age_days', 'bucket', 'claimed', 'paid', 'outstanding', 'resubmit_by', 'reason', 'findings', 'why'],
    sections: (r) => [{ title: 'Unpaid by age', rows: r.unpaid_by_age, columns: ['bucket', 'claims', 'amount'] }, { title: 'By reason', rows: r.by_reason, columns: ['reason', 'claims', 'amount'] }, { title: 'Statement lines not on the schedule', rows: r.paid_not_on_schedule, columns: ['claim_number', 'amount'] }],
    limits: [LIMITS.files, 'Resubmission dates use the days you set; the manufacturer warranty policy manual decides.', LIMITS.advice] },
  draft: { noun: 'review', verb: 'send', category: 'binding_send', actor: 'the warranty administrator', title: 'Draft a claim review request',
    description: 'Write drafts/review-<date>.md: claims rejected, paid short or debited, with amounts and the reason given. Marked DRAFT. Sending goes through warranty_request_send (one click).',
    args: { from: { type: 'string', description: 'Your name and dealer code' }, contact: { type: 'string', description: 'Warranty representative contact' } },
    build: (a, ctx, r) => { const d = reviewText(r.items, { from: a.from, contact: a.contact }); if (!d.count) throw new Error('no rejected, short or debited claims to review'); return { id: r.as_of, to: a.contact, text: d.text, amount: d.total, extra: { claims: d.count } }; } },
  refused: [{ name: 'oem_portal_resubmit', category: 'binding_send', description: 'It never submits or resubmits a warranty claim.' }, { name: 'dms_write_off_claim', category: 'production_deploy', description: 'It never writes off a claim or posts to the warranty receivable.' }],
  prompt: { name: 'warranty_claims', title: 'Check warranty claims', description: 'Walks the host model through a warranty review.', arguments: [{ name: 'claims', description: 'Claims submitted', required: true }, { name: 'statement', description: 'Warranty statement', required: true }],
    text: 'You are helping a warranty administrator with fairdrive-warranty-claims. Claims: {{claims}}. Statement: {{statement}}.\n\nRules: it reads files and drafts. It never resubmits a claim.\n\n1. Call warranty_check with the resubmission days from the policy manual. Lead with rejections whose resubmit-by date is close or passed, then unpaid claims over 60 days.\n2. Call warranty_write_report.\n3. Only when asked, warranty_draft_review, then warranty_request_send.' },
});
