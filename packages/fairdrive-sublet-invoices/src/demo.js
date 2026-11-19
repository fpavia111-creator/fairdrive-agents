import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Sublet Invoices demo (fictional sublet lines and vendor invoices, October and November 2026)',
  args: { sublet_lines: 'sublet-lines.csv', invoices: 'sublet-invoices.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(18)} RO ${(i.ro_number || '-').padEnd(6)} ${i.vendor.padEnd(22)} ${String(i.amount).padStart(6)}`),
  refused: 'ap_pay_invoice',
});
