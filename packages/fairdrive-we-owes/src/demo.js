import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive We Owes demo (fictional due bills, September to November 2026)',
  args: { we_owes: 'we-owes.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(7)} ${i.item.padEnd(28)} ${String(i.days_since_delivery).padStart(3)} days  ${i.findings.join(', ')}`),
  refused: 'sms_text_customer',
});
