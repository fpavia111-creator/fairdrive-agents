// Trade-in lien payoffs: not sent, sent late or short, not cleared, no lien release. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const TRADE_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  trade_vin: t(['Trade VIN', 'Trade 1 VIN', 'VIN']),
  lienholder: t(['Lienholder', 'Lien Holder', 'Payoff To', 'Trade Lender'], { required: true }),
  deal_date: t(['Deal Date', 'Delivery Date', 'Sold Date', 'Contract Date'], { type: 'date', required: true }),
  payoff_quote: t(['Payoff Quote', 'Payoff Amount', 'Quoted Payoff', 'Payoff'], { type: 'money' }),
  quote_good_through: t(['Good Through', 'Quote Good Through', 'Payoff Good Through', 'Quote Expires'], { type: 'date' }),
  per_diem: t(['Per Diem', 'Per-Diem', 'Daily Interest'], { type: 'money' }),
  payoff_sent: t(['Payoff Sent', 'Check Date', 'Payoff Date', 'Paid Date'], { type: 'date' }),
  payoff_amount_sent: t(['Amount Sent', 'Payoff Paid', 'Check Amount', 'Paid Amount'], { type: 'money' }),
  payoff_cleared: t(['Cleared', 'Payoff Cleared', 'Cleared Date'], { type: 'date' }),
  lien_release_received: t(['Lien Release', 'Lien Release Received', 'Title Received', 'Release Date'], { type: 'date' }),
});

/** Amount the lienholder wants on a date: the quote plus per diem for each day past good-through. */
export const payoffOn = (row, date) => { const q = num(row.payoff_quote); if (q === null) return null; const late = isoDate(row.quote_good_through) ? Math.max(0, daysBetween(isoDate(row.quote_good_through), date) ?? 0) : 0; return round2(q + (num(row.per_diem) || 0) * late); };

export function checkPayoffs(trades, { asOf, payoffDays = 7, clearDays = 10, releaseDays = 30, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const seen = new Set(); const items = [];
  for (const r of [...trades].filter((x) => normId(x.deal_number) && isoDate(x.deal_date)).sort(by('deal_date', 'deal_number'))) {
    const id = normId(r.deal_number); if (seen.has(id)) continue; seen.add(id);
    const days = daysBetween(isoDate(r.deal_date), today);
    const sent = isoDate(r.payoff_sent), cleared = isoDate(r.payoff_cleared), release = isoDate(r.lien_release_received);
    const findings = []; const why = []; let amount = null; let short = null;
    if (!sent) {
      if (days > payoffDays) { amount = payoffOn(r, today); findings.push('payoff_not_sent'); why.push(`Deal ${days} days old and no payoff sent; about ${amount ?? '(no quote)'} owed today with per diem.`); }
    } else {
      const due = payoffOn(r, sent); const paid = num(r.payoff_amount_sent);
      const good = isoDate(r.quote_good_through);
      if (good && sent > good) { findings.push('sent_after_quote_expired'); why.push(`Sent ${daysBetween(good, sent)} day(s) after the quote expired on ${good}.`); }
      if (due !== null && paid !== null && due - paid > tolerance) { short = round2(due - paid); findings.push('short_paid'); why.push(`Sent ${paid}; ${due} was owed on ${sent}. The lienholder will hold the title until ${short} more arrives.`); }
      if (!cleared && daysBetween(sent, today) > clearDays) { findings.push('not_cleared'); why.push(`Sent ${daysBetween(sent, today)} days ago and not cleared.`); }
      if (cleared && !release && daysBetween(cleared, today) > releaseDays) { findings.push('lien_release_missing'); why.push(`Cleared ${daysBetween(cleared, today)} days ago and no lien release or title received.`); }
    }
    if (findings.length) items.push({ deal_number: str(r.deal_number), customer: str(r.customer), trade_vin: str(r.trade_vin), lienholder: str(r.lienholder), deal_date: isoDate(r.deal_date), days_since_deal: days, payoff_quote: num(r.payoff_quote), quote_good_through: isoDate(r.quote_good_through), payoff_sent: sent, amount_sent: num(r.payoff_amount_sent), owed_now: amount, short, findings, why: why.join(' ') });
  }
  items.sort(by('-days_since_deal', 'deal_number'));
  const has = (f) => items.filter((i) => i.findings.includes(f));
  return { as_of: today, trades: seen.size, not_sent: has('payoff_not_sent').length, not_sent_amount: round2(has('payoff_not_sent').reduce((s, i) => s + (i.owed_now || 0), 0)), sent_after_quote_expired: has('sent_after_quote_expired').length, short_paid: has('short_paid').length, short_amount: round2(has('short_paid').reduce((s, i) => s + i.short, 0)), not_cleared: has('not_cleared').length, lien_release_missing: has('lien_release_missing').length, items };
}

export const line = (r) => `${r.trades} trade payoff(s): ${r.not_sent} not sent (about ${r.not_sent_amount} owed today), ${r.short_paid} paid short by ${r.short_amount}, ${r.sent_after_quote_expired} sent after the quote expired, ${r.not_cleared} not cleared, ${r.lien_release_missing} without a lien release.`;

/** Payoff batch for the person who sends the money. */
export function batchText(items, { from }) {
  const list = items.filter((i) => i.findings.includes('payoff_not_sent'));
  const total = round2(list.reduce((s, i) => s + (i.owed_now || 0), 0));
  return { total, count: list.length, text: ['# Trade payoffs to approve', '', `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    `${list.length} trade-in payoff(s) are not sent yet, about ${total} in total with per diem to today.`, '',
    '| Deal | Lienholder | Trade VIN | Quote | Good through | Owed today |', '| --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.deal_number} | ${i.lienholder} | ${i.trade_vin} | ${i.payoff_quote ?? ''} | ${i.quote_good_through || ''} | ${i.owed_now ?? '[MISSING quote]'} |`), '',
    '[CHECK each amount with a fresh payoff quote from the lienholder before paying]'].join('\n') };
}
