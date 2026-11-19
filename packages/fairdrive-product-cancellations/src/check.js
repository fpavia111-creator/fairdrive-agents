// Fairdrive Product Cancellations: F&I product cancellations and dealer chargebacks. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, partyGrouper, by, groupBy } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const CANCEL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer', 'Contract Holder'], { pii: 'name' }),
  product: t(['Product', 'Product Type', 'Product Name', 'Coverage'], { required: true }),
  provider: t(['Provider', 'Administrator', 'Product Provider', 'Company']),
  contract_number: t(['Contract Number', 'Contract #', 'Policy Number', 'Certificate']),
  sale_date: t(['Sale Date', 'Contract Date', 'Deal Date', 'Effective Date'], { type: 'date', required: true }),
  cancel_date: t(['Cancel Date', 'Cancellation Date', 'Cancelled', 'Cancel Effective'], { type: 'date', required: true }),
  term_months: t(['Term Months', 'Term', 'Term (Months)', 'Months'], { type: 'number' }),
  product_price: t(['Product Price', 'Price', 'Customer Price', 'Sale Price', 'Retail'], { type: 'money' }),
  product_cost: t(['Product Cost', 'Cost', 'Dealer Cost', 'Remit'], { type: 'money' }),
  chargeback: t(['Chargeback', 'Chargeback Amount', 'Dealer Chargeback', 'Charged Back', 'Commission Chargeback'], { type: 'money' }),
  refund_amount: t(['Refund', 'Refund Amount', 'Customer Refund'], { type: 'money' }),
  refund_sent: t(['Refund Sent', 'Refund Date', 'Refund Issued', 'Refund Paid'], { type: 'date' }),
  reason: t(['Reason', 'Cancel Reason', 'Cancellation Reason']),
});

/**
 * What the dealer should give back on one cancellation: the product's profit (price less
 * cost) times the unused share of its term, pro rata by days. Cancelled inside the full
 * chargeback window (default 90 days) gives back the whole profit.
 */
export function expectedChargeback(row, { fullDays = 90 } = {}) {
  const price = num(row.product_price), cost = num(row.product_cost);
  if (price === null || cost === null) return { profit: null, used_days: null, unused_share: null, expected: null };
  const profit = round2(price - cost);
  const used = daysBetween(isoDate(row.sale_date), isoDate(row.cancel_date));
  const months = num(row.term_months);
  if (used === null) return { profit, used_days: null, unused_share: null, expected: null };
  let share;
  if (used <= fullDays) share = 1;
  else if (!months) share = null;
  else share = Math.max(0, Math.min(1, 1 - used / ((months * 365.25) / 12)));
  return { profit, used_days: used, unused_share: share === null ? null : round2(share * 100) / 100, expected: share === null ? null : round2(profit * share) };
}

