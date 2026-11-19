import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, CHECK_FIELDS, checkRecords, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Deals under --root (CSV, Excel or JSON): deal number, buyer, co-buyer, delivery date, deal type, credit pulled yes/no, status' },
  checks: { type: 'string', description: 'Check log from the F&I or compliance tool: deal number, check type (OFAC, Red Flags, ID verification), person (buyer or co-buyer), check date, result recorded yes/no, performed by. Results themselves are not read' },
};
const run = (a, ctx) => checkRecords(ctx.records(a.deals), ctx.records(a.checks));

export const manifest = checkAgent({
  name: 'fairdrive-ofac-red-flags', version: pkg.version, prefix: 'redflags',
  description: 'Checks that every deal has an OFAC check record for the buyer and any co-buyer dated on or before delivery, a Red Flags (identity) check record when credit was involved, and that each record says its result was recorded. It checks that the records exist; it makes no compliance determination, never reads or judges a check result, and never clears a possible match.',
  sources: { deals: { label: 'Deals', args: ['deals'], fields: DEAL_FIELDS }, checks: { label: 'OFAC and Red Flags check log', args: ['checks'], fields: CHECK_FIELDS } },
  args, required: ['deals', 'checks'], run, line,
  scan: { name: 'redflags_check', title: 'Check OFAC and Red Flags records are on file', description: 'One row per deal with a record gap: ofac_missing, ofac_after_delivery, co_buyer_not_checked, red_flags_missing, result_not_recorded, with the number of records found. Totals. Record presence only.' },
  report: { base: 'ofac-red-flags', what: 'record gap report', title: 'OFAC and Red Flags records', columns: ['deal_number', 'customer', 'co_buyer', 'delivery_date', 'deal_type', 'records_found', 'gaps', 'why'],
    limits: [LIMITS.files, 'It checks that a record exists, its date and that its result was recorded. It does not run a check, read a result or decide whether a deal meets any law; that is for your compliance officer.', 'Not legal advice.', LIMITS.pii] },
  refused: [{ name: 'ofac_clear_match', category: 'production_deploy', description: 'It never clears, overrides or marks a possible match.' }, { name: 'dms_book_deal', category: 'production_deploy', description: 'It never books, holds or changes a deal.' }],
  prompt: { name: 'ofac_red_flags', title: 'Check OFAC and Red Flags records', description: 'Walks the host model through a record check.', arguments: [{ name: 'deals', description: 'Deals', required: true }, { name: 'checks', description: 'Check log', required: true }],
    text: 'You are helping an F&I director or compliance officer with fairdrive-ofac-red-flags. Deals: {{deals}}. Checks: {{checks}}.\n\nRules: it only checks that records exist and are dated before delivery. Never say a deal is or is not compliant, and never interpret a check result. Customer names are masked.\n\n1. Call redflags_check. List the deals with gaps, missing OFAC records first.\n2. Call redflags_write_report for the compliance officer.' },
});
