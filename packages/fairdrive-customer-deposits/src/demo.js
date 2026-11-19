import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Customer Deposits demo (fictional deposits and deals, September to November 2026)',
  args: { deposits: 'deposits.csv', deals: 'deals.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(24)} ${i.receipt_number.padEnd(6)} ${String(i.amount).padStart(6)}  ${i.deal_number || '-'}`),
  refused: 'ap_issue_refund',
});
