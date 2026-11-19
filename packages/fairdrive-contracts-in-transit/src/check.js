// Fairdrive Contracts In Transit: contracts in transit (financed deals waiting for the lender to fund). Pure functions.
import { str, num, round2, normId, normVin, isoDate, daysBetween, asOfDate, ageBucket, bucketLabels, partyGrouper, by, groupBy } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const CONTRACT_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Deal ID'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer', 'Buyer Name'], { pii: 'name' }),
  vin: t(['VIN', 'Vehicle VIN', 'Serial Number']),
  lender: t(['Lender', 'Lienholder', 'Finance Source', 'Bank', 'Finance Company'], { required: true }),
  contract_date: t(['Contract Date', 'Deal Date', 'Sold Date', 'Date Contracted'], { type: 'date', required: true }),
  amount_financed: t(['Amount Financed', 'Amt Financed', 'Financed Amount'], { type: 'money' }),
  expected_funding: t(['Expected Funding', 'Net Proceeds', 'Proceeds', 'Net to Dealer', 'Funding Due'], { type: 'money' }),
  funded_date: t(['Funded Date', 'Date Funded', 'Funding Date'], { type: 'date' }),
  funded_amount: t(['Funded Amount', 'Amount Funded', 'Funds Received'], { type: 'money' }),
  status: t(['Funding Status', 'CIT Status', 'Status', 'Contract Status']),
  stips: t(['Stips', 'Stipulations', 'Open Stips', 'Conditions', 'Missing Items']),
});
export const STATEMENT_FIELDS = Object.freeze({
  lender: t(['Lender', 'Finance Source', 'Bank']),
  deal_number: t(['Deal No', 'Deal Number', 'Dealer Reference', 'Dealer Ref', 'Deal #']),
  vin: t(['VIN', 'Collateral VIN', 'Vehicle VIN', 'Serial Number']),
  customer: t(['Customer', 'Borrower', 'Buyer', 'Customer Name'], { pii: 'name' }),
  funded_date: t(['Funded Date', 'Funding Date', 'Disbursement Date', 'Date'], { type: 'date', required: true }),
  funded_amount: t(['Funded Amount', 'Amount', 'Disbursed', 'Net Funded', 'Dealer Proceeds'], { type: 'money', required: true }),
});

const RETURNED = /return|reject|kick|declin|rehash|re-?sign/i;
const isFunded = (c) => !!isoDate(c.funded_date) || /^(funded|paid|complete)/i.test(str(c.status));
const vinMatch = (a, b) => !!a && !!b && (a === b || (a.length >= 6 && b.endsWith(a)) || (b.length >= 6 && a.endsWith(b)));

