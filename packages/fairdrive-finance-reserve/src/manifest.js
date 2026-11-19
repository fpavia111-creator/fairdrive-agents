import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, partyIs } from 'fairdrive-core';
import { DEAL_FIELDS, PAYMENT_FIELDS, checkReserve, inquiryText, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  deals: { type: 'string', description: 'Financed deals under --root (CSV, Excel or JSON) from the DMS deal recap: deal number, customer, lender, contract date, amount financed, buy rate, contract rate, term, flat fee if the lender pays flat, product income expected' },
  payments: { type: 'string', description: 'Reserve and product income received, one row per payment: deal number, payer, kind (reserve, flat, service contract, GAP...), amount, date. From lender reserve statements and provider commission statements, combined' },
  share_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Share of the rate markup the lender pays the dealer, in percent (default 75)' },
  cap: { type: 'number', minimum: 0, maximum: 100000, description: 'Largest reserve a lender pays on one deal, if your agreements cap it' },
  tolerance: { type: 'number', minimum: 0, maximum: 500, description: 'Differences this small are ignored (default 5.00)' },
  grace_days: { type: 'integer', minimum: 0, maximum: 180, description: 'A deal younger than this is not yet expected to have paid (default 30)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count days since contract to, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkReserve(ctx.records(a.deals), ctx.records(a.payments), { asOf: a.as_of, sharePct: a.share_pct ?? 75, cap: a.cap ?? null, tolerance: a.tolerance ?? 5, graceDays: a.grace_days ?? 30 });

export const manifest = checkAgent({
  name: 'fairdrive-finance-reserve', version: pkg.version, prefix: 'reserve',
  description: 'Works out the finance reserve each deal should earn (the lender\'s share of the finance charge between buy rate and contract rate, or a flat fee) and compares it, and the expected F&I product income, with what lenders and providers paid. Lists reserve missing, short or over, product income missing or short, and payments with no deal, and drafts a reserve inquiry to one lender for a person to send. It never posts to the ledger.',
  sources: { deals: { label: 'Deal recap (financed deals)', args: ['deals'], fields: DEAL_FIELDS }, payments: { label: 'Reserve and product income received', args: ['payments'], fields: PAYMENT_FIELDS } },
  args, required: ['deals', 'payments'], run, line,
  scan: { name: 'reserve_check', title: 'Check reserve and product income against what was paid', description: 'One row per deal that needs attention: method (rate markup or flat), expected and received reserve, product income expected and received, findings (reserve_missing, reserve_short, reserve_over, product_income_missing, product_income_short, cannot_compute). Totals, a list by lender and payments with no deal.' },
  report: { base: 'finance-reserve', what: 'reserve report', title: 'Finance reserve and product income', columns: ['deal_number', 'customer', 'lender', 'contract_date', 'days', 'buy_rate', 'contract_rate', 'method', 'expected_reserve', 'reserve_received', 'reserve_difference', 'product_expected', 'product_received', 'findings', 'why'],
    sections: (r) => [{ title: 'By lender', rows: r.by_lender, columns: ['lender', 'deals', 'short'] }, { title: 'Payments with no deal', rows: r.payments_without_a_deal, columns: ['deal_number', 'amount'] }],
    limits: [LIMITS.files, 'Expected reserve assumes a simple-interest installment contract and the share you set. Lenders differ (caps, flat fees, rate limits, prepaid finance charges); your lender agreements decide.', LIMITS.advice, LIMITS.pii] },
  draft: { noun: 'inquiry', verb: 'send', category: 'binding_send', actor: 'the F&I director or controller', title: 'Draft a reserve inquiry to one lender',
    description: 'Write drafts/inquiry-<lender>.md: the deals where one lender paid no reserve or less than expected, with the rates. Marked DRAFT. Sending goes through reserve_request_send (one click).',
    required: ['deals', 'payments', 'lender'], args: { lender: { type: 'string', description: 'Lender as named in the deals file' }, from: { type: 'string', description: 'Your name and store' }, contact: { type: 'string', description: 'Lender dealer-support contact' } },
    build: (a, ctx, r) => { const is = partyIs(r.items.map((i) => i.lender), a.lender); const mine = r.items.filter((i) => is(i.lender) && (i.findings.includes('reserve_missing') || i.findings.includes('reserve_short'))); if (!mine.length) throw new Error(`no missing or short reserve from "${a.lender}"`); const d = inquiryText(mine, { lender: mine[0].lender, from: a.from, contact: a.contact, sharePct: r.share_pct }); return { id: mine[0].lender, to: a.contact, text: d.text, amount: d.total, extra: { deals: mine.length } }; } },
  refused: [{ name: 'gl_post_reserve', category: 'production_deploy', description: 'It never posts reserve or product income to the ledger.' }, { name: 'lender_portal_message', category: 'binding_send', description: 'It never writes to a lender portal.' }],
  prompt: { name: 'reserve_review', title: 'Check finance reserve received', description: 'Walks the host model through a reserve review.', arguments: [{ name: 'deals', description: 'Deal recap', required: true }, { name: 'payments', description: 'Payments received', required: true }],
    text: 'You are helping an F&I director or controller with fairdrive-finance-reserve. Deals: {{deals}}. Payments: {{payments}}.\n\nRules: it reads files and drafts; it never posts. The expected figure uses the share you set; lender agreements decide. Customer names are masked.\n\n1. Ask what share of the markup each lender pays and whether any pays flat; run reserve_check with share_pct.\n2. Give the reserve short in total and by lender, then product income short.\n3. Call reserve_write_report.\n4. Only when asked, reserve_draft_inquiry for one lender, then reserve_request_send after review.' },
});
