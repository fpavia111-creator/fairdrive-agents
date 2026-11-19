// Title, registration and plate fees collected on deals against what the DMV or tag agency charged. Pure functions.
import { str, num, round2, normId, normVin, vinTail, isoDate, daysBetween, asOfDate, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  vin: t(['VIN', 'Vehicle VIN']),
  delivery_date: t(['Delivery Date', 'Delivered', 'Sold Date', 'Deal Date'], { type: 'date', required: true }),
  state: t(['State', 'Title State', 'Registration State']),
  fees_collected: t(['Fees Collected', 'DMV Fees', 'Title and Registration', 'Tag Fees', 'Government Fees'], { type: 'money', required: true }),
});
export const CHARGE_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Reference']),
  vin: t(['VIN', 'Vehicle VIN', 'Serial Number']),
  charge_date: t(['Charge Date', 'Date', 'Transaction Date', 'Posted'], { type: 'date' }),
  amount: t(['Amount', 'Fee Amount', 'Total Fees', 'Charged'], { type: 'money', required: true }),
  agency: t(['Agency', 'Tag Agency', 'Office', 'County Office']),
});

export function reconcileFees(deals, charges, { asOf, tolerance = 1, paidDays = 30 } = {}) {
  const today = asOfDate(asOf);
  const ch = [...charges].filter((c) => normId(c.deal_number) || normVin(c.vin)).sort(by('charge_date', 'deal_number', 'amount')).map((c) => ({ deal: normId(c.deal_number), tail: vinTail(c.vin), amount: num(c.amount) ?? 0, date: isoDate(c.charge_date), raw: c, used: false }));
  const seen = new Set(); const items = []; let collected = 0, paid = 0;
  for (const d of [...deals].filter((x) => normId(x.deal_number)).sort(by('delivery_date', 'deal_number'))) {
    const id = normId(d.deal_number); if (seen.has(id)) continue; seen.add(id);
    const tail = vinTail(d.vin);
    const mine = ch.filter((c) => !c.used && ((c.deal && c.deal === id) || (!c.deal && tail && c.tail === tail)));
    for (const c of mine) c.used = true;
    const col = num(d.fees_collected) ?? 0, p = round2(mine.reduce((s, c) => s + c.amount, 0)); collected += col; paid += p;
    const base = { deal_number: str(d.deal_number), customer: str(d.customer), vin: normVin(d.vin), state: str(d.state), delivery_date: isoDate(d.delivery_date), collected: col, charged: mine.length ? p : null };
    if (!mine.length) { const age = daysBetween(isoDate(d.delivery_date), today); if (age > paidDays) items.push({ ...base, finding: 'not_paid_yet', amount: col, why: `Collected ${col} ${age} days ago; no DMV or tag agency charge yet.` }); continue; }
    const diff = round2(col - p);
    if (diff > tolerance) items.push({ ...base, finding: 'overcollected', amount: diff, why: `Collected ${col}, charged ${p}: ${diff} more than the fees. It belongs to the customer unless it covers a later fee.` });
    else if (-diff > tolerance) items.push({ ...base, finding: 'undercollected', amount: -diff, why: `Charged ${p}, collected ${col}: the store paid ${-diff} of the fees.` });
  }
  for (const c of ch.filter((x) => !x.used)) items.push({ deal_number: str(c.raw.deal_number), customer: '', vin: normVin(c.raw.vin), state: '', delivery_date: null, collected: null, charged: c.amount, finding: 'charge_without_deal', amount: c.amount, why: 'A DMV or tag agency charge that matches no deal by number or VIN.' });
  items.sort(by('-amount', 'deal_number', 'vin'));
  const n = (f) => items.filter((i) => i.finding === f);
  const amt = (f) => round2(n(f).reduce((s, i) => s + i.amount, 0));
  return { as_of: today, deals: seen.size, collected: round2(collected), charged: round2(paid), overcollected: n('overcollected').length, overcollected_amount: amt('overcollected'), undercollected: n('undercollected').length, undercollected_amount: amt('undercollected'), not_paid_yet: n('not_paid_yet').length, not_paid_amount: amt('not_paid_yet'), charges_without_deal: n('charge_without_deal').length, charges_without_deal_amount: amt('charge_without_deal'), items };
}

export const line = (r) => `${r.deals} deal(s): fees collected ${r.collected}, charged ${r.charged}. ${r.overcollected} over-collected (${r.overcollected_amount}), ${r.undercollected} under-collected (${r.undercollected_amount}), ${r.not_paid_yet} not paid yet (${r.not_paid_amount}), ${r.charges_without_deal} charge(s) with no deal (${r.charges_without_deal_amount}).`;