/** Age every unfunded contract and find funding exceptions. */
export function checkFunding(contracts, statement = null, { asOf, alertDays = 10, edges = [10, 20, 30], tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const group = partyGrouper([...contracts.map((c) => c.lender), ...(statement || []).map((s) => s.lender)]);
  const shown = new Map();
  for (const n of [...contracts.map((c) => str(c.lender)), ...(statement || []).map((s) => str(s.lender))].filter(Boolean).sort()) { const k = group(n); if (k && !shown.has(k)) shown.set(k, n); }
  const lenderName = (v) => shown.get(group(v)) || str(v);
  const lines = (statement || []).map((s, i) => ({ i, deal: normId(s.deal_number), vin: normVin(s.vin), lender: lenderName(s.lender), date: isoDate(s.funded_date), amount: num(s.funded_amount) ?? 0, used: false }))
    .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : (a.date || '') > (b.date || '') ? 1 : a.amount - b.amount || (a.deal + a.vin < b.deal + b.vin ? -1 : 1));
  // Statement lines are matched by deal number first, then by VIN (full or a tail of 6 or more).
  // Indexed by deal number and by the last six VIN characters, in the fixed order above, so matching is linear.
  const byDeal = new Map(); const byTail = new Map();
  for (const l of lines) { if (l.deal) { if (!byDeal.has(l.deal)) byDeal.set(l.deal, []); byDeal.get(l.deal).push(l); } else if (l.vin.length >= 6) { const k = l.vin.slice(-6); if (!byTail.has(k)) byTail.set(k, []); byTail.get(k).push(l); } }
  const findLine = (c) => { const d = normId(c.deal_number), v = normVin(c.vin); return (byDeal.get(d) || []).find((l) => !l.used) || (v.length >= 6 ? (byTail.get(v.slice(-6)) || []).find((l) => !l.used && vinMatch(l.vin, v)) : undefined); };
  const items = []; const seen = new Set();
  const sorted = [...contracts].filter((c) => normId(c.deal_number)).sort(by('contract_date', 'deal_number'));
  for (const c of sorted) {
    const id = normId(c.deal_number); if (seen.has(id)) continue; seen.add(id);
    const ln = statement ? findLine(c) : null; if (ln) ln.used = true;
    const financed = num(c.amount_financed); const expected = num(c.expected_funding) ?? financed;
    const base = { deal_number: str(c.deal_number), customer: str(c.customer), lender: lenderName(c.lender), contract_date: isoDate(c.contract_date), amount_financed: financed, stips: str(c.stips) };
    const funded = isFunded(c);
    if (!funded && ln) { items.push({ ...base, finding: 'funded_not_posted', days: daysBetween(base.contract_date, ln.date), bucket: null, funded_on: ln.date, funded_amount: ln.amount, difference: null, why: `The lender statement shows ${ln.amount} funded on ${ln.date}; the DMS still shows the contract in transit. Post the funding and clear it from the schedule.` }); continue; }
    if (!funded) {
      const days = daysBetween(base.contract_date, today);
      const returned = RETURNED.test(str(c.status));
      items.push({ ...base, finding: returned ? 'returned_by_lender' : 'in_transit', days, bucket: ageBucket(days, edges), funded_on: null, funded_amount: null, difference: null, over_alert: days > alertDays, why: returned ? `Returned by the lender (${str(c.status)})${base.stips ? `: ${base.stips}` : ''}. Fix and resubmit; it is not funding while it waits.` : `${days} day(s) since contract${base.stips ? `; open stips: ${base.stips}` : ''}.` });
      continue;
    }
    const fAmt = ln ? ln.amount : num(c.funded_amount);
    const fDate = ln ? ln.date : isoDate(c.funded_date);
    if (statement && !ln) items.push({ ...base, finding: 'not_on_lender_statement', days: daysBetween(base.contract_date, fDate || today), bucket: null, funded_on: fDate, funded_amount: fAmt, difference: null, why: 'The DMS shows it funded but no line on the lender statement matches it by deal number or VIN. Confirm the money arrived.' });
    if (fAmt !== null && expected !== null && Math.abs(round2(fAmt - expected)) > tolerance) {
      const diff = round2(fAmt - expected);
      items.push({ ...base, finding: diff < 0 ? 'funded_short' : 'funded_over', days: daysBetween(base.contract_date, fDate), bucket: null, funded_on: fDate, funded_amount: fAmt, difference: diff, why: `Funded ${fAmt} against ${expected} expected (${diff}). Check the lender's funding notice for fees, a reserve change or a product the lender did not buy.` });
    }
  }
  const transit = items.filter((i) => i.finding === 'in_transit' || i.finding === 'returned_by_lender');
  const unmatched = lines.filter((l) => !l.used).map((l) => ({ lender: l.lender, deal_number: str((statement[l.i] || {}).deal_number), vin: l.vin, funded_on: l.date, funded_amount: l.amount }));
  const byLender = [...groupBy(transit, (i) => i.lender)].map(([lender, l]) => ({ lender, contracts: l.length, amount: round2(l.reduce((s, i) => s + (i.amount_financed || 0), 0)), oldest_days: Math.max(...l.map((i) => i.days ?? 0)) })).sort(by('-amount', 'lender'));
  const byBucket = bucketLabels(edges).map((b) => { const l = transit.filter((i) => i.bucket === b); return { bucket: b, contracts: l.length, amount: round2(l.reduce((s, i) => s + (i.amount_financed || 0), 0)) }; });
  const rank = { returned_by_lender: 0, in_transit: 1, funded_not_posted: 2, funded_short: 3, not_on_lender_statement: 4, funded_over: 5 };
  items.sort((a, b) => rank[a.finding] - rank[b.finding] || (b.days ?? 0) - (a.days ?? 0) || (a.deal_number < b.deal_number ? -1 : 1));
  return { as_of: today, contracts: seen.size, in_transit: transit.length, in_transit_amount: round2(transit.reduce((s, i) => s + (i.amount_financed || 0), 0)), over_alert: transit.filter((i) => i.over_alert).length, alert_days: alertDays, oldest_days: transit.reduce((m, i) => Math.max(m, i.days ?? 0), 0), returned: items.filter((i) => i.finding === 'returned_by_lender').length, funded_not_posted: items.filter((i) => i.finding === 'funded_not_posted').length, funded_short: round2(items.filter((i) => i.finding === 'funded_short').reduce((s, i) => s + i.difference, 0)), not_on_statement: items.filter((i) => i.finding === 'not_on_lender_statement').length, statement_checked: !!statement, statement_lines_not_matched: unmatched, by_lender: byLender, by_age: byBucket, items };
}

export const line = (r) => `${r.contracts} contract(s): ${r.in_transit} in transit for ${r.in_transit_amount} (${r.over_alert} over ${r.alert_days} days, oldest ${r.oldest_days} days, ${r.returned} returned by the lender).${r.funded_not_posted ? ` ${r.funded_not_posted} funded by the lender but still open in the DMS.` : ''}${r.funded_short ? ` Funded short by ${Math.abs(r.funded_short)} in total.` : ''}${r.statement_checked ? ` ${r.not_on_statement} marked funded but not on the lender statement; ${r.statement_lines_not_matched.length} statement line(s) match no contract.` : ''}`;

/** Follow-up to one lender: its contracts still in transit, oldest first, with open stips. */
export function followUpText(items, { lender, from, contact }) {
  const list = items.filter((i) => i.finding === 'in_transit' || i.finding === 'returned_by_lender');
  return [
    `# Funding follow-up: ${lender}`, '',
    `**To:** ${contact || `[TO CONFIRM ${lender} funding contact]`}`, `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    'The contracts below were sent to you and have not funded yet. Please tell us what is still needed for each, or the date you expect to fund.', '',
    '| Deal | Contract date | Amount financed | Days | Status | Open stips |', '| --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.deal_number} | ${i.contract_date} | ${i.amount_financed ?? ''} | ${i.days} | ${i.finding === 'returned_by_lender' ? 'returned' : 'in transit'} | ${i.stips || ''} |`), '',
    '[ATTACH any stips you are sending with this follow-up]',
  ].join('\n');
}
