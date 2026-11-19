import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Finance Reserve demo (fictional deals and payments, August to November 2026)',
  args: { deals: 'deals.csv', payments: 'payments.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(6)} ${i.lender.padEnd(20)} expected ${String(i.expected_reserve).padStart(8)}  received ${String(i.reserve_received).padStart(8)}  ${i.findings.join(', ')}`),
  draft: { label: 'Draft the reserve inquiry to Harbor Auto Finance', args: { lender: 'Harbor Auto Finance', from: 'Jordan Reyes, Prairie Ridge Motors (fictional)' } },
  refused: 'gl_post_reserve',
});
