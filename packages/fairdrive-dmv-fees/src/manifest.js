import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, CHARGE_FIELDS, reconcileFees, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Delivered deals under --root (CSV, Excel or JSON): deal number, customer, VIN, delivery date, state, title, registration and plate fees collected' },
  charges: { type: 'string', description: 'DMV or tag agency charges: deal number or VIN, charge date, amount, agency' },
  tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Differences this small are ignored (default 1.00)' },
  paid_days: { type: 'integer', minimum: 1, maximum: 180, description: 'A deal with fees collected and no charge after this many days is flagged (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => reconcileFees(ctx.records(a.deals), ctx.records(a.charges), { asOf: a.as_of, tolerance: a.tolerance ?? 1, paidDays: a.paid_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-dmv-fees', version: pkg.version, prefix: 'dmvfees',
  description: 'Compares the title, registration and plate fees collected on each deal with what the DMV or tag agency charged (matched by deal number, then VIN), and lists fees over-collected (money that may belong to the customer), under-collected (fees the store paid), collected but not paid yet, and charges that match no deal. It never issues a refund or pays the DMV.',
  sources: { deals: { label: 'Delivered deals with fees collected', args: ['deals'], fields: DEAL_FIELDS }, charges: { label: 'DMV or tag agency charges', args: ['charges'], fields: CHARGE_FIELDS } },
  args, required: ['deals', 'charges'], run, line,
  scan: { name: 'dmvfees_reconcile', title: 'Reconcile DMV fees collected and charged', description: 'One row per finding, largest first: deal, customer, VIN, collected, charged, finding (overcollected, undercollected, not_paid_yet, charge_without_deal), amount. Totals.' },
  report: { base: 'dmv-fees', what: 'DMV fee report', title: (r) => `DMV fees at ${r.as_of}`, columns: ['finding', 'deal_number', 'customer', 'vin', 'state', 'delivery_date', 'collected', 'charged', 'amount', 'why'],
    limits: [LIMITS.files, 'Whether an over-collected fee is refunded is a decision for a person under your state rules; this report does not decide it.', LIMITS.pii] },
  refused: [{ name: 'ap_issue_refund', category: 'move_money', description: 'It never issues a customer refund.' }, { name: 'dmv_submit_payment', category: 'move_money', description: 'It never pays the DMV or a tag agency.' }],
  prompt: { name: 'dmv_fees', title: 'Reconcile DMV fees', description: 'Walks the host model through a DMV fee reconciliation.', arguments: [{ name: 'deals', description: 'Deals with fees collected', required: true }, { name: 'charges', description: 'DMV charges', required: true }],
    text: 'You are helping a title clerk or office manager with fairdrive-dmv-fees. Deals: {{deals}}. Charges: {{charges}}.\n\nRules: it reads files and writes a report. It never refunds or pays. Customer names are masked.\n\n1. Call dmvfees_reconcile. Lead with over-collected fees (they may belong to customers), then fees not paid yet.\n2. Call dmvfees_write_report.' },
});
