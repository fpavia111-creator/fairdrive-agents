import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, exportProfile } from 'fairdrive-core';
import { INVENTORY_FIELDS, STATEMENT_FIELDS, auditFloorplan, payoffText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  inventory: { type: 'string', description: 'Vehicle inventory under --root (CSV, Excel or JSON) from the DMS, including units sold this month: stock number, VIN, status, sold date, new or used, floorplan balance the DMS carries' },
  statement: { type: 'string', description: 'Floorplan lender statement (or curtailment report) under --root: VIN, floor date, principal balance' },
  payoff_days: { type: 'integer', minimum: 0, maximum: 30, description: 'Days after a sale within which your floorplan agreement wants the unit paid off (default 5)' },
  tolerance: { type: 'number', minimum: 0, maximum: 5000, description: 'Balance differences this small are ignored (default 1.00)' },
  as_of: { type: 'string', format: 'date', description: 'Statement date, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => auditFloorplan(ctx.records(a.inventory), ctx.records(a.statement), { asOf: a.as_of, payoffDays: a.payoff_days ?? 5, tolerance: a.tolerance ?? 1 });

export const manifest = checkAgent({
  name: 'fairdrive-floorplan-audit', version: pkg.version, prefix: 'floorplan',
  description: 'Matches the DMS vehicle inventory against the floorplan lender statement by VIN (full or last 8) and lists units sold but not paid off past your payoff days, payoffs falling due, units on the statement the DMS does not have, balance differences between the DMS and the lender, and units in stock that are not floored. Drafts a payoff list for one named person to approve. It never pays a lender or changes inventory.',
  sources: { inventory: { label: 'DMS vehicle inventory', args: ['inventory'], fields: INVENTORY_FIELDS, profiles: [exportProfile('cdk_vehicle_inventory', { stock_number: 'Stock No', vin: 'VIN', status: ['Status', 'Stock Status'], sold_date: ['Sold Date', 'Date Sold'] }, { note: 'CDK vehicle inventory list: as printed by most stores; confirm with inspect.' })] }, statement: { label: 'Floorplan lender statement', args: ['statement'], fields: STATEMENT_FIELDS } },
  args, required: ['inventory', 'statement'], run, line,
  scan: { name: 'floorplan_audit', title: 'Audit the floorplan against inventory', description: 'One row per finding: sold_not_paid_off (with days since sale), payoff_due, on_statement_not_in_inventory, balance_differs (DMS less lender), not_floored. Totals by finding.' },
  report: { base: 'floorplan-audit', what: 'floorplan audit', title: (r) => `Floorplan audit at ${r.as_of}`, columns: ['finding', 'stock_number', 'vin', 'status', 'sold_date', 'days_since_sale', 'floor_date', 'statement_balance', 'amount', 'why'],
    limits: [LIMITS.files, 'Statement balances are principal only; the lender payoff adds interest and fees to date.', 'Not legal or lending advice. Your floorplan agreement sets the payoff terms.'] },
  draft: { noun: 'payoffs', verb: 'pay', category: 'move_money', actor: 'the controller', title: 'Draft the floorplan payoff list',
    description: 'Write drafts/payoffs-<date>.md: every sold unit still floored, with its statement balance and total. Marked DRAFT. Approving goes through floorplan_request_pay (one named click, even in Auto); a person pays the lender.',
    args: { lender: { type: 'string', description: 'Floorplan lender name for the heading' }, from: { type: 'string', description: 'Your name and store' } },
    build: (a, ctx, r) => { const d = payoffText(r.items, { lender: a.lender, from: a.from }); if (!d.total) throw new Error('no sold units are still floored'); return { id: r.as_of, to: a.lender, text: d.text, amount: d.total, extra: { units: r.sold_not_paid_off + r.payoff_due } }; } },
  refused: [{ name: 'lender_portal_payoff', category: 'move_money', description: 'It never pays off a unit or moves money to a lender.' }, { name: 'dms_change_inventory', category: 'production_deploy', description: 'It never changes a vehicle record in the DMS.' }],
  prompt: { name: 'floorplan_audit', title: 'Audit the floorplan', description: 'Walks the host model through a floorplan audit.', arguments: [{ name: 'inventory', description: 'DMS inventory', required: true }, { name: 'statement', description: 'Lender statement', required: true }],
    text: 'You are helping a dealership controller with fairdrive-floorplan-audit. Inventory: {{inventory}}. Statement: {{statement}}.\n\nRules: it reads files and drafts a payoff list. It never pays a lender and never changes inventory.\n\n1. Call floorplan_audit. Lead with units sold and not paid off (amount and days), then units on the statement the DMS does not have.\n2. Call floorplan_write_report.\n3. Only when asked, floorplan_draft_payoffs, then floorplan_request_pay; say a person pays the lender.' },
});
