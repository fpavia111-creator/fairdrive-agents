import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { TRADE_FIELDS, checkPayoffs, batchText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  trades: { type: 'string', description: 'Trade-ins with a lien under --root (CSV, Excel or JSON) from the DMS payoff log: deal number, customer, trade VIN, lienholder, deal date, payoff quote, good-through date, per diem, payoff sent date and amount, cleared date, lien release received' },
  payoff_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Days after the deal within which the payoff should be sent (default 7)' },
  clear_days: { type: 'integer', minimum: 1, maximum: 60, description: 'A payoff sent this many days ago and not cleared is flagged (default 10)' },
  release_days: { type: 'integer', minimum: 1, maximum: 180, description: 'A cleared payoff with no lien release after this many days is flagged (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkPayoffs(ctx.records(a.trades), { asOf: a.as_of, payoffDays: a.payoff_days ?? 7, clearDays: a.clear_days ?? 10, releaseDays: a.release_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-trade-payoffs', version: pkg.version, prefix: 'payoffs',
  description: 'Lists every trade-in lien payoff not sent within your days (with the amount owed today, per diem included), sent after the quote expired, short of the quote plus per diem, sent but not cleared, or cleared with no lien release or title. Drafts a payoff batch for one named person to approve. It never sends money.',
  sources: { trades: { label: 'Trade-in payoff log', args: ['trades'], fields: TRADE_FIELDS } },
  args, required: ['trades'], run, line,
  scan: { name: 'payoffs_check', title: 'Check trade-in payoffs', description: 'One row per trade that needs action, oldest deal first: quote, good-through, sent date and amount, owed today, short amount, findings (payoff_not_sent, sent_after_quote_expired, short_paid, not_cleared, lien_release_missing). Totals.' },
  report: { base: 'trade-payoffs', what: 'trade payoff report', title: (r) => `Trade payoffs at ${r.as_of}`, columns: ['deal_number', 'customer', 'trade_vin', 'lienholder', 'deal_date', 'days_since_deal', 'payoff_quote', 'quote_good_through', 'payoff_sent', 'amount_sent', 'owed_now', 'short', 'findings', 'why'],
    limits: [LIMITS.files, 'Owed today is the quote plus per diem for each day past good-through. The lienholder payoff quote on the day you pay decides.', LIMITS.advice, LIMITS.pii] },
  draft: { noun: 'batch', verb: 'pay', category: 'move_money', actor: 'the office manager', title: 'Draft the payoff batch',
    description: 'Write drafts/batch-<date>.md: every payoff not sent yet, with lienholder and amount owed today. Marked DRAFT. Approving goes through payoffs_request_pay (one named click, even in Auto); a person sends the money.',
    args: { from: { type: 'string', description: 'Your name and store' } },
    build: (a, ctx, r) => { const d = batchText(r.items, { from: a.from }); if (!d.count) throw new Error('no payoffs are waiting to be sent'); return { id: r.as_of, text: d.text, amount: d.total, extra: { payoffs: d.count } }; } },
  refused: [{ name: 'bank_send_wire', category: 'move_money', description: 'It never sends a check, wire or ACH.' }, { name: 'dms_update_deal', category: 'production_deploy', description: 'It never changes a deal or the payoff log.' }],
  prompt: { name: 'trade_payoffs', title: 'Check trade payoffs', description: 'Walks the host model through a trade payoff review.', arguments: [{ name: 'trades', description: 'Payoff log', required: true }],
    text: 'You are helping an office manager with fairdrive-trade-payoffs. Trades: {{trades}}.\n\nRules: it reads files and drafts a payoff batch. It never sends money. Customer names are masked.\n\n1. Call payoffs_check. Lead with payoffs not sent (amount owed today), then short payments and missing lien releases.\n2. Call payoffs_write_report.\n3. Only when asked, payoffs_draft_batch, then payoffs_request_pay; a person pays.' },
});
