import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Floorplan Audit demo (fictional inventory and lender statement, November 2026)',
  args: { inventory: 'inventory.csv', statement: 'statement.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(30)} ${(i.stock_number || '-').padEnd(6)} ${i.vin}  ${i.amount ?? ''}`),
  draft: { label: 'Draft the payoff list', args: { lender: 'Northgate Floorplan Credit', from: 'Jordan Reyes, Prairie Ridge Motors (fictional)' } },
  refused: 'lender_portal_payoff',
});
