// Sales tax on each deal recomputed from the county rate table you supply. Pure functions.
import { str, num, round2, normId, isoDate, yes, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  delivery_date: t(['Delivery Date', 'Deal Date', 'Sold Date'], { type: 'date' }),
  state: t(['State', 'Tax State']),
  county: t(['County', 'Tax County', 'Taxing Jurisdiction', 'Jurisdiction'], { required: true }),
  sale_price: t(['Sale Price', 'Selling Price', 'Cash Price', 'Price'], { type: 'money', required: true }),
  trade_allowance: t(['Trade Allowance', 'Trade', 'Trade-In Allowance', 'Trade Value'], { type: 'money' }),
  doc_fee: t(['Doc Fee', 'Documentary Fee', 'Dealer Fee', 'Doc Fees'], { type: 'money' }),
  tax_charged: t(['Tax Charged', 'Sales Tax', 'Tax', 'Tax Amount'], { type: 'money', required: true }),
});
export const RATE_FIELDS = Object.freeze({
  state: t(['State']),
  county: t(['County', 'Jurisdiction', 'Taxing Jurisdiction'], { required: true }),
  rate_pct: t(['Rate', 'Rate %', 'Tax Rate', 'Combined Rate'], { type: 'number', required: true }),
  trade_credit: t(['Trade Credit', 'Trade Reduces Tax', 'Trade-In Credit'], { type: 'bool' }),
  doc_fee_taxable: t(['Doc Fee Taxable', 'Fees Taxable'], { type: 'bool' }),
  max_tax: t(['Max Tax', 'Tax Cap', 'Cap'], { type: 'money' }),
});
const key = (state, county) => `${normId(state)}|${normId(county)}`;

/** Expected tax for one deal under one rate row. */
export function expectedTax(d, rate) {
  const doc = yes(rate.doc_fee_taxable) === true ? (num(d.doc_fee) || 0) : 0;
  const trade = yes(rate.trade_credit) === false ? 0 : (num(d.trade_allowance) || 0);
  const taxable = round2(Math.max(0, (num(d.sale_price) || 0) + doc - trade));
  let tax = round2((taxable * (num(rate.rate_pct) || 0)) / 100);
  const cap = num(rate.max_tax); if (cap !== null && cap > 0 && tax > cap) tax = cap;
  return { taxable, tax };
}

export function checkSalesTax(deals, rates, { tolerance = 1 } = {}) {
  const table = new Map(); const byCounty = new Map();
  for (const r of rates) { if (!normId(r.county)) continue; table.set(key(r.state, r.county), r); if (!byCounty.has(normId(r.county))) byCounty.set(normId(r.county), []); byCounty.get(normId(r.county)).push(r); }
  const find = (d) => table.get(key(d.state, d.county)) || ((byCounty.get(normId(d.county)) || []).length === 1 ? byCounty.get(normId(d.county))[0] : null);
  const seen = new Set(); const all = [];
  for (const d of [...deals].filter((x) => normId(x.deal_number)).sort(by('deal_number'))) {
    const id = normId(d.deal_number); if (seen.has(id)) continue; seen.add(id);
    const rate = find(d); const charged = num(d.tax_charged) ?? 0;
    const base = { deal_number: str(d.deal_number), customer: str(d.customer), delivery_date: isoDate(d.delivery_date), state: str(d.state), county: str(d.county), sale_price: num(d.sale_price), trade_allowance: num(d.trade_allowance), tax_charged: charged };
    if (!rate) { all.push({ ...base, rate_pct: null, taxable: null, expected_tax: null, difference: null, finding: 'no_rate', amount: null, why: `No rate for ${str(d.county)}${str(d.state) ? `, ${str(d.state)}` : ''} in the rate table.` }); continue; }
    const e = expectedTax(d, rate); const diff = round2(charged - e.tax);
    const finding = diff > tolerance ? 'overcharged' : -diff > tolerance ? 'undercharged' : null;
    all.push({ ...base, rate_pct: num(rate.rate_pct), taxable: e.taxable, expected_tax: e.tax, difference: diff, finding, amount: finding ? Math.abs(diff) : null, why: finding ? `Charged ${charged}; ${num(rate.rate_pct)}% of ${e.taxable} taxable${num(rate.max_tax) ? ` (cap ${num(rate.max_tax)})` : ''} is ${e.tax}.` : '' });
  }
  const items = all.filter((r) => r.finding).sort(by('-amount', 'deal_number'));
  const counties = [...groupBy(all, (r) => r.county || '(none)')].map(([county, l]) => ({ county, deals: l.length, charged: round2(l.reduce((s, r) => s + r.tax_charged, 0)), expected: round2(l.reduce((s, r) => s + (r.expected_tax || 0), 0)) })).sort(by('county'));
  const n = (f) => items.filter((i) => i.finding === f);
  return { deals: all.length, tax_charged: round2(all.reduce((s, r) => s + r.tax_charged, 0)), tax_expected: round2(all.reduce((s, r) => s + (r.expected_tax || 0), 0)), overcharged: n('overcharged').length, overcharged_amount: round2(n('overcharged').reduce((s, i) => s + i.amount, 0)), undercharged: n('undercharged').length, undercharged_amount: round2(n('undercharged').reduce((s, i) => s + i.amount, 0)), no_rate: n('no_rate').length, by_county: counties, items };
}

export const line = (r) => `${r.deals} deal(s): tax charged ${r.tax_charged}, ${r.tax_expected} by your rate table. ${r.overcharged} over (${r.overcharged_amount}), ${r.undercharged} under (${r.undercharged_amount}), ${r.no_rate} in a county with no rate.`;
