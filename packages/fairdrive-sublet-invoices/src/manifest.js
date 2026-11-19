import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { LINE_FIELDS, INVOICE_FIELDS, matchSublet, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  sublet_lines: { type: 'string', description: 'Sublet lines on repair orders under --root (CSV, Excel or JSON): RO number, sublet PO, vendor, description, sublet cost (PO amount), sublet sale billed to the customer, RO closed date' },
  invoices: { type: 'string', description: 'Sublet vendor invoices: invoice number, vendor, PO number, RO number, amount, invoice date' },
  tolerance: { type: 'number', minimum: 0, maximum: 500, description: 'Differences this small are ignored (default 1.00)' },
  closed_days: { type: 'integer', minimum: 0, maximum: 90, description: 'A closed RO still without a sublet invoice after this many days is flagged (default 7)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => matchSublet(ctx.records(a.sublet_lines), ctx.records(a.invoices), { asOf: a.as_of, tolerance: a.tolerance ?? 1, closedDays: a.closed_days ?? 7 });

export const manifest = checkAgent({
  name: 'fairdrive-sublet-invoices', version: pkg.version, prefix: 'sublet',
  description: 'Matches sublet lines on repair orders (glass, alignment, towing, upholstery and other outside work) against vendor invoices by PO, or by RO and vendor, and lists invoices above the PO, closed repair orders with no sublet invoice (cost not booked, gross overstated), sublet billed below cost or not billed at all, duplicate invoices and invoices with no repair order. It never pays an invoice or closes a repair order.',
  sources: { sublet_lines: { label: 'Sublet lines on repair orders', args: ['sublet_lines'], fields: LINE_FIELDS }, invoices: { label: 'Sublet vendor invoices', args: ['invoices'], fields: INVOICE_FIELDS } },
  args, required: ['sublet_lines', 'invoices'], run, line,
  scan: { name: 'sublet_match', title: 'Match sublet lines against vendor invoices', description: 'One row per finding, largest first: RO, PO, vendor, invoice, cost, sale, amount invoiced, finding (invoice_over_po, closed_no_invoice, sold_below_cost, not_billed, duplicate_invoice, invoice_no_ro), amount. Totals.' },
  report: { base: 'sublet-invoices', what: 'sublet report', title: (r) => `Sublet invoices at ${r.as_of}`, columns: ['finding', 'ro_number', 'po_number', 'vendor', 'invoice_number', 'cost', 'sale', 'invoiced', 'amount', 'why'],
    limits: [LIMITS.files, 'Invoices are matched by PO number first, then by RO number and vendor.'] },
  refused: [{ name: 'ap_pay_invoice', category: 'move_money', description: 'It never pays or approves a vendor invoice.' }, { name: 'dms_close_ro', category: 'production_deploy', description: 'It never closes or changes a repair order.' }],
  prompt: { name: 'sublet_invoices', title: 'Match sublet invoices', description: 'Walks the host model through a sublet review.', arguments: [{ name: 'sublet_lines', description: 'Sublet lines', required: true }, { name: 'invoices', description: 'Vendor invoices', required: true }],
    text: 'You are helping a service office or controller with fairdrive-sublet-invoices. Lines: {{sublet_lines}}. Invoices: {{invoices}}.\n\nRules: it reads files and writes a report. It never pays an invoice.\n\n1. Call sublet_match. Lead with cost not booked on closed orders and duplicate invoices, then invoices over the PO.\n2. Call sublet_write_report.' },
});