/** Check every cancellation's chargeback and refund. */
export function checkCancellations(rows, { asOf, fullDays = 90, tolerance = 5, refundDays = 30 } = {}) {
  const today = asOfDate(asOf);
  const group = partyGrouper(rows.map((r) => r.provider));
  const names = new Map(); for (const n of rows.map((r) => str(r.provider)).filter(Boolean).sort()) if (!names.has(group(n))) names.set(group(n), n);
  const items = []; const seen = new Set();
  const sorted = [...rows].filter((r) => normId(r.deal_number) && str(r.product)).sort(by('cancel_date', 'deal_number', 'product', 'contract_number'));
  for (const r of sorted) {
    const key = `${normId(r.deal_number)}|${str(r.product).toLowerCase()}|${normId(r.contract_number)}`; if (seen.has(key)) continue; seen.add(key);
    const e = expectedChargeback(r, { fullDays });
    const charged = num(r.chargeback);
    const findings = []; const why = [];
    let difference = null;
    if (charged !== null && e.expected !== null) {
      difference = round2(charged - e.expected);
      if (difference > tolerance) { findings.push('chargeback_above_expected'); why.push(`Charged back ${charged}; profit ${e.profit} x ${e.unused_share} unused gives ${e.expected} (${difference} more).`); }
      else if (difference < -tolerance) { findings.push('chargeback_below_expected'); why.push(`Charged back ${charged}, below the ${e.expected} expected; a second chargeback may follow.`); }
    }
    if (charged !== null && e.profit !== null && charged > e.profit + tolerance) { findings.push('chargeback_above_profit'); why.push(`The chargeback (${charged}) is more than the profit earned on the product (${e.profit}).`); }
    if (e.expected === null) { findings.push('cannot_compute'); why.push('Price, cost, term or dates are missing, so the expected chargeback cannot be worked out.'); }
    const cancelled = isoDate(r.cancel_date); const sent = isoDate(r.refund_sent);
    const waiting = cancelled && !sent ? daysBetween(cancelled, today) : null;
    if (waiting !== null && waiting > refundDays && (num(r.refund_amount) ?? 1) > 0) { findings.push('refund_not_sent'); why.push(`Cancelled ${waiting} days ago and no refund date is recorded.`); }
    if (!findings.length) continue;
    items.push({ deal_number: str(r.deal_number), customer: str(r.customer), product: str(r.product), provider: names.get(group(r.provider)) || str(r.provider), contract_number: str(r.contract_number), sale_date: isoDate(r.sale_date), cancel_date: cancelled, reason: str(r.reason), profit: e.profit, used_days: e.used_days, unused_share: e.unused_share, expected_chargeback: e.expected, charged_back: charged, difference, refund_waiting_days: waiting, findings, why: why.join(' ') });
  }
  items.sort(by('-difference', 'deal_number', 'product'));
  const over = items.filter((i) => i.findings.includes('chargeback_above_expected'));
  const byProvider = [...groupBy(items, (i) => i.provider || '(none)')].map(([provider, l]) => ({ provider, items: l.length, overcharged: round2(l.filter((i) => i.findings.includes('chargeback_above_expected')).reduce((s, i) => s + i.difference, 0)) })).sort(by('-overcharged', 'provider'));
  const all = sorted.filter((r, i, a) => a.findIndex((x) => `${normId(x.deal_number)}|${str(x.product).toLowerCase()}|${normId(x.contract_number)}` === `${normId(r.deal_number)}|${str(r.product).toLowerCase()}|${normId(r.contract_number)}`) === i);
  return { as_of: today, cancellations: all.length, charged_back: round2(all.reduce((s, r) => s + (num(r.chargeback) || 0), 0)), overcharged: round2(over.reduce((s, i) => s + i.difference, 0)), over_expected: over.length, above_profit: items.filter((i) => i.findings.includes('chargeback_above_profit')).length, refunds_not_sent: items.filter((i) => i.findings.includes('refund_not_sent')).length, cannot_compute: items.filter((i) => i.findings.includes('cannot_compute')).length, full_chargeback_days: fullDays, by_provider: byProvider, items };
}

export const line = (r) => `${r.cancellations} cancellation(s), ${r.charged_back} charged back. ${r.over_expected} chargeback(s) above the pro-rata figure by ${r.overcharged} in total; ${r.above_profit} above the profit earned; ${r.refunds_not_sent} refund(s) not sent.${r.cannot_compute ? ` ${r.cannot_compute} could not be computed (missing price, cost, term or dates).` : ''}`;

/** Dispute to one provider: chargebacks above the pro-rata figure, with the arithmetic. */
export function disputeText(items, { provider, from, contact }) {
  const list = items.filter((i) => i.findings.includes('chargeback_above_expected'));
  const total = round2(list.reduce((s, i) => s + i.difference, 0));
  return { total, text: [
    `# Chargeback review request: ${provider}`, '',
    `**To:** ${contact || `[TO CONFIRM ${provider} dealer services contact]`}`, `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    `We recomputed the dealer chargeback on ${list.length} cancelled contract(s) as the product profit times the unused share of the term. The chargebacks below are ${total} more than that in total. Please review them or send the calculation you used.`, '',
    '| Deal | Contract | Product | Sold | Cancelled | Days used | Profit | Unused share | Expected | Charged | Difference |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.deal_number} | ${i.contract_number} | ${i.product} | ${i.sale_date} | ${i.cancel_date} | ${i.used_days} | ${i.profit} | ${i.unused_share} | ${i.expected_chargeback} | ${i.charged_back} | ${i.difference} |`), '',
    '[CHECK the cancellation method in your agreement with the provider (pro rata, rule of 78s, cancel fee) before sending]',
  ].join('\n') };
}
