import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, trackTitles, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Delivered deals under --root (CSV, Excel or JSON) from the DMS title log: deal number, customer, VIN, delivery date, state, trade-in VIN, trade title received, title application sent, registration issued, temporary tag expiry' },
  submit_days: { type: 'integer', minimum: 1, maximum: 120, description: 'Days after delivery within which the title application must be sent (default 30; set your state rule)' },
  trade_title_days: { type: 'integer', minimum: 1, maximum: 120, description: 'Days after delivery by which the trade-in title should be in hand (default 15)' },
  tag_warning_days: { type: 'integer', minimum: 0, maximum: 30, description: 'Warn this many days before a temporary tag expires (default 7)' },
  registration_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Days after the application after which a missing registration is flagged (default 45)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => trackTitles(ctx.records(a.deals), { asOf: a.as_of, submitDays: a.submit_days ?? 30, tradeTitleDays: a.trade_title_days ?? 15, tagWarningDays: a.tag_warning_days ?? 7, registrationDays: a.registration_days ?? 45 });

export const manifest = checkAgent({
  name: 'fairdrive-title-tracking', version: pkg.version, prefix: 'titles',
  description: 'Tracks title applications, trade-in titles, registrations and temporary tags for every delivered deal against the days you set for your state, and lists applications late or due within a week, trade titles not received, temporary tags expired or about to expire with no registration, and registrations pending too long. It never files with the DMV or changes a deal.',
  sources: { deals: { label: 'Delivered deals (title log)', args: ['deals'], fields: DEAL_FIELDS } },
  args, required: ['deals'], run, line,
  scan: { name: 'titles_track', title: 'Track titles, registrations and temporary tags', description: 'One row per deal that needs action, oldest delivery first: days since delivery, dates sent and issued, temporary tag expiry, trade title, findings (application_late, application_due_soon, trade_title_missing, temp_tag_expired, temp_tag_expiring, registration_pending). Totals by finding.' },
  report: { base: 'title-tracking', what: 'title tracking report', title: (r) => `Titles and registrations at ${r.as_of}`, columns: ['deal_number', 'customer', 'vin', 'state', 'delivery_date', 'days_since_delivery', 'title_application_sent', 'registration_issued', 'temp_tag_expires', 'trade_vin', 'trade_title_received', 'findings', 'why'],
    limits: [LIMITS.files, 'The day limits are settings. State deadlines differ and change; set them from your state rules. This is not legal advice.', LIMITS.pii] },
  refused: [{ name: 'dmv_submit_application', category: 'binding_send', description: 'It never files a title or registration application.' }, { name: 'dms_update_deal', category: 'production_deploy', description: 'It never changes a deal or its title log.' }],
  prompt: { name: 'title_tracking', title: 'Track titles and temp tags', description: 'Walks the host model through a title review.', arguments: [{ name: 'deals', description: 'Title log', required: true }],
    text: 'You are helping a title clerk or office manager with fairdrive-title-tracking. Deals: {{deals}}.\n\nRules: it reads files and writes a report. It never files with the DMV. The day limits are settings; ask for the state rules. Customer names are masked.\n\n1. Call titles_track with the store settings. Lead with expired temporary tags and late applications.\n2. Call titles_write_report.' },
});
