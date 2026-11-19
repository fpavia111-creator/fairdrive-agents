// Finance reserve (dealer participation) and F&I product income against what was paid. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, partyGrouper, by, groupBy } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Deal ID'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  lender: t(['Lender', 'Finance Source', 'Bank', 'Lienholder'], { required: true }),
  contract_date: t(['Contract Date', 'Deal Date', 'Sold Date'], { type: 'date' }),
  amount_financed: t(['Amount Financed', 'Amt Financed', 'Financed Amount'], { type: 'money', required: true }),
  buy_rate: t(['Buy Rate', 'Buy APR', 'Lender Rate'], { type: 'number' }),
  contract_rate: t(['Contract Rate', 'Sell Rate', 'APR', 'Customer Rate'], { type: 'number' }),
  term_months: t(['Term', 'Term Months', 'Months'], { type: 'number' }),
  flat_fee: t(['Flat Fee', 'Flat Reserve', 'Flat'], { type: 'money' }),
  product_income_expected: t(['Product Income', 'Product Commission', 'Back End Products', 'Products Gross'], { type: 'money' }),
});
export const PAYMENT_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Dealer Ref', 'Deal #'], { required: true }),
  lender: t(['Lender', 'Payer', 'Paid By', 'Source']),
  kind: t(['Kind', 'Type', 'Payment Type', 'Description']),
  amount: t(['Amount', 'Amount Paid', 'Paid'], { type: 'money', required: true }),
  paid_date: t(['Paid Date', 'Date', 'Payment Date'], { type: 'date' }),
});

/** Finance charge on a simple-interest installment contract: payment x months - amount financed. */
export function financeCharge(amount, ratePct, months) {
  const a = Number(amount), n = Number(months), r = Number(ratePct) / 1200;
  if (!(a > 0) || !(n > 0) || !Number.isFinite(r) || r < 0) return null;
  const pay = r === 0 ? a / n : (a * r) / (1 - (1 + r) ** -n);
  return round2(pay * n - a);
}

/** Reserve a deal should earn: the lender's share of the finance charge between buy rate and contract rate, or a flat fee. */
export function expectedReserve(d, { sharePct = 75, cap = null } = {}) {
  const flat = num(d.flat_fee);
  if (flat !== null && flat > 0) return { method: 'flat', expected: flat };
  const a = num(d.amount_financed), buy = num(d.buy_rate), sell = num(d.contract_rate), n = num(d.term_months);
  if (a === null || buy === null || sell === null || n === null) return { method: 'cannot_compute', expected: null };
  if (sell <= buy) return { method: 'no_markup', expected: 0 };
  const diff = financeCharge(a, sell, n) - financeCharge(a, buy, n);
  let e = round2((diff * sharePct) / 100);
  if (cap !== null && e > cap) e = cap;
  return { method: 'rate_markup', expected: e };
}

const RESERVE = /reserve|participation|flat|dealer part|finance income/i;

