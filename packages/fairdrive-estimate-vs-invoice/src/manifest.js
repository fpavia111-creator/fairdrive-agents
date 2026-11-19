import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { ESTIMATE_FIELDS, INVOICE_FIELDS, compareEstimates, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  estimates: { type: 'string', description: 'Estimates and supplements under --root (CSV, Excel or JSON) from CCC ONE, Mitchell or another estimating system: RO number, claim number, insurer, version (E01, S01, S02), date, labor, parts, materials, sublet, total' },
  invoices: { type: 'string', description: 'Final repair invoices from the shop system: RO number, invoice date, customer, labor, parts, materials, sublet, total' },
  tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'Differences this small are ignored (default 10)' },
  invoice_days: { type: 'integer', minimum: 1, maximum: 365, description: 'An estimate older than this with no invoice is listed (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => compareEstimates(ctx.records(a.estimates), ctx.records(a.invoices), { asOf: a.as_of, tolerance: a.tolerance ?? 10, invoiceDays: a.invoice_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-estimate-vs-invoice', version: pkg.version, prefix: 'estimates',
  description: 'Compares the latest estimate on each collision repair (the original estimate plus supplements, from CCC ONE, Mitchell or another estimating system) with the final invoice, by labor, parts, materials and sublet, and lists repairs invoiced over the estimate (the insurer pays the estimate), under it (items approved but not billed), invoices with no estimate and estimates not invoiced. It never contacts an insurer or changes an invoice.',
  sources: { estimates: { label: 'Estimates and supplements', args: ['estimates'], fields: ESTIMATE_FIELDS }, invoices: { label: 'Final repair invoices', args: ['invoices'], fields: INVOICE_FIELDS } },
  args, required: ['estimates', 'invoices'], run, line,
  scan: { name: 'estimates_compare', title: 'Compare estimates with final invoices', description: 'One row per repair that needs a look, largest first: claim, insurer, latest version, estimate and invoice totals, difference by category, finding (invoiced_over_estimate, invoiced_under_estimate, no_estimate, not_invoiced). Totals.' },
  report: { base: 'estimate-vs-invoice', what: 'estimate and invoice report', title: (r) => `Estimates against invoices at ${r.as_of}`, columns: ['finding', 'ro_number', 'claim_number', 'insurer', 'customer', 'latest_version', 'versions', 'estimate_total', 'invoice_total', 'difference', 'categories', 'why'],
    limits: [LIMITS.files, 'The latest estimate is the highest version (E01, then S01, S02...); each supplement is read as the full revised estimate, as estimating systems print it.', LIMITS.pii] },
  refused: [{ name: 'insurer_portal_submit', category: 'binding_send', description: 'It never sends an estimate, supplement or invoice to an insurer.' }, { name: 'dms_change_invoice', category: 'production_deploy', description: 'It never changes an invoice or repair order.' }],
  prompt: { name: 'estimate_vs_invoice', title: 'Compare estimates with invoices', description: 'Walks the host model through an estimate review.', arguments: [{ name: 'estimates', description: 'Estimates', required: true }, { name: 'invoices', description: 'Invoices', required: true }],
    text: 'You are helping a body shop manager with fairdrive-estimate-vs-invoice. Estimates: {{estimates}}. Invoices: {{invoices}}.\n\nRules: it reads files and writes a report. It never contacts an insurer. Customer names are masked.\n\n1. Call estimates_compare. Lead with repairs invoiced over the estimate (a supplement may still be possible), then estimates not invoiced.\n2. Call estimates_write_report.' },
});
