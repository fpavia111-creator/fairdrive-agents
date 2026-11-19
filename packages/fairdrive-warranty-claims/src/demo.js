import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Warranty Claims demo (fictional claims and statement, September to November 2026)',
  args: { claims: 'claims.csv', statement: 'warranty-statement.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.claim_number.padEnd(6)} claimed ${String(i.claimed).padStart(7)}  paid ${String(i.paid).padStart(7)}  ${i.findings.join(', ')}${i.resubmit_by ? ` (resubmit by ${i.resubmit_by})` : ''}`),
  draft: { label: 'Draft the review request', args: { from: 'Jordan Reyes, dealer 40112 (fictional)', contact: 'warranty.rep@oem.example' } },
  refused: 'oem_portal_resubmit',
});
