import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Incentive Claims demo (fictional programs and statement, August to November 2026)',
  args: { expected: 'expected.csv', statement: 'statement.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.vin.slice(-8)} ${i.program.padEnd(12)} expected ${String(i.expected).padStart(6)}  paid ${String(i.paid).padStart(6)}  ${i.findings.join(', ')}`),
  draft: { label: 'Draft the inquiry to the incentive desk', args: { from: 'Jordan Reyes, dealer 40112 (fictional)', contact: 'incentives@oem.example' } },
  refused: 'oem_portal_submit_claim',
});
