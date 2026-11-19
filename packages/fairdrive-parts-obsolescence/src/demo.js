import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Parts Obsolescence demo (fictional parts inventory, November 2026)',
  args: { parts: 'parts.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.part_number.padEnd(14)} ${i.class.padEnd(19)} ${String(i.months_idle).padStart(6)} months  value ${String(i.value).padStart(7)}${i.returnable ? '  returnable' : ''}`),
  refused: 'dms_adjust_inventory',
});
