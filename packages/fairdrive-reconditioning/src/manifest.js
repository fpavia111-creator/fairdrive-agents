import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { UNIT_FIELDS, RO_FIELDS, checkRecon, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  units: { type: 'string', description: 'Used units under --root (CSV, Excel or JSON) from the DMS or a recon tracker: stock number, VIN, acquired date, front-line ready date, recon budget, status' },
  repair_orders: { type: 'string', description: 'Internal (recon) repair orders: stock number, RO number, open and close dates, total' },
  target_days: { type: 'integer', minimum: 1, maximum: 60, description: 'Target days from acquisition to front-line ready (default 7)' },
  default_budget: { type: 'number', minimum: 0, maximum: 50000, description: 'Recon budget for a unit with none in the file (default 1500)' },
  no_ro_days: { type: 'integer', minimum: 0, maximum: 30, description: 'A unit with no recon repair order after this many days is flagged (default 3)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count days to, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkRecon(ctx.records(a.units), ctx.records(a.repair_orders), { asOf: a.as_of, targetDays: a.target_days ?? 7, defaultBudget: a.default_budget ?? 1500, noRoDays: a.no_ro_days ?? 3 });

export const manifest = checkAgent({
  name: 'fairdrive-reconditioning', version: pkg.version, prefix: 'recon',
  description: 'Follows every used unit from acquisition to front-line ready: days in recon against your target, reconditioning cost from the internal repair orders against budget, units stuck with orders still open, units with no recon order at all, and units on the line with orders still open. Lists recon orders for stock numbers not in the unit file. It never closes or changes a repair order.',
  sources: { units: { label: 'Used units', args: ['units'], fields: UNIT_FIELDS }, repair_orders: { label: 'Recon repair orders', args: ['repair_orders'], fields: RO_FIELDS } },
  args, required: ['units', 'repair_orders'], run, line,
  scan: { name: 'recon_check', title: 'Check reconditioning days and cost', description: 'One row per unit that needs attention: days, budget, recon cost, repair orders and how many are open, findings (over_budget, slow, stuck, waiting_no_ro, open_ro_after_frontline). Totals and recon orders with no unit.' },
  report: { base: 'reconditioning', what: 'reconditioning report', title: (r) => `Reconditioning at ${r.as_of}`, columns: ['stock_number', 'vin', 'acquired_date', 'frontline_date', 'days', 'budget', 'recon_cost', 'repair_orders', 'open_repair_orders', 'findings', 'why'],
    sections: (r) => [{ title: 'Repair orders with no unit', rows: r.repair_orders_without_a_unit, columns: ['stock_number', 'repair_orders', 'total'] }],
    limits: [LIMITS.files, 'Recon cost is the total of the internal repair orders in your file, at the cost the DMS shows on them.'] },
  refused: [{ name: 'dms_close_ro', category: 'production_deploy', description: 'It never opens, closes or changes a repair order.' }, { name: 'dms_change_inventory', category: 'production_deploy', description: 'It never changes a vehicle record or its cost.' }],
  prompt: { name: 'recon_review', title: 'Review reconditioning', description: 'Walks the host model through a recon review.', arguments: [{ name: 'units', description: 'Used units', required: true }, { name: 'repair_orders', description: 'Recon repair orders', required: true }],
    text: 'You are helping a used-car or fixed-ops manager with fairdrive-reconditioning. Units: {{units}}. ROs: {{repair_orders}}.\n\nRules: it reads files and writes a report. It never changes a repair order.\n\n1. Call recon_check with the store target days. Lead with stuck units and units waiting with no order, then over budget.\n2. Call recon_write_report.' },
});
