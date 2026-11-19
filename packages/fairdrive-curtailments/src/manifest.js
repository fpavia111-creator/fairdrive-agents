import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { UNIT_FIELDS, DEFAULT_NEW, DEFAULT_USED, scheduleCurtailments, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const step = { type: 'object', additionalProperties: false, required: ['day', 'pct'], properties: { day: { type: 'integer', minimum: 1, maximum: 1095, description: 'Days after the floor date when this curtailment is due' }, pct: { type: 'number', minimum: 0, maximum: 100, description: 'Percent of the original amount due at that day (100 means pay off)' } } };
const args = {
  statement: { type: 'string', description: 'Floorplan statement or curtailment report under --root (CSV, Excel or JSON): VIN, stock number, floor date, original amount, principal balance, new or used' },
  schedule: { type: 'array', items: step, maxItems: 24, description: 'Curtailment schedule for new units from your floorplan agreement (default 10% at 91, 181 and 271 days, payoff at 361)' },
  used_schedule: { type: 'array', items: step, maxItems: 24, description: 'Curtailment schedule for used units (default 10% at 61 and 121 days, payoff at 181)' },
  weeks: { type: 'integer', minimum: 1, maximum: 26, description: 'How many weeks ahead to list curtailments coming due (default 4)' },
  as_of: { type: 'string', format: 'date', description: 'Date to work from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => scheduleCurtailments(ctx.records(a.statement), { asOf: a.as_of, schedule: a.schedule && a.schedule.length ? a.schedule : DEFAULT_NEW, usedSchedule: a.used_schedule && a.used_schedule.length ? a.used_schedule : DEFAULT_USED, weeks: a.weeks ?? 4 });

export const manifest = checkAgent({
  name: 'fairdrive-curtailments', version: pkg.version, prefix: 'curtailments',
  description: 'Works out the curtailment (principal pay-down) each floored unit owes under the schedule in your floorplan agreement, separately for new and used units, and lists what is overdue (including units past their last step, where the whole balance is due) and what falls due in the coming weeks, with totals by week for cash planning. It never pays a lender.',
  sources: { statement: { label: 'Floorplan statement', args: ['statement'], fields: UNIT_FIELDS } },
  args, required: ['statement'], run, line,
  scan: { name: 'curtailments_schedule', title: 'List curtailments overdue and coming due', description: 'One row per unit with a curtailment overdue or due within the horizon: age, amount paid down, amount required now, overdue, next due date and amount. Totals and a table by week.' },
  report: { base: 'curtailments', what: 'curtailment schedule', title: (r) => `Curtailments at ${r.as_of}`, columns: ['finding', 'vin', 'stock_number', 'new_used', 'floor_date', 'age_days', 'original_amount', 'balance', 'paid', 'required_now', 'amount', 'due_date', 'why'],
    sections: (r) => [{ title: 'By week', rows: r.by_week, columns: ['week_from', 'week_to', 'units', 'amount'] }],
    limits: [LIMITS.files, 'The default schedules are working examples, not any lender\'s terms. Pass the schedule from your floorplan agreement.', 'Not lending advice. A person pays the lender.'] },
  refused: [{ name: 'lender_portal_pay', category: 'move_money', description: 'It never pays a curtailment or moves money to a lender.' }, { name: 'dms_change_inventory', category: 'production_deploy', description: 'It never changes a vehicle record in the DMS.' }],
  prompt: { name: 'curtailment_plan', title: 'Plan floorplan curtailments', description: 'Walks the host model through a curtailment plan.', arguments: [{ name: 'statement', description: 'Floorplan statement', required: true }],
    text: 'You are helping a dealership controller with fairdrive-curtailments. Statement: {{statement}}.\n\nRules: it reads files and writes a report. It never pays a lender.\n\n1. Ask for the curtailment schedule in the floorplan agreement (new and used); the defaults are only examples.\n2. Call curtailments_schedule. Give the overdue amount first, then the amount due each week.\n3. Call curtailments_write_report.' },
});
