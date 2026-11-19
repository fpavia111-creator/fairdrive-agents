import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Comebacks demo (fictional repair orders, September to November 2026)',
  args: { repair_orders: 'repair-orders.csv' },
  show: (r) => r.items.map((i) => `${i.first_ro} -> ${i.return_ro}  ${String(i.days).padStart(2)} days  ${String(i.miles).padStart(5)} mi  ${i.technician}  ${i.matched_by}`),
  refused: 'payroll_charge_back_tech',
});
