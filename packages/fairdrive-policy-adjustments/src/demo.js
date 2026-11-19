import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Policy Adjustments demo (fictional adjustments, October and November 2026)',
  args: { adjustments: 'policy.csv' },
  show: (r) => r.items.map((i) => `${i.ro_number.padEnd(6)} ${i.advisor.padEnd(12)} ${String(i.amount).padStart(6)}  ${i.findings.join(', ')}`),
  refused: 'dms_post_policy',
});
