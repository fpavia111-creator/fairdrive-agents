import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Sales Commissions demo (fictional salespeople, pay plans and deals, November 2026)',
  args: { deals: 'deals.csv', plans: 'pay-plans.csv', paid: 'commissions-paid.csv' },
  show: (r) => [...r.by_salesperson.map((s) => `${s.salesperson.padEnd(14)} units ${String(s.units).padStart(4)}  commission ${String(s.commission ?? '-').padStart(7)}  paid ${String(s.paid ?? '-').padStart(7)}`), ...r.items.map((i) => `${i.finding}: ${i.salesperson} ${i.deal_number}`)],
  draft: { label: 'Draft the commission sheet for Bianca Sol', args: { salesperson: 'Bianca Sol', period: 'November 2026', from: 'Jordan Reyes (fictional)' } },
  refused: 'payroll_submit',
});
