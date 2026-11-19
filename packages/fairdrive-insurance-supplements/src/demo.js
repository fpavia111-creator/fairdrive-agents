import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Insurance Supplements demo (fictional supplement log, October and November 2026)',
  args: { supplements: 'supplements.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(15)} ${i.ro_number.padEnd(6)} ${i.insurer.padEnd(25)} ${String(i.amount).padStart(7)}`),
  draft: { label: 'Draft the follow-up to Heron Mutual', args: { insurer: 'Heron Mutual', from: 'Jordan Reyes, Lakeside Collision (fictional)', contact: 'adjuster@heron-mutual.example' } },
  refused: 'insurer_portal_submit',
});
