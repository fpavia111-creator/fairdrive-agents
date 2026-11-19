import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Estimate vs Invoice demo (fictional collision repairs, September to November 2026)',
  args: { estimates: 'estimates.csv', invoices: 'invoices.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(24)} ${i.ro_number.padEnd(6)} estimate ${String(i.estimate_total ?? '-').padStart(7)}  invoice ${String(i.invoice_total ?? '-').padStart(7)}  ${i.categories.join(', ')}`),
  refused: 'insurer_portal_submit',
});