/** Compare the reserve and product income each deal should earn with what was paid. */
export function checkReserve(deals, payments, { asOf, sharePct = 75, cap = null, tolerance = 5, graceDays = 30 } = {}) {
  const today = asOfDate(asOf);
  const group = partyGrouper(deals.map((d) => d.lender));
  const names = new Map(); for (const n of deals.map((d) => str(d.lender)).filter(Boolean).sort()) if (!names.has(group(n))) names.set(group(n), n);
  const paid = groupBy(payments.filter((p) => normId(p.deal_number)), (p) => normId(p.deal_number));
  const seen = new Set(); const items = []; let expectedTotal = 0, receivedTotal = 0;
  for (const d of [...deals].sort(by('contract_date', 'deal_number'))) {
    const id = normId(d.deal_number); if (!id || seen.has(id)) continue; seen.add(id);
    const e = expectedReserve(d, { sharePct, cap });
    const lines = paid.get(id) || [];
    const reserveIn = round2(lines.filter((p) => RESERVE.test(str(p.kind)) || !str(p.kind)).reduce((s, p) => s + (num(p.amount) || 0), 0));
    const productIn = round2(lines.filter((p) => str(p.kind) && !RESERVE.test(str(p.kind))).reduce((s, p) => s + (num(p.amount) || 0), 0));
    const productExp = num(d.product_income_expected);
    const age = daysBetween(isoDate(d.contract_date), today);
    const late = age === null || age > graceDays;
    const findings = []; const why = [];
    if (e.expected !== null) expectedTotal += e.expected;
    receivedTotal += reserveIn;
    if (e.method === 'cannot_compute') { findings.push('cannot_compute'); why.push('Buy rate, contract rate, term or amount financed is missing.'); }
    else if (e.expected > tolerance && reserveIn === 0 && late) { findings.push('reserve_missing'); why.push(`No reserve received ${age} days after contract; ${e.expected} expected (${e.method === 'flat' ? 'flat fee' : `${sharePct}% of the rate markup`}).`); }
    else if (reserveIn > 0 && e.expected - reserveIn > tolerance) { findings.push('reserve_short'); why.push(`Received ${reserveIn} against ${e.expected} expected.`); }
    else if (reserveIn - e.expected > tolerance) { findings.push('reserve_over'); why.push(`Received ${reserveIn} against ${e.expected} expected; a later chargeback may follow.`); }
    if (productExp !== null && productExp > tolerance && late) {
      if (productIn === 0) { findings.push('product_income_missing'); why.push(`No product income received; ${productExp} expected.`); }
      else if (productExp - productIn > tolerance) { findings.push('product_income_short'); why.push(`Product income ${productIn} against ${productExp} expected.`); }
    }
    if (!findings.length) continue;
    items.push({ deal_number: str(d.deal_number), customer: str(d.customer), lender: names.get(group(d.lender)) || str(d.lender), contract_date: isoDate(d.contract_date), days: age, buy_rate: num(d.buy_rate), contract_rate: num(d.contract_rate), method: e.method, expected_reserve: e.expected, reserve_received: reserveIn, reserve_difference: e.expected === null ? null : round2(reserveIn - e.expected), product_expected: productExp, product_received: productIn, findings, why: why.join(' ') });
  }
  const orphans = [...paid.keys()].filter((k) => !seen.has(k)).sort().map((k) => ({ deal_number: str(paid.get(k)[0].deal_number), amount: round2(paid.get(k).reduce((s, p) => s + (num(p.amount) || 0), 0)) }));
  items.sort(by('reserve_difference', 'deal_number'));
  const short = items.filter((i) => i.findings.some((f) => f === 'reserve_missing' || f === 'reserve_short'));
  const byLender = [...groupBy(short, (i) => i.lender)].map(([lender, l]) => ({ lender, deals: l.length, short: round2(l.reduce((s, i) => s + (i.expected_reserve - i.reserve_received), 0)) })).sort(by('-short', 'lender'));
  return { as_of: today, deals: seen.size, share_pct: sharePct, reserve_expected: round2(expectedTotal), reserve_received: round2(receivedTotal), reserve_short: round2(short.reduce((s, i) => s + (i.expected_reserve - i.reserve_received), 0)), missing: items.filter((i) => i.findings.includes('reserve_missing')).length, short_paid: items.filter((i) => i.findings.includes('reserve_short')).length, over_paid: items.filter((i) => i.findings.includes('reserve_over')).length, product_short: round2(items.reduce((s, i) => s + (i.findings.some((f) => /^product/.test(f)) ? i.product_expected - i.product_received : 0), 0)), cannot_compute: items.filter((i) => i.findings.includes('cannot_compute')).length, payments_without_a_deal: orphans, by_lender: byLender, items };
}

export const line = (r) => `${r.deals} deal(s): reserve expected ${r.reserve_expected}, received ${r.reserve_received}. ${r.missing} with no reserve, ${r.short_paid} paid short, ${r.over_paid} paid over; ${r.reserve_short} short in total. Product income short ${r.product_short}.${r.cannot_compute ? ` ${r.cannot_compute} deal(s) lack the rates or term to compute.` : ''}`;

/** Reserve inquiry to one lender. */
export function inquiryText(items, { lender, from, contact, sharePct }) {
  const list = items.filter((i) => i.findings.includes('reserve_missing') || i.findings.includes('reserve_short'));
  const total = round2(list.reduce((s, i) => s + (i.expected_reserve - i.reserve_received), 0));
  return { total, text: [`# Reserve inquiry: ${lender}`, '', `**To:** ${contact || `[TO CONFIRM ${lender} dealer support contact]`}`, `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    `On the contracts below we received less dealer reserve than we expected (${total} in total). Please send the reserve detail for each, or pay the difference.`, '',
    '| Deal | Contract date | Buy rate | Contract rate | Expected | Received |', '| --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.deal_number} | ${i.contract_date} | ${i.buy_rate ?? ''} | ${i.contract_rate ?? ''} | ${i.expected_reserve} | ${i.reserve_received} |`), '',
    `[CHECK the reserve terms in your agreement with ${lender}: the expected figures assume ${sharePct}% of the rate markup, or the flat fee shown on the deal]`].join('\n') };
}
