import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive DMV Fees demo (fictional deals and tag agency charges, October and November 2026)',
  args: { deals: 'deals.csv', charges: 'dmv-charges.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(20)} ${(i.deal_number || '-').padEnd(7)} collected ${String(i.collected ?? '').padStart(7)}  charged ${String(i.charged ?? '').padStart(7)}  ${i.amount}`),
  refused: 'ap_issue_refund',
});
