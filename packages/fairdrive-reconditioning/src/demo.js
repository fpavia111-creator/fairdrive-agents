import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Reconditioning demo (fictional used units and recon repair orders, October and November 2026)',
  args: { units: 'units.csv', repair_orders: 'recon-ros.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.stock_number.padEnd(6)} ${String(i.days).padStart(3)} days  cost ${String(i.recon_cost).padStart(7)}  ${i.findings.join(', ')}`),
  refused: 'dms_close_ro',
});
