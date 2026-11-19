// Fairdrive Deal Jackets: deal jacket completeness. Pure functions.
import { str, normId, isoDate, daysBetween, asOfDate, groupBy, tally, yes, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Deal ID', 'Deal'], { required: true }),
  deal_date: t(['Deal Date', 'Contract Date', 'Sold Date', 'Sale Date'], { type: 'date' }),
  delivery_date: t(['Delivery Date', 'Delivered', 'Delivered Date', 'Funded/Delivered'], { type: 'date' }),
  customer: t(['Customer', 'Customer Name', 'Buyer', 'Buyer Name', 'Purchaser'], { pii: 'name' }),
  deal_type: t(['Deal Type', 'Finance Type', 'Payment Type', 'Sale Kind']),
  sale_type: t(['Sale Type', 'New/Used', 'N/U', 'Vehicle Type', 'Stock Type']),
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Stock']),
  trade_vin: t(['Trade VIN', 'Trade 1 VIN', 'Trade-In VIN']),
  fi_manager: t(['F&I Manager', 'Finance Manager', 'Business Manager', 'F&I']),
  status: t(['Deal Status', 'Status', 'State']),
});
export const DOC_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Deal ID', 'Deal'], { required: true }),
  document: t(['Document', 'Document Name', 'Form', 'Form Name', 'Doc Type', 'Description'], { required: true }),
  signed: t(['Signed', 'Signed?', 'Executed', 'E-Signed'], { type: 'bool' }),
  received_date: t(['Received Date', 'Scanned', 'Scan Date', 'Uploaded', 'Date'], { type: 'date' }),
});

