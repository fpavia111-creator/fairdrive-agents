import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Product Cancellations demo (fictional cancellations, 2025 to 2026)',
  args: { cancellations: 'cancellations.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(6)} ${i.product.padEnd(18)} expected ${String(i.expected_chargeback).padStart(8)}  charged ${String(i.charged_back).padStart(8)}  ${i.findings.join(', ')}`),
  draft: { label: 'Draft the review request to Larkfield Vehicle Protection', args: { provider: 'Larkfield Vehicle Protection', from: 'Jordan Reyes, Prairie Ridge Motors (fictional)', contact: 'dealers@larkfield-vp.example' } },
  refused: 'ap_issue_refund',
});
