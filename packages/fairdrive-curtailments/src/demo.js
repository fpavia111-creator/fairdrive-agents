import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Curtailments demo (fictional floorplan statement, November 2026)',
  args: { statement: 'statement.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(9)} ${(i.stock_number || '-').padEnd(6)} ${i.new_used.padEnd(4)} age ${String(i.age_days).padStart(3)}  ${String(i.amount).padStart(8)}  ${i.due_date || ''}`),
  refused: 'lender_portal_pay',
});
