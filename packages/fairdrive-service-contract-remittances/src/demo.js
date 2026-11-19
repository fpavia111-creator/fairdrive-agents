import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Service Contract Remittances demo (fictional contracts and remittances, September to November 2026)',
  args: { sold: 'contracts-sold.csv', remittances: 'remittances.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.finding.padEnd(22)} ${(i.contract_number || '-').padEnd(8)} ${i.provider.padEnd(28)} ${String(i.amount).padStart(7)}`),
  refused: 'ap_pay_provider',
});
