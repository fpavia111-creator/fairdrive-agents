import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, RATE_FIELDS, checkSalesTax, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Deals under --root (CSV, Excel or JSON) from the DMS deal recap: deal number, customer, delivery date, state, county, sale price, trade allowance, doc fee, tax charged' },
  rates: { type: 'string', description: 'Your rate table (settings you keep): state, county, rate percent, trade credit yes/no, doc fee taxable yes/no, maximum tax if capped' },
  tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Differences this small are ignored (default 1.00)' },
};
const run = (a, ctx) => checkSalesTax(ctx.records(a.deals), ctx.records(a.rates), { tolerance: a.tolerance ?? 1 });

export const manifest = checkAgent({
  name: 'fairdrive-sales-tax', version: pkg.version, prefix: 'salestax',
  description: 'Recomputes the sales tax on each deal from the county rate table you supply (rate, whether the trade-in reduces the taxable amount, whether the doc fee is taxable, a maximum tax) and lists deals taxed over or under, and deals in a county with no rate, with totals by county. The rate table is your settings, not a tax service. It never files a return or posts to the ledger.',
  sources: { deals: { label: 'Deals', args: ['deals'], fields: DEAL_FIELDS }, rates: { label: 'County rate table (settings)', args: ['rates'], fields: RATE_FIELDS } },
  args, required: ['deals', 'rates'], run, line,
  scan: { name: 'salestax_check', title: 'Recompute sales tax by county', description: 'One row per deal taxed over or under, or with no rate, largest difference first: county, rate, taxable amount, expected and charged tax, difference. Totals by county.' },
  report: { base: 'sales-tax', what: 'sales tax report', title: 'Sales tax by county', columns: ['deal_number', 'customer', 'delivery_date', 'state', 'county', 'sale_price', 'trade_allowance', 'rate_pct', 'taxable', 'expected_tax', 'tax_charged', 'difference', 'finding', 'why'],
    sections: (r) => [{ title: 'By county', rows: r.by_county, columns: ['county', 'deals', 'charged', 'expected'] }],
    limits: [LIMITS.files, 'The rates, trade credit, doc fee and caps come from your table. Tax rules differ by state and change; keep the table current and have it checked.', 'Not tax advice.', LIMITS.pii] },
  refused: [{ name: 'tax_portal_file_return', category: 'binding_send', description: 'It never files or amends a tax return.' }, { name: 'gl_post_entry', category: 'production_deploy', description: 'It never posts an adjustment to the ledger.' }],
  prompt: { name: 'sales_tax', title: 'Recompute sales tax', description: 'Walks the host model through a sales tax check.', arguments: [{ name: 'deals', description: 'Deals', required: true }, { name: 'rates', description: 'Rate table', required: true }],
    text: 'You are helping a dealership controller with fairdrive-sales-tax. Deals: {{deals}}. Rates: {{rates}}.\n\nRules: it reads files and writes a report. The rate table is the store settings, not a tax service. It never files. It is not tax advice. Customer names are masked.\n\n1. Call salestax_check. Give over and under totals, then counties with no rate.\n2. Call salestax_write_report.' },
});
