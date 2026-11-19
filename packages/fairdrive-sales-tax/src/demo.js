import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Sales Tax demo (fictional deals and a fictional county rate table)',
  args: { deals: 'deals.csv', rates: 'county-rates.csv' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(7)} ${i.county.padEnd(9)} expected ${String(i.expected_tax ?? '-').padStart(8)}  charged ${String(i.tax_charged).padStart(8)}  ${i.finding}`),
  refused: 'tax_portal_file_return',
});
