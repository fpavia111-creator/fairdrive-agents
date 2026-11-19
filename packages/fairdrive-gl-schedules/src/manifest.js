import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DETAIL_FIELDS, BALANCE_FIELDS, ageSchedules, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  detail: { type: 'string', description: 'Schedule detail under --root (CSV, Excel or JSON) from the DMS schedule report: schedule number, control number, description, date, amount' },
  balances: { type: 'string', description: 'Ledger balance for each schedule account: schedule number, schedule name, GL balance' },
  tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Differences this small are ignored (default 1.00)' },
  as_of: { type: 'string', format: 'date', description: 'Month-end or other date to age from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => ageSchedules(ctx.records(a.detail), ctx.records(a.balances), { asOf: a.as_of, tolerance: a.tolerance ?? 1 });

export const manifest = checkAgent({
  name: 'fairdrive-gl-schedules', version: pkg.version, prefix: 'schedules',
  description: 'Ties each DMS schedule (contracts in transit, factory and warranty receivables, vehicle receivables and others) to its ledger balance, ages the open items by control number, and lists schedules out of balance, controls open over 90 days, credit balances on receivable schedules and controls that net to zero and can be cleared. It never posts to the ledger or purges a schedule.',
  sources: { detail: { label: 'Schedule detail', args: ['detail'], fields: DETAIL_FIELDS }, balances: { label: 'Ledger balances by schedule', args: ['balances'], fields: BALANCE_FIELDS } },
  args, required: ['detail', 'balances'], run, line,
  scan: { name: 'schedules_age', title: 'Tie schedules to the ledger and age them', description: 'Findings (out_of_balance, no_gl_balance, over_90_days, credit_balance, zero_balance_control) by schedule and control number, and one row per schedule: ledger balance, detail total, difference, open controls and amounts by age.' },
  report: { base: 'gl-schedules', what: 'schedule report', title: (r) => `Schedules at ${r.as_of}`, columns: ['finding', 'schedule', 'schedule_name', 'control_number', 'age', 'amount', 'why'],
    sections: (r) => [{ title: 'By schedule', rows: r.by_schedule, columns: ['schedule', 'schedule_name', 'gl_balance', 'detail_total', 'difference', 'open_controls', 'age_0-30', 'age_31-60', 'age_61-90', 'age_90+'] }],
    limits: [LIMITS.files, 'Receivable schedules are recognised by their names (receivable, in transit, warranty, factory, rebate, holdback). Credit balances on other schedules are not flagged.', LIMITS.advice] },
  refused: [{ name: 'gl_post_entry', category: 'production_deploy', description: 'It never posts an entry to the ledger.' }, { name: 'dms_purge_schedule', category: 'production_deploy', description: 'It never clears or purges schedule items.' }],
  prompt: { name: 'gl_schedules', title: 'Reconcile schedules', description: 'Walks the host model through a month-end schedule review.', arguments: [{ name: 'detail', description: 'Schedule detail', required: true }, { name: 'balances', description: 'Ledger balances', required: true }],
    text: 'You are helping a dealership controller with fairdrive-gl-schedules. Detail: {{detail}}. Balances: {{balances}}.\n\nRules: it reads files and writes a report. It never posts or purges.\n\n1. Call schedules_age with the month-end date. Lead with schedules out of balance, then items over 90 days and credit balances on receivables.\n2. Call schedules_write_report.' },
});
