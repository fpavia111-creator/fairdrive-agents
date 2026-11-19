import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Parts Receiving demo (fictional receiving log and invoices, October and November 2026)',
  args: { receipts: 'receipts.csv', invoices: 'invoices.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(22)} ${i.po_number.padEnd(7)} ${i.part_number.padEnd(14)} ${String(i.amount).padStart(7)}`),
  draft: { label: 'Draft the credit request to Northline Parts Distribution', args: { vendor: 'Northline Parts Distribution', from: 'Jordan Reyes, Prairie Ridge Motors (fictional)', contact: 'credits@northline-parts.example' } },
  refused: 'ap_pay_invoice',
});
