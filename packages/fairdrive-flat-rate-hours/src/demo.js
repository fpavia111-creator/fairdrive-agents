import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Flat Rate Hours demo (fictional technicians, week of 9 November 2026)',
  args: { flags: 'flags.csv', clock: 'clock.csv' },
  show: (r) => [...r.by_technician.map((x) => `${x.technician.padEnd(16)} clocked ${String(x.attendance_hours).padStart(5)}  flagged ${String(x.flagged_hours).padStart(5)}  proficiency ${x.proficiency_pct}%`), ...r.items.map((i) => `${i.finding}: ${i.technician} ${i.ro_number}`)],
  refused: 'payroll_submit_hours',
});
