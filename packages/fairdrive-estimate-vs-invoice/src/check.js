// Collision repairs: the latest estimate (with supplements) against the final invoice. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
const money = (aliases) => t(aliases, { type: 'money' });
export const ESTIMATE_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'Repair Order', 'Work Order'], { required: true }),
  claim_number: t(['Claim Number', 'Claim #', 'Claim']),
  insurer: t(['Insurer', 'Insurance Company', 'Carrier', 'Payer']),
  version: t(['Version', 'Estimate Version', 'Supplement', 'Sup']),
  estimate_date: t(['Estimate Date', 'Date', 'Written Date'], { type: 'date' }),
  labor: money(['Labor', 'Labor Total', 'Body Labor']),
  parts: money(['Parts', 'Parts Total']),
  materials: money(['Materials', 'Paint Materials', 'Paint and Materials']),
  sublet: money(['Sublet', 'Sublet Total']),
  total: t(['Total', 'Estimate Total', 'Gross Total', 'Grand Total'], { type: 'money', required: true }),
});
export const INVOICE_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'Repair Order', 'Work Order'], { required: true }),
  invoice_date: t(['Invoice Date', 'Date', 'Closed Date'], { type: 'date' }),
  customer: t(['Customer', 'Customer Name', 'Owner'], { pii: 'name' }),
  labor: money(['Labor', 'Labor Total']),
  parts: money(['Parts', 'Parts Total']),
  materials: money(['Materials', 'Paint Materials']),
  sublet: money(['Sublet', 'Sublet Total']),
  total: t(['Total', 'Invoice Total', 'Grand Total'], { type: 'money', required: true }),
});
const CATS = ['labor', 'parts', 'materials', 'sublet'];
/** Estimate versions in order: E01 before S01 before S02; anything else after, by text. */
export const versionRank = (v) => { const m = /^([ES])\D*(\d+)$/i.exec(str(v).replace(/\s+/g, '')); return m ? (m[1].toUpperCase() === 'E' ? 0 : 1000) + Number(m[2]) : str(v) ? 5000 : 0; };

export function compareEstimates(estimates, invoices, { asOf, tolerance = 10, invoiceDays = 30 } = {}) {
  const today = asOfDate(asOf);
  const est = groupBy(estimates.filter((e) => normId(e.ro_number)), (e) => normId(e.ro_number));
  const inv = groupBy(invoices.filter((i) => normId(i.ro_number)), (i) => normId(i.ro_number));
  const items = []; let estimated = 0, invoiced = 0;
  for (const k of [...new Set([...est.keys(), ...inv.keys()])].sort()) {
    const versions = (est.get(k) || []).slice().sort((a, b) => versionRank(a.version) - versionRank(b.version) || ((isoDate(a.estimate_date) || '') < (isoDate(b.estimate_date) || '') ? -1 : 1) || (num(a.total) || 0) - (num(b.total) || 0));
    const last = versions.at(-1); const invs = inv.get(k) || [];
    const i = invs.length ? { total: round2(invs.reduce((s, x) => s + (num(x.total) || 0), 0)), ...Object.fromEntries(CATS.map((c) => [c, round2(invs.reduce((s, x) => s + (num(x[c]) || 0), 0))])), date: invs.map((x) => isoDate(x.invoice_date)).filter(Boolean).sort().pop() || null, customer: str(invs[0].customer) } : null;
    const e = last ? { total: num(last.total) ?? 0, ...Object.fromEntries(CATS.map((c) => [c, num(last[c]) ?? 0])) } : null;
    if (e) estimated += e.total; if (i) invoiced += i.total;
    const base = { ro_number: str((last || invs[0]).ro_number), claim_number: last ? str(last.claim_number) : '', insurer: last ? str(last.insurer) : '', customer: i ? i.customer : '', latest_version: last ? str(last.version) : '', versions: versions.length, estimate_total: e ? e.total : null, invoice_total: i ? i.total : null };
    if (e && i) {
      const diff = round2(i.total - e.total);
      const byCat = CATS.filter((c) => Math.abs(round2(i[c] - e[c])) > tolerance).map((c) => `${c} ${round2(i[c] - e[c]) > 0 ? '+' : ''}${round2(i[c] - e[c])}`);
      if (diff > tolerance) items.push({ ...base, finding: 'invoiced_over_estimate', difference: diff, amount: diff, categories: byCat, why: `Invoiced ${i.total} against ${e.total} on ${base.latest_version || 'the estimate'}. The insurer pays the estimate; write a supplement or the customer owes the rest.` });
      else if (-diff > tolerance) items.push({ ...base, finding: 'invoiced_under_estimate', difference: diff, amount: -diff, categories: byCat, why: `Invoiced ${i.total} against ${e.total} approved. Check for items approved but not billed.` });
    } else if (i && !e) items.push({ ...base, finding: 'no_estimate', difference: null, amount: i.total, categories: [], why: 'Invoice with no estimate on file for this RO.' });
    else if (e && !i) { const d = daysBetween(isoDate(last.estimate_date), today); if (d === null || d > invoiceDays) items.push({ ...base, finding: 'not_invoiced', difference: null, amount: e.total, categories: [], why: `Estimate written ${d ?? '?'} days ago and no invoice.` }); }
  }
  items.sort(by('-amount', 'ro_number'));
  const n = (f) => items.filter((x) => x.finding === f);
  const amt = (f) => round2(n(f).reduce((s, x) => s + x.amount, 0));
  return { as_of: today, repairs: new Set([...est.keys(), ...inv.keys()]).size, estimated: round2(estimated), invoiced: round2(invoiced), over_estimate: n('invoiced_over_estimate').length, over_amount: amt('invoiced_over_estimate'), under_estimate: n('invoiced_under_estimate').length, under_amount: amt('invoiced_under_estimate'), no_estimate: n('no_estimate').length, not_invoiced: n('not_invoiced').length, not_invoiced_amount: amt('not_invoiced'), items };
}

export const line = (r) => `${r.repairs} repair(s): estimated ${r.estimated}, invoiced ${r.invoiced}. ${r.over_estimate} invoiced over the latest estimate (${r.over_amount}), ${r.under_estimate} under (${r.under_amount}), ${r.no_estimate} invoice(s) with no estimate, ${r.not_invoiced} estimate(s) not invoiced (${r.not_invoiced_amount}).`;
