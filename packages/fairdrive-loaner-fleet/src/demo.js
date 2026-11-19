import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Loaner Fleet demo (fictional loaners, demos and agreements, November 2026)',
  args: { fleet: 'fleet.csv', agreements: 'agreements.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.stock_number.padEnd(5)} ${i.use.padEnd(7)} ${String(i.days_in_service).padStart(3)} days ${String(i.miles_in_service).padStart(6)} mi  ${i.findings.join(', ')}`),
  refused: 'dms_retail_unit',
});
