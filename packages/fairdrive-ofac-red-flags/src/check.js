// OFAC and Red Flags (identity) check records: present, dated before delivery, result recorded.
// It checks that records exist. It makes no compliance determination and never reads a check result.
import { str, normId, isoDate, yes, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Buyer', 'Buyer Name', 'Customer Name'], { pii: 'name' }),
  co_buyer: t(['Co-Buyer', 'Co Buyer', 'Cobuyer', 'Co-Applicant'], { pii: 'name' }),
  delivery_date: t(['Delivery Date', 'Delivered', 'Sold Date', 'Deal Date'], { type: 'date', required: true }),
  deal_type: t(['Deal Type', 'Finance Type', 'Payment Type']),
  credit_pulled: t(['Credit Pulled', 'Credit Report', 'Bureau Pulled'], { type: 'bool' }),
  status: t(['Status', 'Deal Status']),
});
export const CHECK_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  check_type: t(['Check Type', 'Check', 'Type', 'Form'], { required: true }),
  person: t(['Person', 'Party', 'Applicant', 'Checked']),
  check_date: t(['Check Date', 'Date', 'Run Date', 'Completed'], { type: 'date' }),
  result_recorded: t(['Result Recorded', 'Result On File', 'Documented', 'Recorded'], { type: 'bool' }),
  performed_by: t(['Performed By', 'Run By', 'User', 'F&I Manager']),
});
export const checkKind = (v) => { const s = str(v).toLowerCase(); return /ofac|sdn/.test(s) ? 'ofac' : /red ?flag|identity|id verif|id check/.test(s) ? 'red_flags' : null; };
const isCo = (v) => /co[- ]?(buyer|applicant|borrower)|^co$|cosign/i.test(str(v));
const credit = (d) => yes(d.credit_pulled) === true || /financ|lease|loan|retail install/i.test(str(d.deal_type));

export function checkRecords(deals, checks) {
  const byDeal = groupBy(checks.filter((c) => normId(c.deal_number)), (c) => normId(c.deal_number));
  const seen = new Set(); const items = []; let skipped = 0;
  for (const d of [...deals].filter((x) => normId(x.deal_number)).sort(by('deal_number'))) {
    const id = normId(d.deal_number); if (seen.has(id)) continue; seen.add(id);
    if (/unwound|unwind|cancel|void|dead/i.test(str(d.status))) { skipped++; continue; }
    const list = (byDeal.get(id) || []).map((c) => ({ kind: checkKind(c.check_type), co: isCo(c.person), date: isoDate(c.check_date), recorded: yes(c.result_recorded) }));
    const delivered = isoDate(d.delivery_date);
    const gaps = [];
    const ofacBuyer = list.filter((c) => c.kind === 'ofac' && !c.co);
    if (!ofacBuyer.length) gaps.push('ofac_missing');
    else if (delivered && ofacBuyer.every((c) => c.date && c.date > delivered)) gaps.push('ofac_after_delivery');
    if (str(d.co_buyer) && !list.some((c) => c.kind === 'ofac' && c.co)) gaps.push('co_buyer_not_checked');
    if (credit(d) && !list.some((c) => c.kind === 'red_flags')) gaps.push('red_flags_missing');
    if (list.some((c) => c.kind && c.recorded === false)) gaps.push('result_not_recorded');
    if (gaps.length) items.push({ deal_number: str(d.deal_number), customer: str(d.customer), co_buyer: str(d.co_buyer), delivery_date: delivered, deal_type: str(d.deal_type), records_found: list.filter((c) => c.kind).length, gaps, why: gaps.map((g) => ({ ofac_missing: 'No OFAC check record for the buyer.', ofac_after_delivery: 'The OFAC check record is dated after delivery.', co_buyer_not_checked: 'There is a co-buyer and no OFAC check record for them.', red_flags_missing: 'Credit was involved and there is no Red Flags (identity) check record.', result_not_recorded: 'A check record says its result was not recorded.' }[g])).join(' ') });
  }
  const n = (g) => items.filter((i) => i.gaps.includes(g)).length;
  return { deals: seen.size - skipped, skipped_unwound: skipped, deals_with_gaps: items.length, ofac_missing: n('ofac_missing'), ofac_after_delivery: n('ofac_after_delivery'), co_buyer_not_checked: n('co_buyer_not_checked'), red_flags_missing: n('red_flags_missing'), result_not_recorded: n('result_not_recorded'), note: 'Record presence and dates only. This is not a compliance determination and does not read or judge any check result.', items };
}

export const line = (r) => `${r.deals} deal(s), ${r.deals_with_gaps} with a record gap: ${r.ofac_missing} with no OFAC check record, ${r.ofac_after_delivery} dated after delivery, ${r.co_buyer_not_checked} co-buyer(s) not checked, ${r.red_flags_missing} with no Red Flags record, ${r.result_not_recorded} with a result not recorded. Record presence only; not a compliance determination.`;
