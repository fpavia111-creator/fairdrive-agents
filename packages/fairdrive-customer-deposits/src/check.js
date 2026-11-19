// Customer deposits matched with deals. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEPOSIT_FIELDS = Object.freeze({
  receipt_number: t(['Receipt Number', 'Receipt', 'Receipt #', 'Control Number'], { required: true }),
  date: t(['Date', 'Receipt Date', 'Deposit Date'], { type: 'date', required: true }),
  customer: t(['Customer', 'Customer Name', 'Received From', 'Name'], { pii: 'name' }),
  amount: t(['Amount', 'Deposit Amount', 'Deposit'], { type: 'money', required: true }),
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Applied To']),
  status: t(['Status', 'Deposit Status']),
  refunded_date: t(['Refunded', 'Refund Date', 'Refunded Date'], { type: 'date' }),
});
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  status: t(['Deal Status', 'Status'], { required: true }),
  delivery_date: t(['Delivery Date', 'Delivered', 'Sold Date'], { type: 'date' }),
});
const DEAD = /dead|lost|unwound|unwind|cancel|void/i, DONE = /deliver|booked|sold|funded|closed/i;

export function matchDeposits(deposits, deals, { asOf, heldDays = 14, refundDays = 10 } = {}) {
  const today = asOfDate(asOf);
  const dealOf = new Map(deals.filter((d) => normId(d.deal_number)).map((d) => [normId(d.deal_number), d]));
  const seen = new Set(); const held = []; const items = [];
  for (const p of [...deposits].filter((x) => normId(x.receipt_number)).sort(by('date', 'receipt_number'))) {
    const id = normId(p.receipt_number); if (seen.has(id)) continue; seen.add(id);
    if (isoDate(p.refunded_date) || /refund/i.test(str(p.status))) continue;
    if (/applied/i.test(str(p.status))) continue;
    const amt = num(p.amount) ?? 0; const age = daysBetween(isoDate(p.date), today);
    held.push(amt);
    const deal = normId(p.deal_number) ? dealOf.get(normId(p.deal_number)) : null;
    const base = { receipt_number: str(p.receipt_number), date: isoDate(p.date), age_days: age, customer: str(p.customer), amount: amt, deal_number: str(p.deal_number), deal_status: deal ? str(deal.status) : '' };
    if (!normId(p.deal_number)) { if (age > heldDays) items.push({ ...base, finding: 'held_no_deal', why: `Held ${age} days with no deal.` }); continue; }
    if (!deal) { items.push({ ...base, finding: 'applied_to_missing_deal', why: `Points to deal ${str(p.deal_number)}, which is not in the deal file.` }); continue; }
    if (DEAD.test(str(deal.status))) { items.push({ ...base, finding: age > refundDays ? 'refund_overdue' : 'refund_due', why: `The deal is ${str(deal.status).toLowerCase()}; the deposit is still held ${age} days after it was taken.` }); continue; }
    if (DONE.test(str(deal.status))) items.push({ ...base, finding: 'not_applied', why: `The deal was delivered${isoDate(deal.delivery_date) ? ` on ${isoDate(deal.delivery_date)}` : ''} and the deposit was never applied to it.` });
  }
  items.sort(by('-amount', 'receipt_number'));
  const n = (f) => items.filter((i) => i.finding === f);
  const amt = (f) => round2(n(f).reduce((s, i) => s + i.amount, 0));
  return { as_of: today, deposits: seen.size, held: held.length, held_amount: round2(held.reduce((s, x) => s + x, 0)), not_applied: n('not_applied').length, not_applied_amount: amt('not_applied'), held_no_deal: n('held_no_deal').length, refund_due: n('refund_due').length, refund_overdue: n('refund_overdue').length, refund_amount: round2(amt('refund_due') + amt('refund_overdue')), applied_to_missing_deal: n('applied_to_missing_deal').length, items };
}

export const line = (r) => `${r.deposits} deposit(s), ${r.held} still held (${r.held_amount}). ${r.not_applied} not applied to a delivered deal (${r.not_applied_amount}); ${r.refund_overdue} refund(s) overdue and ${r.refund_due} due on dead deals (${r.refund_amount}); ${r.held_no_deal} held with no deal; ${r.applied_to_missing_deal} pointing to a deal not in the file.`;
