import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive OFAC Red Flags demo (fictional deals and check log, October 2026). Record presence only.',
  args: { deals: 'deals.csv', checks: 'checks.csv' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(7)} ${i.deal_type.padEnd(15)} records ${i.records_found}  ${i.gaps.join(', ')}`),
  refused: 'ofac_clear_match',
});
