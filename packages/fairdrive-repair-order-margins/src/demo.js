import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Repair Order Margins demo (fictional closed repair orders, November 2026)',
  args: { repair_orders: 'closed-ros.csv' },
  show: (r) => r.items.map((i) => `${i.ro_number.padEnd(6)} ${i.pay_type.padEnd(13)} labor ${String(i.labor_gp_pct).padStart(6)}%  parts ${String(i.parts_gp_pct).padStart(7)}%  ${i.findings.join(', ')}`),
  refused: 'dms_reprice_ro',
});
