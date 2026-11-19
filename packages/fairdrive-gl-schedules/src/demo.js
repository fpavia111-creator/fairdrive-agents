import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive GL Schedules demo (fictional schedules at a fictional store, month-end 15 November 2026)',
  args: { detail: 'schedule-detail.csv', balances: 'gl-balances.csv', as_of: '2026-11-15' },
  show: (r) => [...r.by_schedule.map((s) => `${s.schedule.padEnd(4)} ${s.schedule_name.padEnd(22)} ledger ${String(s.gl_balance).padStart(8)}  detail ${String(s.detail_total).padStart(8)}  difference ${s.difference}`), ...r.items.map((i) => `${i.finding}: ${i.schedule} ${i.control_number} ${i.amount}`)],
  refused: 'gl_post_entry',
});
