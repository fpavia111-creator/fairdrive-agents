import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { RECEIPT_FIELDS, INVOICE_FIELDS, matchReceiving, creditText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  receipts: { type: 'string', description: 'Parts received under --root (CSV, Excel or JSON) from the DMS receiving log: PO number, part number, received date, quantity received, order unit cost' },
  invoices: { type: 'string', description: 'Vendor or manufacturer invoice lines: invoice number, PO number, part number, quantity billed, unit price, invoice date, vendor' },
  price_pct: { type: 'number', minimum: 0, maximum: 100, description: 'A billed price more than this percent above the order cost is flagged (default 1)' },
  not_billed_days: { type: 'integer', minimum: 0, maximum: 120, description: 'Parts received this many days ago and still not billed are listed (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => matchReceiving(ctx.records(a.receipts), ctx.records(a.invoices), { asOf: a.as_of, pricePct: a.price_pct ?? 1, notBilledDays: a.not_billed_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-parts-receiving', version: pkg.version, prefix: 'receiving',
  description: 'Matches parts received against vendor and manufacturer invoice lines by purchase order and part number, and lists parts billed but not received, parts received but not billed after your days, prices above the order cost and invoice lines billed twice. Drafts a credit request to one vendor for a person to send. It never pays an invoice or changes the receiving log.',
  sources: { receipts: { label: 'Parts receiving log', args: ['receipts'], fields: RECEIPT_FIELDS }, invoices: { label: 'Vendor invoice lines', args: ['invoices'], fields: INVOICE_FIELDS } },
  args, required: ['receipts', 'invoices'], run, line,
  scan: { name: 'receiving_match', title: 'Match parts received against invoices', description: 'One row per finding, largest first: PO, part, invoices, quantities received and billed, order cost and billed price, finding (billed_not_received, received_not_billed, price_above_cost, duplicate_invoice_line), amount. Totals.' },
  report: { base: 'parts-receiving', what: 'parts receiving report', title: (r) => `Parts receiving at ${r.as_of}`, columns: ['finding', 'po_number', 'part_number', 'vendor', 'invoices', 'qty_received', 'qty_billed', 'unit_cost', 'unit_price', 'amount', 'why'],
    limits: [LIMITS.files, 'Back orders and partial shipments show as billed but not received until the parts arrive; check open back orders before asking for a credit.'] },
  draft: { noun: 'credit', verb: 'send', category: 'binding_send', actor: 'the parts manager', title: 'Draft a credit request to one vendor',
    description: 'Write drafts/credit-<vendor>.md: lines from one vendor billed but not received, priced above the order or billed twice, with the credit asked for. Marked DRAFT. Sending goes through receiving_request_send (one click).',
    required: ['receipts', 'invoices', 'vendor'], args: { vendor: { type: 'string', description: 'Vendor as named on the invoices' }, from: { type: 'string', description: 'Your name and store' }, contact: { type: 'string', description: 'Vendor credit contact' } },
    build: (a, ctx, r) => { const d = creditText(r.items, { vendor: a.vendor, from: a.from, contact: a.contact }); if (!d.count) throw new Error(`nothing to ask "${a.vendor}" to credit`); return { id: d.name, to: a.contact, text: d.text, amount: d.total, extra: { lines: d.count } }; } },
  refused: [{ name: 'ap_pay_invoice', category: 'move_money', description: 'It never pays or approves a vendor invoice.' }, { name: 'dms_receive_parts', category: 'production_deploy', description: 'It never receives parts or changes a purchase order.' }],
  prompt: { name: 'parts_receiving', title: 'Match parts receiving', description: 'Walks the host model through a receiving match.', arguments: [{ name: 'receipts', description: 'Receiving log', required: true }, { name: 'invoices', description: 'Invoice lines', required: true }],
    text: 'You are helping a parts manager with fairdrive-parts-receiving. Receipts: {{receipts}}. Invoices: {{invoices}}.\n\nRules: it reads files and drafts. It never pays an invoice.\n\n1. Call receiving_match. Give the overbilled amount and the duplicate lines first; ask about open back orders before calling anything a short shipment.\n2. Call receiving_write_report.\n3. Only when asked, receiving_draft_credit for one vendor, then receiving_request_send.' },
});