// What a deal jacket holds, by code. Words match free-text document names in a
// scanning or e-contracting export (any case, any punctuation).
export const DOCUMENTS = Object.freeze({
  buyers_order: { label: "Buyer's order / bill of sale", words: [/buyer'?s? ?order/, /bill of sale/, /purchase agreement/, /retail purchase/, /\bbo\b/] },
  odometer: { label: 'Odometer disclosure', words: [/odometer/, /odo (statement|disclosure)/, /mileage statement/] },
  title_application: { label: 'Title / registration application', words: [/title app/, /application for title/, /registration app/, /title and registration/, /\bmv-?1\b/, /tag app/] },
  privacy_notice: { label: 'Privacy notice', words: [/privacy/, /glba/] },
  ofac: { label: 'OFAC check record', words: [/\bofac\b/, /sdn (check|search)/] },
  red_flags: { label: 'Red Flags / identity check record', words: [/red ?flags?/, /identity (theft|verification|check)/, /\bid (verification|check)\b/] },
  insurance: { label: 'Proof of insurance', words: [/insurance (card|binder|verification|proof)/, /proof of insurance/, /\binsurance\b/] },
  drivers_license: { label: "Copy of driver's license", words: [/driver'?s? ?licen[cs]e/, /\bdl copy\b/, /photo id/] },
  buyers_guide: { label: 'Buyers Guide (window form)', words: [/buyers? ?guide/, /as[- ]is/, /window (form|sticker)/] },
  credit_application: { label: 'Credit application', words: [/credit app/, /application for credit/] },
  installment_contract: { label: 'Retail installment contract', words: [/\brisc\b/, /retail installment/, /installment (sale|sales) contract/, /finance contract/, /\b553\b/] },
  credit_notice: { label: 'Credit score / risk-based pricing notice', words: [/credit score/, /risk[- ]based pricing/, /\brbp\b/] },
  lease_agreement: { label: 'Lease agreement', words: [/lease (agreement|contract)/, /closed[- ]end lease/] },
  trade_title: { label: 'Trade-in title or payoff authorisation', words: [/trade (title|payoff)/, /payoff (auth|authori[sz]ation|letter)/, /lien release/, /\btrade-?in title\b/] },
  power_of_attorney: { label: 'Power of attorney', words: [/power of attorney/, /\bpoa\b/] },
});
export const DOC_CODES = Object.freeze(Object.keys(DOCUMENTS));
export const RULES = Object.freeze({
  every: ['buyers_order', 'odometer', 'title_application', 'privacy_notice', 'ofac', 'red_flags', 'insurance', 'drivers_license'],
  used: ['buyers_guide'],
  finance: ['credit_application', 'installment_contract', 'credit_notice'],
  lease: ['credit_application', 'lease_agreement', 'credit_notice'],
  trade: ['trade_title', 'power_of_attorney'],
});
const SKIP = /unwound|unwind|cancel|void|dead|lost|wholesale/i;

/** Document code for a free-text document name, or null. */
export function docCode(name) {
  const s = str(name).toLowerCase().replace(/[_]+/g, ' ');
  if (!s) return null;
  if (DOCUMENTS[s.replace(/\s+/g, '_')]) return s.replace(/\s+/g, '_');
  for (const [code, d] of Object.entries(DOCUMENTS)) if (d.words.some((w) => w.test(s))) return code;
  return null;
}
const dealKind = (v) => { const s = str(v).toLowerCase(); return /lease/.test(s) ? 'lease' : /financ|retail install|loan|\bfin\b|\bbhph\b/.test(s) ? 'finance' : 'cash'; };
const isUsed = (v) => /used|pre-?owned|cpo|certified|\bu\b/i.test(str(v));

/** Which documents a deal needs, as codes. */
export function requiredFor(deal, { extra = [], notRequired = [] } = {}) {
  const need = [...RULES.every];
  if (isUsed(deal.sale_type)) need.push(...RULES.used);
  const k = dealKind(deal.deal_type);
  if (k === 'finance') need.push(...RULES.finance);
  if (k === 'lease') need.push(...RULES.lease);
  if (str(deal.trade_vin)) need.push(...RULES.trade);
  need.push(...extra);
  return [...new Set(need)].filter((c) => !notRequired.includes(c));
}

/** Check every deal jacket against the documents it should hold. */
export function checkJackets(deals, docs, { asOf, extra = [], notRequired = [] } = {}) {
  const today = asOfDate(asOf);
  const byDeal = groupBy(docs.filter((d) => normId(d.deal_number)), (d) => normId(d.deal_number));
  const seenDeals = new Set(); const items = []; let skipped = 0; const unknownDocs = new Map();
  for (const d of deals) {
    const id = normId(d.deal_number); if (!id || seenDeals.has(id)) continue;
    seenDeals.add(id);
    if (SKIP.test(str(d.status))) { skipped++; continue; }
    const need = requiredFor(d, { extra, notRequired });
    const have = new Map(); // code -> signed state
    for (const doc of byDeal.get(id) || []) {
      const c = docCode(doc.document);
      if (!c) { const k = str(doc.document); if (k) unknownDocs.set(k, (unknownDocs.get(k) || 0) + 1); continue; }
      const s = yes(doc.signed);
      // Any signed copy wins over an unsigned one.
      if (!have.has(c) || (have.get(c) === false && s !== false)) have.set(c, s);
    }
    const missing = need.filter((c) => !have.has(c));
    const unsigned = need.filter((c) => have.get(c) === false);
    const delivered = isoDate(d.delivery_date) || isoDate(d.deal_date);
    const age = delivered ? daysBetween(delivered, today) : null;
    items.push({ deal_number: str(d.deal_number), customer: str(d.customer), deal_type: dealKind(d.deal_type), sale_type: isUsed(d.sale_type) ? 'used' : 'new', fi_manager: str(d.fi_manager), delivered, days_since_delivery: age, required: need.length, missing: missing.map((c) => DOCUMENTS[c].label), unsigned: unsigned.map((c) => DOCUMENTS[c].label), missing_codes: missing, unsigned_codes: unsigned, gaps: missing.length + unsigned.length, status: missing.length || unsigned.length ? 'incomplete' : 'complete' });
  }
  const orphans = [...byDeal.keys()].filter((k) => !seenDeals.has(k)).sort();
  items.sort(by('-gaps', '-days_since_delivery', 'deal_number'));
  const open = items.filter((i) => i.status === 'incomplete');
  const byDoc = tally(open.flatMap((i) => [...i.missing_codes.map((c) => ({ c, k: 'missing' })), ...i.unsigned_codes.map((c) => ({ c, k: 'unsigned' }))]), (x) => DOCUMENTS[x.c].label, 'document');
  const byManager = [...groupBy(open, (i) => i.fi_manager || '(none)')].map(([fi_manager, l]) => ({ fi_manager, incomplete_deals: l.length, gaps: l.reduce((s, i) => s + i.gaps, 0) })).sort(by('-gaps', 'fi_manager'));
  return { as_of: today, deals: items.length, skipped_unwound: skipped, complete: items.length - open.length, incomplete: open.length, missing_documents: open.reduce((s, i) => s + i.missing_codes.length, 0), unsigned_documents: open.reduce((s, i) => s + i.unsigned_codes.length, 0), oldest_incomplete_days: open.reduce((m, i) => Math.max(m, i.days_since_delivery ?? 0), 0), by_document: byDoc.map((x) => ({ document: x.document, deals: x.count })), by_fi_manager: byManager, documents_not_recognised: [...unknownDocs.keys()].sort().slice(0, 50), documents_without_a_deal: orphans, items: open };
}

export const line = (r) => `${r.deals} deal(s) checked: ${r.incomplete} incomplete, ${r.complete} complete. ${r.missing_documents} document(s) missing, ${r.unsigned_documents} unsigned.${r.incomplete ? ` Oldest incomplete jacket: ${r.oldest_incomplete_days} day(s) since delivery.` : ''}${r.documents_without_a_deal.length ? ` ${r.documents_without_a_deal.length} scanned deal number(s) not in the deal file.` : ''}`;
