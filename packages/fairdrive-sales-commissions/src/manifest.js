import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, PLAN_FIELDS, PAID_FIELDS, computeCommissions, sheetText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Delivered deals for the pay period under --root (CSV, Excel or JSON): deal number, delivery date, salesperson, split with, customer, sale type, front gross, back gross' },
  plans: { type: 'string', description: 'Pay plans (settings you keep): salesperson, front percent, back percent, mini (minimum per deal)' },
  paid: { type: 'string', description: 'Optional commissions already paid: salesperson, deal number, amount paid' },
  tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Differences this small are ignored (default 1.00)' },
};
const run = (a, ctx) => computeCommissions(ctx.records(a.deals), ctx.records(a.plans), a.paid ? ctx.records(a.paid) : null, { tolerance: a.tolerance ?? 1 });
const who = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const manifest = checkAgent({
  name: 'fairdrive-sales-commissions', version: pkg.version, prefix: 'commissions',
  description: 'Works out each salesperson\'s commission on every deal from your pay plans (front and back percentages, a minimum per deal, split deals shared equally), totals it by salesperson, and, with a paid file, lists commissions underpaid, overpaid, unpaid or paid on no deal, and deals for salespeople with no plan. Drafts one salesperson\'s commission sheet for one named person to approve. It never runs payroll.',
  sources: { deals: { label: 'Delivered deals', args: ['deals'], fields: DEAL_FIELDS }, plans: { label: 'Pay plans (settings)', args: ['plans'], fields: PLAN_FIELDS }, paid: { label: 'Commissions paid', args: ['paid'], fields: PAID_FIELDS } },
  args, required: ['deals', 'plans'], run, line,
  scan: { name: 'commissions_compute', title: 'Work out commissions and check what was paid', description: 'Findings (underpaid, overpaid, unpaid, no_plan, paid_without_deal) with the commission computed and paid, every deal line under lines, and a summary by salesperson: units, front and back gross, commission, paid, difference.' },
  report: { base: 'sales-commissions', what: 'commission report', title: 'Sales commissions', rows: (r) => r.lines, columns: ['salesperson', 'deal_number', 'delivery_date', 'customer', 'share', 'front_gross', 'back_gross', 'commission', 'paid', 'difference', 'finding', 'why'],
    sections: (r) => [{ title: 'By salesperson', rows: r.by_salesperson, columns: ['salesperson', 'units', 'front_gross', 'back_gross', 'commission', 'paid', 'difference'] }, { title: 'Findings', rows: r.items, columns: ['finding', 'salesperson', 'deal_number', 'commission', 'paid', 'why'] }],
    limits: [LIMITS.files, 'Commission follows the plan file: percent of front and back gross (negative gross counts as zero), the greater of that and the mini, split equally on split deals. Spiffs, draws, packs and chargebacks are not in ver 1.', 'Pay is decided by a person under your pay plans and wage law.', LIMITS.pii] },
  draft: { noun: 'sheet', verb: 'pay', category: 'move_money', actor: 'the sales manager or controller', title: 'Draft one salesperson\'s commission sheet',
    description: 'Write drafts/sheet-<salesperson>.md: that salesperson\'s deals, shares, gross and commission, with the total. Marked DRAFT. Approving goes through commissions_request_pay (one named click, even in Auto); payroll is run by a person.',
    required: ['deals', 'plans', 'salesperson'], args: { salesperson: { type: 'string', description: 'Salesperson as named in the deal file, or the ST- pseudonym a result showed' }, period: { type: 'string', description: 'Pay period label, for example November 2026' }, from: { type: 'string', description: 'Your name' } },
    build: (a, ctx, r) => { const mine = r.lines.filter((x) => who(x.salesperson) === who(a.salesperson) || (ctx.pii && ctx.pii.same(x.salesperson, a.salesperson, 'staff'))); if (!mine.length) throw new Error(`no deals for "${a.salesperson}"`); const d = sheetText(mine, { salesperson: mine[0].salesperson, period: a.period, from: a.from }); return { id: ctx.pii && ctx.pii.on ? ctx.pii.token('staff', mine[0].salesperson) : mine[0].salesperson, text: d.text, amount: d.total, extra: { deals: mine.length } }; } },
  refused: [{ name: 'payroll_submit', category: 'move_money', description: 'It never submits commissions or pay to payroll.' }, { name: 'dms_change_deal_gross', category: 'production_deploy', description: 'It never changes a deal or its gross.' }],
  prompt: { name: 'commissions', title: 'Work out commissions', description: 'Walks the host model through a commission run.', arguments: [{ name: 'deals', description: 'Deals', required: true }, { name: 'plans', description: 'Pay plans', required: true }],
    text: 'You are helping a sales manager or office manager with fairdrive-sales-commissions. Deals: {{deals}}. Plans: {{plans}}.\n\nRules: it reads files and drafts commission sheets. It never runs payroll. Spiffs, draws and chargebacks are not included; say so. Customer and staff names are masked (CU-, ST-); the report files keep the real names.\n\n1. Call commissions_compute (with paid when the person has it). Give totals by salesperson, then underpaid and unpaid lines.\n2. Call commissions_write_report.\n3. Only when asked, commissions_draft_sheet for one salesperson, then commissions_request_pay.' },
});
