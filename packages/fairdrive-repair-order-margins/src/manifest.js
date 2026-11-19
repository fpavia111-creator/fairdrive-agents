import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { RO_FIELDS, checkMargins, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  repair_orders: { type: 'string', description: 'Closed repair order lines under --root (CSV, Excel or JSON) from the DMS or a shop system (Tekmetric, Shopmonkey): RO number, closed date, advisor, customer, labor type (customer pay, warranty, internal), labor sale and cost, parts sale and cost' },
  labor_floor: { type: 'number', minimum: 0, maximum: 100, description: 'Customer-pay labor gross profit percent below which a repair order is flagged (default 65)' },
  parts_floor: { type: 'number', minimum: 0, maximum: 100, description: 'Customer-pay parts gross profit percent below which a repair order is flagged (default 30)' },
};
const run = (a, ctx) => checkMargins(ctx.records(a.repair_orders), { laborFloor: a.labor_floor ?? 65, partsFloor: a.parts_floor ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-repair-order-margins', version: pkg.version, prefix: 'margins',
  description: 'Works out labor and parts gross profit on every closed repair order, totals it by pay type (customer pay, warranty, internal) and by advisor, and lists customer-pay orders under your labor or parts floor, customer-pay labor given away, and parts sold below cost on any pay type. It never reprices or reopens a repair order.',
  sources: { repair_orders: { label: 'Closed repair order lines', args: ['repair_orders'], fields: RO_FIELDS } },
  args, required: ['repair_orders'], run, line,
  scan: { name: 'margins_check', title: 'Check repair order margins', description: 'One row per repair order and pay type that needs a look: labor and parts sale, cost, gross and percent, findings (labor_gp_below_floor, parts_gp_below_floor, labor_given_away, parts_below_cost). Totals by pay type and by advisor (customer pay).' },
  report: { base: 'repair-order-margins', what: 'repair order margin report', title: 'Repair order margins', columns: ['ro_number', 'pay_type', 'closed_date', 'advisor', 'customer', 'labor_sale', 'labor_cost', 'labor_gp_pct', 'parts_sale', 'parts_cost', 'parts_gp_pct', 'findings', 'why'],
    sections: (r) => [{ title: 'By pay type', rows: r.by_pay_type, columns: ['pay_type', 'repair_orders', 'labor_sale', 'labor_gp', 'labor_gp_pct', 'parts_sale', 'parts_gp', 'parts_gp_pct'] }, { title: 'By advisor', rows: r.by_advisor, columns: ['advisor', 'repair_orders', 'labor_sale', 'labor_gp_pct', 'parts_sale', 'parts_gp_pct'] }],
    limits: [LIMITS.files, 'Labor cost is the technician cost in your file; how it is loaded (flat rate, hourly, benefits) is your DMS setting.', LIMITS.pii] },
  refused: [{ name: 'dms_reprice_ro', category: 'production_deploy', description: 'It never reprices, reopens or changes a repair order.' }, { name: 'payroll_adjust_advisor_pay', category: 'move_money', description: 'It never changes advisor or technician pay.' }],
  prompt: { name: 'ro_margins', title: 'Review repair order margins', description: 'Walks the host model through a margin review.', arguments: [{ name: 'repair_orders', description: 'Closed RO lines', required: true }],
    text: 'You are helping a service or fixed-ops director with fairdrive-repair-order-margins. ROs: {{repair_orders}}.\n\nRules: it reads files and writes a report. It never changes a repair order. Customer names are masked.\n\n1. Call margins_check with the store floors. Give customer-pay labor and parts gross first, then orders with labor given away and parts below cost.\n2. Call margins_write_report.' },
});
