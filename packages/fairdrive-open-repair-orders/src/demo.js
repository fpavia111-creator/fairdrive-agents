import { fileURLToPath } from 'node:url';
import { checkDemo } from 'fairdrive-core';

export const demo = (manifest) => checkDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  intro: 'Fairdrive Open Repair Orders demo (fictional open RO report, 15 November 2026)',
  args: { open_ros: 'open-ros.csv', as_of: '2026-11-15' },
  show: (r) => r.items.map((i) => `${i.ro_number.padEnd(6)} ${String(i.age_days).padStart(3)} days  ${i.pay_type.padEnd(13)} ${i.advisor.padEnd(12)} ${i.findings.join(', ')}`),
  refused: 'dms_close_ro',
});
