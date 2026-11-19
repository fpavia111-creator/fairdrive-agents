import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Trade Payoffs demo (fictional trade-ins, September to November 2026)',
  args: { trades: 'payoffs.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.deal_number.padEnd(7)} ${i.lienholder.padEnd(20)} ${String(i.days_since_deal).padStart(3)} days  ${i.findings.join(', ')}`),
  draft: { label: 'Draft the payoff batch', args: { from: 'Jordan Reyes, Prairie Ridge Motors (fictional)' } },
  refused: 'bank_send_wire',
});
