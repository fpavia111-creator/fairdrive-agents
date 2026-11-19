import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { WEOWE_FIELDS, checkWeOwes, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  we_owes: { type: 'string', description: 'We-owe (due bill) log under --root (CSV, Excel or JSON): deal number, customer, delivery date, item, promised date, estimated cost, RO number, completed date, cost booked' },
  open_days: { type: 'integer', minimum: 1, maximum: 365, description: 'An open we-owe with no promise date older than this is flagged (default 30)' },
  schedule_days: { type: 'integer', minimum: 0, maximum: 90, description: 'An open we-owe with no repair order this many days after delivery is flagged (default 7)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkWeOwes(ctx.records(a.we_owes), { asOf: a.as_of, openDays: a.open_days ?? 30, scheduleDays: a.schedule_days ?? 7 });

export const manifest = checkAgent({
  name: 'fairdrive-we-owes', version: pkg.version, prefix: 'weowes',
  description: 'Lists every we-owe (due bill) promised to a customer on a deal that is open past its promise date, open too long with no promise date, or not scheduled on a repair order, and completed ones whose cost was never booked (the deal gross is overstated), with the open estimated cost by age. It never contacts a customer or changes a deal.',
  sources: { we_owes: { label: 'We-owe log', args: ['we_owes'], fields: WEOWE_FIELDS } },
  args, required: ['we_owes'], run, line,
  scan: { name: 'weowes_check', title: 'Check open and completed we-owes', description: 'One row per we-owe that needs action, oldest delivery first: item, promised date, estimated cost, RO, completed date, cost booked, findings (past_promise, not_scheduled, open_long, cost_not_booked). Totals and open cost by age.' },
  report: { base: 'we-owes', what: 'we-owe report', title: (r) => `We-owes at ${r.as_of}`, columns: ['deal_number', 'customer', 'item', 'delivery_date', 'days_since_delivery', 'promised_date', 'estimated_cost', 'ro_number', 'completed_date', 'cost_booked', 'findings', 'why'],
    sections: (r) => [{ title: 'Open by age', rows: r.open_by_age, columns: ['bucket', 'we_owes', 'estimated_cost'] }],
    limits: [LIMITS.files, LIMITS.pii] },
  refused: [{ name: 'sms_text_customer', category: 'binding_send', description: 'It never texts, calls or e-mails a customer.' }, { name: 'dms_update_deal', category: 'production_deploy', description: 'It never changes a deal or posts a cost.' }],
  prompt: { name: 'we_owes', title: 'Check we-owes', description: 'Walks the host model through a we-owe review.', arguments: [{ name: 'we_owes', description: 'We-owe log', required: true }],
    text: 'You are helping a sales or office manager with fairdrive-we-owes. We-owes: {{we_owes}}.\n\nRules: it reads files and writes a report. It never contacts a customer. Customer names are masked.\n\n1. Call weowes_check. Lead with promises past their date, then completed work with no cost booked.\n2. Call weowes_write_report.' },
});
