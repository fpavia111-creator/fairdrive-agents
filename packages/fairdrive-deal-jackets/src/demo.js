import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Deal Jackets demo (fictional deals at a fictional store, October and November 2026)',
  args: { deals: 'deals.csv', documents: 'documents.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(7)} ${String(i.days_since_delivery).padStart(3)} days  missing ${i.missing.length}, unsigned ${i.unsigned.length}: ${[...i.missing, ...i.unsigned].slice(0, 3).join('; ')}`),
  refused: 'dms_book_deal',
});
