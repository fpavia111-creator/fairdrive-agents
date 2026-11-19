import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Used Vehicle Aging demo (fictional used inventory, November 2026)',
  args: { inventory: 'used-inventory.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.stock_number.padEnd(6)} ${String(i.age_days).padStart(3)} days  cost ${String(i.cost).padStart(6)}  ${i.findings.join(', ')}`),
  refused: 'dms_change_price',
});
