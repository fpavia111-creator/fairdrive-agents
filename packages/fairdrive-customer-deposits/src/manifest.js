import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEPOSIT_FIELDS, DEAL_FIELDS, matchDeposits, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deposits: { type: 'string', description: 'Customer deposits under --root (CSV, Excel or JSON) from the DMS deposit schedule or cash receipts: receipt number, date, customer, amount, deal number, status, refunded date' },
  deals: { type: 'string', description: 'Deals: deal number, customer, status (delivered, pending, dead, lost, unwound), delivery date' },
  held_days: { type: 'integer', minimum: 1, maximum: 180, description: 'A deposit with no deal held longer than this is listed (default 14)' },
  refund_days: { type: 'integer', minimum: 1, maximum: 90, description: 'A deposit on a dead deal held longer than this is a refund overdue (default 10)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => matchDeposits(ctx.records(a.deposits), ctx.records(a.deals), { asOf: a.as_of, heldDays: a.held_days ?? 14, refundDays: a.refund_days ?? 10 });

export const manifest = checkAgent({
  name: 'fairdrive-customer-deposits', version: pkg.version, prefix: 'deposits',
  description: 'Matches customer deposits with deals and lists deposits not applied to a delivered deal, deposits on dead or lost deals that are due back to the customer (overdue after your days), deposits held with no deal, and deposits pointing to a deal that is not in the file, with the amount still held. It never issues a refund or applies a deposit.',
  sources: { deposits: { label: 'Customer deposits', args: ['deposits'], fields: DEPOSIT_FIELDS }, deals: { label: 'Deals', args: ['deals'], fields: DEAL_FIELDS } },
  args, required: ['deposits', 'deals'], run, line,
  scan: { name: 'deposits_match', title: 'Match customer deposits with deals', description: 'One row per deposit that needs action, largest first: receipt, date, age, customer, amount, deal and its status, finding (not_applied, refund_overdue, refund_due, held_no_deal, applied_to_missing_deal). Totals.' },
  report: { base: 'customer-deposits', what: 'deposit report', title: (r) => `Customer deposits at ${r.as_of}`, columns: ['finding', 'receipt_number', 'date', 'age_days', 'customer', 'amount', 'deal_number', 'deal_status', 'why'],
    limits: [LIMITS.files, 'Refund timing on a dead deal is set by your policy and state law; the days are a setting.', LIMITS.advice, LIMITS.pii] },
  refused: [{ name: 'ap_issue_refund', category: 'move_money', description: 'It never refunds a deposit.' }, { name: 'dms_apply_deposit', category: 'production_deploy', description: 'It never applies or moves a deposit in the DMS.' }],
  prompt: { name: 'customer_deposits', title: 'Match customer deposits', description: 'Walks the host model through a deposit review.', arguments: [{ name: 'deposits', description: 'Deposits', required: true }, { name: 'deals', description: 'Deals', required: true }],
    text: 'You are helping a dealership office manager with fairdrive-customer-deposits. Deposits: {{deposits}}. Deals: {{deals}}.\n\nRules: it reads files and writes a report. It never refunds or applies a deposit. Customer names are masked.\n\n1. Call deposits_match. Lead with refunds overdue on dead deals, then deposits not applied to delivered deals.\n2. Call deposits_write_report.' },
});
