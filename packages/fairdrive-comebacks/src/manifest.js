import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { RO_FIELDS, findComebacks, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  repair_orders: { type: 'string', description: 'Repair orders under --root (CSV, Excel or JSON), several months: RO number, VIN, customer, open and close dates, odometer, technician, op code, concern, labor type' },
  days: { type: 'integer', minimum: 1, maximum: 365, description: 'A return within this many days of the first visit can be a comeback (default 30)' },
  miles: { type: 'number', minimum: 0, maximum: 100000, description: 'A return within this many miles of the first visit can be a comeback (default 1000; ignored when an odometer is missing)' },
};
const run = (a, ctx) => findComebacks(ctx.records(a.repair_orders), { days: a.days ?? 30, miles: a.miles ?? 1000 });

export const manifest = checkAgent({
  name: 'fairdrive-comebacks', version: pkg.version, prefix: 'comebacks',
  description: 'Finds repair orders where the same vehicle (by VIN) came back within your days and miles for the same op code, or with two or more significant words of the same concern, and totals comebacks by the technician on the first visit and by operation, with the comeback rate. Internal orders are not counted as a first visit. It never charges a technician or changes a repair order.',
  sources: { repair_orders: { label: 'Repair orders', args: ['repair_orders'], fields: RO_FIELDS } },
  args, required: ['repair_orders'], run, line,
  scan: { name: 'comebacks_find', title: 'Find comebacks', description: 'One row per comeback: VIN, first and return RO, dates, days and miles between, technician on the first visit, op code, concern, how it was matched (same_op_code, same_concern). Totals by technician and by op code.' },
  report: { base: 'comebacks', what: 'comeback report', title: 'Comebacks', columns: ['vin', 'customer', 'first_ro', 'first_date', 'technician', 'op_code', 'concern', 'return_ro', 'return_date', 'days', 'miles', 'matched_by', 'why'],
    sections: (r) => [{ title: 'By technician', rows: r.by_technician, columns: ['technician', 'comebacks'] }, { title: 'By op code', rows: r.by_op_code, columns: ['op_code', 'comebacks'] }],
    limits: [LIMITS.files, 'A comeback here is a return for the same op code or concern; it is not a finding of fault. A new failure of the same part can look the same.', LIMITS.pii] },
  refused: [{ name: 'payroll_charge_back_tech', category: 'move_money', description: 'It never charges a technician for a comeback.' }, { name: 'dms_change_ro', category: 'production_deploy', description: 'It never changes a repair order.' }],
  prompt: { name: 'comebacks', title: 'Find comebacks', description: 'Walks the host model through a comeback review.', arguments: [{ name: 'repair_orders', description: 'Repair orders', required: true }],
    text: 'You are helping a service manager or shop owner with fairdrive-comebacks. ROs: {{repair_orders}}.\n\nRules: it reads files and writes a report. A comeback here is a return, not a finding of fault. It never charges anyone. Customer names are masked.\n\n1. Call comebacks_find with the shop window. Give the rate, then the operations that come back most.\n2. Call comebacks_write_report.' },
});
