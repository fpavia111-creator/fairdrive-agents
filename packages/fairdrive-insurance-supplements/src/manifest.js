import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, partyIs } from 'fairdrive-core';
import { SUPPLEMENT_FIELDS, trackSupplements, followUpText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  supplements: { type: 'string', description: 'Supplement log under --root (CSV, Excel or JSON) from the estimating or shop system: RO number, claim number, insurer, supplement number, submitted date, amount requested, status, response date, amount approved, customer' },
  follow_up_days: { type: 'integer', minimum: 1, maximum: 60, description: 'A supplement with no answer after this many days is listed for follow-up (default 5)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => trackSupplements(ctx.records(a.supplements), { asOf: a.as_of, followUpDays: a.follow_up_days ?? 5 });

export const manifest = checkAgent({
  name: 'fairdrive-insurance-supplements', version: pkg.version, prefix: 'supplements',
  description: 'Tracks every supplement a body shop sends to an insurer: lists those waiting past your follow-up days, approved short and denied, and totals requested, approved and waiting amounts and the average days to an answer by insurer. Drafts a follow-up to one insurer\'s adjuster for a person to send. It never submits anything to an insurer.',
  sources: { supplements: { label: 'Supplement log', args: ['supplements'], fields: SUPPLEMENT_FIELDS } },
  args, required: ['supplements'], run, line,
  scan: { name: 'supplements_track', title: 'Track insurance supplements', description: 'One row per supplement that needs action, largest first: claim, RO, insurer, supplement number, sent date, days waiting, requested, approved, finding (pending_over, approved_short, denied). Totals and a table by insurer with average days to an answer.' },
  report: { base: 'insurance-supplements', what: 'supplement report', title: (r) => `Insurance supplements at ${r.as_of}`, columns: ['finding', 'ro_number', 'claim_number', 'insurer', 'customer', 'supplement_number', 'submitted_date', 'days_waiting', 'requested', 'approved', 'amount', 'why'],
    sections: (r) => [{ title: 'By insurer', rows: r.by_insurer, columns: ['insurer', 'supplements', 'requested', 'approved', 'pending', 'average_days_to_response'] }],
    limits: [LIMITS.files, LIMITS.pii] },
  draft: { noun: 'follow_up', verb: 'send', category: 'binding_send', actor: 'the shop manager', title: 'Draft a supplement follow-up to one insurer',
    description: 'Write drafts/follow_up-<insurer>.md: supplements waiting past the follow-up days with one insurer, with claim, RO and amount. Marked DRAFT. Sending goes through supplements_request_send (one click).',
    required: ['supplements', 'insurer'], args: { insurer: { type: 'string', description: 'Insurer as named in the supplement log' }, from: { type: 'string', description: 'Your name and shop' }, contact: { type: 'string', description: 'Adjuster contact' } },
    build: (a, ctx, r) => { const is = partyIs(r.items.map((i) => i.insurer), a.insurer); const mine = r.items.filter((i) => is(i.insurer) && i.finding === 'pending_over'); if (!mine.length) throw new Error(`no supplements waiting past the follow-up days with "${a.insurer}"`); const d = followUpText(mine, { insurer: mine[0].insurer, from: a.from, contact: a.contact }); return { id: mine[0].insurer, to: a.contact, text: d.text, amount: d.total, extra: { supplements: d.count } }; } },
  refused: [{ name: 'insurer_portal_submit', category: 'binding_send', description: 'It never submits a supplement or message to an insurer portal.' }, { name: 'dms_change_estimate', category: 'production_deploy', description: 'It never changes an estimate or repair order.' }],
  prompt: { name: 'supplements', title: 'Track insurance supplements', description: 'Walks the host model through a supplement review.', arguments: [{ name: 'supplements', description: 'Supplement log', required: true }],
    text: 'You are helping a body shop manager with fairdrive-insurance-supplements. Supplements: {{supplements}}.\n\nRules: it reads files and drafts. It never submits to an insurer. Customer names are masked.\n\n1. Call supplements_track. Lead with supplements waiting longest and the amount waiting, then short approvals.\n2. Call supplements_write_report.\n3. Only when asked, supplements_draft_follow_up for one insurer, then supplements_request_send.' },
});
