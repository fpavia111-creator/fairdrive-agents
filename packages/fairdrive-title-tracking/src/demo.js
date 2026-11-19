import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Title Tracking demo (fictional delivered deals, September to November 2026)',
  args: { deals: 'title-log.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(6)} ${String(i.days_since_delivery).padStart(3)} days  ${i.findings.join(', ')}`),
  refused: 'dmv_submit_application',
});
