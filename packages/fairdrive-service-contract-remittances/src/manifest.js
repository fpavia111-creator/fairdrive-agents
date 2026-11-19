import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { SOLD_FIELDS, REMIT_FIELDS, checkRemittances, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  sold: { type: 'string', description: 'Service contracts sold under --root (CSV, Excel or JSON) from the DMS F&I product report: deal number, customer, contract number, provider, sale date, dealer cost to remit' },
  remittances: { type: 'string', description: 'Remittances to providers (from AP checks or the provider statement): contract number, deal number, provider, remit date, amount' },
  remit_days: { type: 'integer', minimum: 1, maximum: 120, description: 'Days after the sale within which a contract must be remitted (default 30; set from each provider agreement)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkRemittances(ctx.records(a.sold), ctx.records(a.remittances), { asOf: a.as_of, remitDays: a.remit_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-service-contract-remittances', version: pkg.version, prefix: 'remittances',
  description: 'Matches every service contract (and other remitted F&I product) sold with its remittance to the provider by contract number, or deal and provider, and lists contracts not remitted past your days (the contract may not be in force), due within a week, remitted short, over, twice or late, and remittances for no sale. It never pays a provider or registers a contract.',
  sources: { sold: { label: 'Service contracts sold', args: ['sold'], fields: SOLD_FIELDS }, remittances: { label: 'Remittances to providers', args: ['remittances'], fields: REMIT_FIELDS } },
  args, required: ['sold', 'remittances'], run, line,
  scan: { name: 'remittances_check', title: 'Check service contract remittances', description: 'One row per finding, largest first: deal, contract, provider, sale date, remit-by date, dealer cost, remitted, finding (not_remitted_overdue, due_soon, remitted_short, remitted_over, remitted_twice, remitted_late, remittance_no_sale), amount. Totals.' },
  report: { base: 'service-contract-remittances', what: 'remittance report', title: (r) => `Service contract remittances at ${r.as_of}`, columns: ['finding', 'deal_number', 'customer', 'contract_number', 'provider', 'sale_date', 'remit_by', 'dealer_cost', 'remitted', 'remit_date', 'amount', 'why'],
    limits: [LIMITS.files, 'Remittance deadlines and what happens to a late contract are in each provider agreement; the days are a setting.', LIMITS.advice, LIMITS.pii] },
  refused: [{ name: 'ap_pay_provider', category: 'move_money', description: 'It never remits money to a provider.' }, { name: 'provider_portal_register', category: 'binding_send', description: 'It never registers or cancels a contract with a provider.' }],
  prompt: { name: 'remittances', title: 'Check service contract remittances', description: 'Walks the host model through a remittance check.', arguments: [{ name: 'sold', description: 'Contracts sold', required: true }, { name: 'remittances', description: 'Remittances', required: true }],
    text: 'You are helping an F&I or accounting manager with fairdrive-service-contract-remittances. Sold: {{sold}}. Remittances: {{remittances}}.\n\nRules: it reads files and writes a report. It never pays a provider. Customer names are masked.\n\n1. Ask for the remittance days in the provider agreements; run remittances_check. Lead with contracts not remitted past the deadline (the customer may not be covered), then double remittances.\n2. Call remittances_write_report.' },
});
