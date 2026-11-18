import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Thoroughbred of Funding demo (fictional contracts and lender statement, September to November 2026)',
  args: { contracts: 'contracts.csv', lender_statement: 'lender-statement.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(24)} ${i.deal_number.padEnd(6)} ${i.lender.padEnd(20)} ${String(i.days ?? '').padStart(3)} days  ${i.amount_financed ?? ''}`),
  draft: { label: 'Draft the follow-up to Harbor Auto Finance', args: { lender: 'Harbor Auto Finance', from: 'Jordan Reyes, Prairie Ridge Motors (fictional)', contact: 'funding@harbor-auto-finance.example' } },
  refused: 'lender_portal_submit',
});
