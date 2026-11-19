import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, partyIs } from 'fairdrive-core';
import { CONTRACT_FIELDS, STATEMENT_FIELDS, checkFunding, followUpText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  contracts: { type: 'string', description: 'Financed deals under --root (CSV, Excel or JSON) from the DMS or the contracts-in-transit schedule: deal number, customer, VIN, lender, contract date, amount financed, expected funding, funded date and amount, status, open stips' },
  lender_statement: { type: 'string', description: 'Optional lender funding statement(s) combined in one file: lender, deal number or VIN, funded date, funded amount. Used to catch money received but not posted, and contracts marked funded that never funded' },
  alert_days: { type: 'integer', minimum: 1, maximum: 120, description: 'Contracts in transit longer than this many days are flagged (default 10)' },
  tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'A funded amount this close to the expected funding is not a difference (default 1.00)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count days in transit to, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkFunding(ctx.records(a.contracts), a.lender_statement ? ctx.records(a.lender_statement) : null, { asOf: a.as_of, alertDays: a.alert_days ?? 10, tolerance: a.tolerance ?? 1 });

export const manifest = checkAgent({
  name: 'fairdrive-contracts-in-transit', version: pkg.version, prefix: 'funding',
  description: 'Ages every financed contract that has not funded yet (contracts in transit) by lender and by days, with the stipulations still open and the contracts a lender returned. With a lender statement it also catches money the lender sent that the DMS still shows as unfunded, contracts marked funded that are not on the statement, and contracts funded short. Drafts a follow-up to one lender for a person to send. It never submits to a lender portal and never posts to the ledger.',
  sources: { contracts: { label: 'Contracts in transit (DMS)', args: ['contracts'], fields: CONTRACT_FIELDS }, lender_statement: { label: 'Lender funding statement', args: ['lender_statement'], fields: STATEMENT_FIELDS } },
  args, required: ['contracts'], run, line,
  scan: { name: 'funding_age_contracts', title: 'Age contracts in transit and find funding exceptions', description: 'One row per contract that needs attention: in transit (days, age bucket, open stips), returned by the lender, funded by the lender but still open in the DMS, funded short or over, marked funded but not on the lender statement. Totals by lender and by age, and statement lines that match no contract.' },
  report: { base: 'contracts-in-transit', what: 'contracts-in-transit report', title: (r) => `Contracts in transit at ${r.as_of}`, columns: ['finding', 'deal_number', 'customer', 'lender', 'contract_date', 'amount_financed', 'days', 'bucket', 'stips', 'funded_on', 'funded_amount', 'difference', 'why'],
    sections: (r) => [{ title: 'By lender', rows: r.by_lender, columns: ['lender', 'contracts', 'amount', 'oldest_days'] }, { title: 'By age', rows: r.by_age, columns: ['bucket', 'contracts', 'amount'] }, { title: 'Statement lines that match no contract', rows: r.statement_lines_not_matched, columns: ['lender', 'deal_number', 'vin', 'funded_on', 'funded_amount'] }],
    limits: [LIMITS.files, 'Funded means the DMS shows a funded date or status, or the lender statement shows the money. It does not read a bank account.', 'Not lending advice. A person decides what to send a lender and when to post funding.', LIMITS.pii] },
  draft: { noun: 'follow_up', verb: 'send', category: 'binding_send', actor: 'a person in the F&I office', title: 'Draft a funding follow-up to one lender',
    description: 'Write drafts/follow_up-<lender>.md: the contracts in transit with one lender, oldest first, with their open stips, asking what is still needed. Marked DRAFT. Sending goes through funding_request_send (one click).',
    required: ['contracts', 'lender'], args: { lender: { type: 'string', description: 'Lender as named in the contracts file' }, from: { type: 'string', description: 'Your name and store' }, contact: { type: 'string', description: 'The lender funding contact (e-mail or name)' } },
    build: (a, ctx, r) => { const is = partyIs(r.items.map((i) => i.lender), a.lender); const mine = r.items.filter((i) => is(i.lender) && (i.finding === 'in_transit' || i.finding === 'returned_by_lender')); if (!mine.length) throw new Error(`no contracts in transit with "${a.lender}"`); const name = mine[0].lender; return { id: name, to: a.contact, text: followUpText(mine, { lender: name, from: a.from, contact: a.contact }), amount: mine.reduce((s, i) => s + (i.amount_financed || 0), 0), extra: { contracts: mine.length } }; } },
  refused: [
    { name: 'lender_portal_submit', category: 'binding_send', description: 'Fairdrive Contracts In Transit never uploads stips or submits a contract to a lender portal.' },
    { name: 'gl_post_funding', category: 'production_deploy', description: 'Fairdrive Contracts In Transit never posts funding to the ledger or clears the contracts-in-transit schedule.' },
  ],
  prompt: { name: 'contracts_in_transit', title: 'Age contracts in transit', description: 'Walks the host model through a contracts-in-transit review with Fairdrive Contracts In Transit.', arguments: [{ name: 'contracts', description: 'Contracts in transit file', required: true }],
    text: 'You are helping a dealership office manager or controller with fairdrive-contracts-in-transit. Contracts: {{contracts}}.\n\nRules: Fairdrive Contracts In Transit reads files and drafts. It never submits to a lender and never posts to the ledger. Customer names are masked in what you see.\n\n1. Call funding_age_contracts (with lender_statement when the person has one). Give the amount in transit, the number over the alert days, and the oldest contracts first.\n2. Point out money funded but not posted, and contracts marked funded that are not on the statement.\n3. Call funding_write_report.\n4. Only when asked, call funding_draft_follow_up for one lender, then funding_request_send after the person reviews it.' },
});
