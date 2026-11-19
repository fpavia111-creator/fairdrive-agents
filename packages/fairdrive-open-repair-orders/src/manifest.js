import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, exportProfile } from 'fairdrive-core';
import { RO_FIELDS, ageOpenRos, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  open_ros: { type: 'string', description: 'Open repair orders under --root (CSV, Excel or JSON) from the DMS open RO report or a shop system: RO number, open date, advisor, customer, labor type, status, promised date, total, parts on order' },
  long_days: { type: 'integer', minimum: 1, maximum: 365, description: 'A customer-pay order open longer than this is flagged (default 30)' },
  warranty_days: { type: 'integer', minimum: 1, maximum: 365, description: 'A warranty order open longer than this is flagged (default 30)' },
  internal_days: { type: 'integer', minimum: 1, maximum: 365, description: 'An internal order open longer than this is flagged (default 14)' },
  as_of: { type: 'string', format: 'date', description: 'Date to age from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => ageOpenRos(ctx.records(a.open_ros), { asOf: a.as_of, longDays: a.long_days ?? 30, warrantyDays: a.warranty_days ?? 30, internalDays: a.internal_days ?? 14 });

export const manifest = checkAgent({
  name: 'fairdrive-open-repair-orders', version: pkg.version, prefix: 'openros',
  description: 'Ages every open repair order and totals it by age, advisor and pay type, and lists orders past their promised date, waiting on parts, warranty orders open too long (the claim cannot be filed), internal orders open too long (their cost is not booked) and customer-pay orders open too long. It never closes or changes a repair order.',
  sources: { open_ros: { label: 'Open repair orders', args: ['open_ros'], fields: RO_FIELDS, profiles: [exportProfile('cdk_open_ro', { ro_number: 'RO Number', opened: ['Open Date', 'RO Date'], advisor: ['Advisor', 'Service Advisor'], customer: ['Customer Name', 'Customer'], total: ['RO Total', 'Total'] }, { note: 'CDK open RO report: columns as printed by most stores; confirm with inspect.' })] } },
  args, required: ['open_ros'], run, line,
  scan: { name: 'openros_age', title: 'Age open repair orders', description: 'One row per open order that needs attention, oldest first: age, bucket, advisor, pay type, status, promised date, total, findings (past_promise, waiting_parts, warranty_open_long, internal_open_long, open_long). Totals by age, advisor and pay type.' },
  report: { base: 'open-repair-orders', what: 'open repair order report', title: (r) => `Open repair orders at ${r.as_of}`, columns: ['ro_number', 'opened', 'age_days', 'bucket', 'advisor', 'customer', 'pay_type', 'status', 'promised_date', 'total', 'findings', 'why'],
    sections: (r) => [{ title: 'By age', rows: r.by_age, columns: ['bucket', 'repair_orders', 'amount'] }, { title: 'By advisor', rows: r.by_advisor, columns: ['advisor', 'repair_orders', 'amount', 'oldest_days'] }, { title: 'By pay type', rows: r.by_pay_type, columns: ['pay_type', 'repair_orders', 'amount'] }],
    limits: [LIMITS.files, LIMITS.pii] },
  refused: [{ name: 'dms_close_ro', category: 'production_deploy', description: 'It never closes, reopens or changes a repair order.' }, { name: 'sms_text_customer', category: 'binding_send', description: 'It never texts or calls a customer.' }],
  prompt: { name: 'open_ros', title: 'Age open repair orders', description: 'Walks the host model through an open RO review.', arguments: [{ name: 'open_ros', description: 'Open RO report', required: true }],
    text: 'You are helping a service manager with fairdrive-open-repair-orders. Open ROs: {{open_ros}}.\n\nRules: it reads files and writes a report. It never closes an order or contacts a customer. Customer names are masked.\n\n1. Call openros_age. Lead with orders past their promise, then warranty and internal orders open too long.\n2. Call openros_write_report.' },
});
