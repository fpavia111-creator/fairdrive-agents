import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, partyIs } from 'fairdrive-core';
import { CANCEL_FIELDS, checkCancellations, disputeText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  cancellations: { type: 'string', description: 'Cancelled F&I products under --root (CSV, Excel or JSON), from the DMS or the provider\'s cancellation report: deal number, customer, product, provider, contract number, sale and cancel dates, term in months, price, dealer cost, chargeback, refund and refund date, reason' },
  full_chargeback_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Cancelled within this many days of the sale, the whole profit is charged back (default 90; check your provider agreement)' },
  tolerance: { type: 'number', minimum: 0, maximum: 500, description: 'A chargeback this close to the expected figure is not a difference (default 5.00)' },
  refund_days: { type: 'integer', minimum: 1, maximum: 180, description: 'A cancellation older than this with no refund date is flagged (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count refund waiting days to, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkCancellations(ctx.records(a.cancellations), { asOf: a.as_of, fullDays: a.full_chargeback_days ?? 90, tolerance: a.tolerance ?? 5, refundDays: a.refund_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-product-cancellations', version: pkg.version, prefix: 'cancellations',
  description: 'Recomputes the dealer chargeback on every cancelled F&I product (service contract, GAP, maintenance, appearance) as the product\'s profit times the unused share of its term, flags chargebacks above that figure or above the profit earned, chargebacks below it (a second one may follow) and refunds not yet sent, and drafts a review request to the provider for a person to send. It never cancels a product, issues a refund or posts to the ledger.',
  sources: { cancellations: { label: 'Cancelled F&I products', args: ['cancellations'], fields: CANCEL_FIELDS } },
  args, required: ['cancellations'], run, line,
  scan: { name: 'cancellations_check', title: 'Check chargebacks on cancelled F&I products', description: 'One row per cancellation that needs attention: profit, days used, unused share, expected and charged chargeback, difference, refund waiting days, findings (chargeback_above_expected, chargeback_below_expected, chargeback_above_profit, refund_not_sent, cannot_compute). Totals and a list by provider.' },
  report: { base: 'product-cancellations', what: 'chargeback report', title: 'F&I product cancellations and chargebacks', columns: ['deal_number', 'customer', 'product', 'provider', 'contract_number', 'sale_date', 'cancel_date', 'used_days', 'profit', 'unused_share', 'expected_chargeback', 'charged_back', 'difference', 'refund_waiting_days', 'findings', 'why'],
    sections: (r) => [{ title: 'By provider', rows: r.by_provider, columns: ['provider', 'items', 'overcharged'] }],
    limits: [LIMITS.files, 'The expected chargeback is pro rata by days on the profit (price less dealer cost), with a full chargeback inside the window you set. Providers may use rule of 78s, cancel fees or other methods; your agreement decides.', LIMITS.advice, LIMITS.pii] },
  draft: { noun: 'dispute', verb: 'send', category: 'binding_send', actor: 'the F&I director', title: 'Draft a chargeback review request to one provider',
    description: 'Write drafts/dispute-<provider>.md: every chargeback from one provider above the pro-rata figure, with the arithmetic, asking for a review. Marked DRAFT. Sending goes through cancellations_request_send (one click).',
    required: ['cancellations', 'provider'], args: { provider: { type: 'string', description: 'Provider as named in the cancellations file' }, from: { type: 'string', description: 'Your name and store' }, contact: { type: 'string', description: 'Provider dealer-services contact' } },
    build: (a, ctx, r) => { const is = partyIs(r.items.map((i) => i.provider), a.provider); const mine = r.items.filter((i) => is(i.provider) && i.findings.includes('chargeback_above_expected')); if (!mine.length) throw new Error(`no chargebacks above the expected figure from "${a.provider}"`); const d = disputeText(mine, { provider: mine[0].provider, from: a.from, contact: a.contact }); return { id: mine[0].provider, to: a.contact, text: d.text, amount: d.total, extra: { contracts: mine.length } }; } },
  refused: [
    { name: 'provider_portal_cancel', category: 'binding_send', description: 'It never submits a cancellation to a provider.' },
    { name: 'ap_issue_refund', category: 'move_money', description: 'It never issues a customer or lender refund.' },
  ],
  prompt: { name: 'chargeback_review', title: 'Review F&I chargebacks', description: 'Walks the host model through a chargeback review.', arguments: [{ name: 'cancellations', description: 'Cancellations file', required: true }],
    text: 'You are helping an F&I director or office manager with fairdrive-product-cancellations. Cancellations: {{cancellations}}.\n\nRules: it reads files and drafts. It never cancels a product or issues a refund. The expected figure is pro rata; the provider agreement decides the method. Customer names are masked.\n\n1. Call cancellations_check. Give the amount charged back above the pro-rata figure and refunds not sent.\n2. Ask which cancellation method and full-chargeback window the store\'s agreements use; run again with full_chargeback_days if different.\n3. Call cancellations_write_report.\n4. Only when asked, call cancellations_draft_dispute for one provider, then cancellations_request_send after review.' },
});
