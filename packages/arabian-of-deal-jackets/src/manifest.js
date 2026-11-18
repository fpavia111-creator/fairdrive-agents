import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { DEAL_FIELDS, DOC_FIELDS, DOC_CODES, checkJackets, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const codes = { type: 'array', items: { type: 'string', enum: DOC_CODES }, maxItems: 20 };
const args = {
  deals: { type: 'string', description: 'Deal list under --root (CSV, Excel or JSON) from the DMS: deal number, deal and delivery dates, customer, deal type (cash, finance, lease), new or used, trade-in VIN, F&I manager, status' },
  documents: { type: 'string', description: 'Document index under --root from the scanning or e-contracting system: one row per document in a jacket, with deal number, document name, signed yes/no, date received' },
  extra_documents: { ...codes, description: 'Document codes your store also requires on every deal (for example drivers_license is already required; add buyers_guide to require it on new cars too)' },
  not_required: { ...codes, description: 'Document codes your store does not keep in the jacket (dropped from every checklist)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count days since delivery from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => checkJackets(ctx.records(a.deals), ctx.records(a.documents), { asOf: a.as_of, extra: a.extra_documents || [], notRequired: a.not_required || [] });

export const manifest = checkAgent({
  name: 'arabian-of-deal-jackets', version: pkg.version, prefix: 'arabian',
  description: 'Checks every deal jacket against the documents a deal of its type should hold: buyer\'s order, odometer disclosure, title application, privacy notice, OFAC and Red Flags records, insurance and licence copies, the Buyers Guide on used cars, credit application and contract on financed deals, lease papers on leases, and trade-in title and power of attorney when there is a trade. Lists what is missing or unsigned, oldest delivery first. It reads files; it never books, changes, unwinds or sends a deal, and it does not decide whether a deal meets any law.',
  sources: { deals: { label: 'Deal list', args: ['deals'], fields: DEAL_FIELDS }, documents: { label: 'Deal jacket document index', args: ['documents'], fields: DOC_FIELDS } },
  args, required: ['deals', 'documents'], run, line,
  scan: { name: 'arabian_check_jackets', title: 'Check deal jackets for missing documents', description: 'One row per incomplete deal: documents missing and documents unsigned (by name), days since delivery, F&I manager. Totals by document and by F&I manager, scanned deal numbers that are not in the deal file, and document names it did not recognise.' },
  report: { base: 'arabian-deal-jackets', what: 'deal jacket report', title: 'Deal jackets with missing documents', columns: ['deal_number', 'customer', 'deal_type', 'sale_type', 'fi_manager', 'delivered', 'days_since_delivery', 'missing', 'unsigned', 'gaps'],
    sections: (r) => [{ title: 'By document', rows: r.by_document, columns: ['document', 'deals'] }, { title: 'By F&I manager', rows: r.by_fi_manager, columns: ['fi_manager', 'incomplete_deals', 'gaps'] }],
    limits: [LIMITS.files, 'The checklist is a working default by deal type; your state, lenders and store policy may need more or fewer documents. It checks that a document is in the jacket, not that it is filled in correctly.', 'Not legal advice. Whether a deal meets a law or a lender\'s rules is for your compliance officer.', LIMITS.pii] },
  refused: [
    { name: 'dms_book_deal', category: 'production_deploy', description: 'Arabian never books, unwinds or changes a deal in the DMS.' },
    { name: 'esign_send_envelope', category: 'binding_send', description: 'Arabian never sends documents to a customer for signature.' },
  ],
  prompt: { name: 'deal_jacket_check', title: 'Find deal jackets with missing documents', description: 'Walks the host model through a deal jacket check with Arabian.', arguments: [{ name: 'deals', description: 'Deal list', required: true }, { name: 'documents', description: 'Document index', required: true }],
    text: 'You are helping a dealership office manager or F&I director with arabian-of-deal-jackets. Deals: {{deals}}. Documents: {{documents}}.\n\nRules: Arabian reads files and writes a report. It never books or changes a deal and never sends anything to a customer. It does not say whether a deal is legal; it says which documents are not in the jacket. Customer names are masked in what you see.\n\n1. Call arabian_check_jackets. Give the number of incomplete jackets, the documents missing most often and the oldest delivery first.\n2. Ask whether the store keeps any document elsewhere (not_required) or requires more (extra_documents), and run again if so.\n3. Call arabian_write_report so the office can work the list.' },
});
