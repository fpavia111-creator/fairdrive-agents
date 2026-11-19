import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { FLEET_FIELDS, AGREEMENT_FIELDS, checkFleet, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  fleet: { type: 'string', description: 'Loaner and demo units under --root (CSV, Excel or JSON): stock number, VIN, use (loaner or demo), in-service date, current odometer, odometer when put in service, status' },
  agreements: { type: 'string', description: 'Optional loan agreements: stock number, out date, return date, RO number, customer' },
  max_days: { type: 'integer', minimum: 1, maximum: 730, description: 'Days in service allowed by your loaner or demo program (default 180)' },
  max_miles: { type: 'number', minimum: 1, maximum: 100000, description: 'Miles in service allowed by your program (default 6000)' },
  open_days: { type: 'integer', minimum: 1, maximum: 90, description: 'A loan agreement open longer than this is listed (default 14)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkFleet(ctx.records(a.fleet), a.agreements ? ctx.records(a.agreements) : [], { asOf: a.as_of, maxDays: a.max_days ?? 180, maxMiles: a.max_miles ?? 6000, openDays: a.open_days ?? 14 });

export const manifest = checkAgent({
  name: 'fairdrive-loaner-fleet', version: pkg.version, prefix: 'loaners',
  description: 'Checks service loaners and demonstrators against the day and mileage limits of your manufacturer or store program, and lists units past or near a limit, loaners out with no repair order on the agreement, and loan agreements open too long. Retailed units are left out. It never retails, defleets or changes a unit.',
  sources: { fleet: { label: 'Loaner and demo units', args: ['fleet'], fields: FLEET_FIELDS }, agreements: { label: 'Loan agreements', args: ['agreements'], fields: AGREEMENT_FIELDS } },
  args, required: ['fleet'], run, line,
  scan: { name: 'loaners_check', title: 'Check loaners and demos against their limits', description: 'One row per unit that needs action, longest in service first: use, days and miles in service, out now, findings (over_days, over_miles, near_limit, loaner_out_no_ro, agreement_open_long). Totals.' },
  report: { base: 'loaner-fleet', what: 'loaner fleet report', title: (r) => `Loaner and demo fleet at ${r.as_of}`, columns: ['stock_number', 'vin', 'use', 'in_service_date', 'days_in_service', 'miles_in_service', 'out_now', 'customer', 'findings', 'why'],
    limits: [LIMITS.files, 'Day and mileage limits are settings; take them from your manufacturer loaner or demo program.', LIMITS.pii] },
  refused: [{ name: 'dms_retail_unit', category: 'production_deploy', description: 'It never moves a loaner or demo into retail inventory or changes a unit.' }, { name: 'oem_portal_defleet', category: 'binding_send', description: 'It never files a loaner program claim or defleet request.' }],
  prompt: { name: 'loaner_fleet', title: 'Check the loaner fleet', description: 'Walks the host model through a loaner review.', arguments: [{ name: 'fleet', description: 'Loaner and demo units', required: true }],
    text: 'You are helping a service or fixed-ops manager with fairdrive-loaner-fleet. Fleet: {{fleet}}.\n\nRules: it reads files and writes a report. It never retails or defleets a unit. Customer names are masked.\n\n1. Ask for the program day and mile limits; run loaners_check with them (and agreements when available).\n2. Lead with units past a limit, then loaners out with no repair order.\n3. Call loaners_write_report.' },
});
