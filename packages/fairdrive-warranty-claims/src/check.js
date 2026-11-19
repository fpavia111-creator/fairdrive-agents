// Warranty claims submitted against what the manufacturer paid, rejected or debited. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, addDays, asOfDate, ageBucket, bucketLabels, groupBy, tally, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const CLAIM_FIELDS = Object.freeze({
  claim_number: t(['Claim Number', 'Claim #', 'Claim No', 'Claim'], { required: true }),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order']),
  vin: t(['VIN', 'Serial Number']),
  submitted_date: t(['Submitted', 'Submitted Date', 'Claim Date', 'Date Submitted'], { type: 'date', required: true }),
  labor_amount: t(['Labor', 'Labor Amount', 'Labor Claimed'], { type: 'money' }),
  parts_amount: t(['Parts', 'Parts Amount', 'Parts Claimed'], { type: 'money' }),
  total_claimed: t(['Total Claimed', 'Claim Total', 'Amount Claimed', 'Total'], { type: 'money', required: true }),
});
export const STATEMENT_FIELDS = Object.freeze({
  claim_number: t(['Claim Number', 'Claim #', 'Claim No', 'Claim'], { required: true }),
  paid_date: t(['Paid Date', 'Statement Date', 'Date', 'Credit Date'], { type: 'date' }),
  amount_paid: t(['Amount Paid', 'Paid Amount', 'Credit', 'Amount'], { type: 'money', required: true }),
  status: t(['Claim Status', 'Status', 'Type']),
  reason: t(['Reason', 'Debit Code', 'Rejection Reason', 'Comment', 'Explanation']),
});
const REJECT = /reject|denied|return|declin/i, DEBIT = /debit|charge ?back|reversal|reverse/i;

export function checkWarranty(claims, statement, { asOf, edges = [30, 60, 90], resubmitDays = 30, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const lines = statement.filter((s) => normId(s.claim_number)).sort(by('paid_date', 'claim_number', 'amount_paid')).map((s) => ({ id: normId(s.claim_number), amount: num(s.amount_paid) ?? 0, date: isoDate(s.paid_date), status: str(s.status), reason: str(s.reason) }));
  const byClaim = groupBy(lines, (l) => l.id);
  const seen = new Set(); const items = []; let claimed = 0, paid = 0;
  for (const c of [...claims].filter((x) => normId(x.claim_number)).sort(by('submitted_date', 'claim_number'))) {
    const id = normId(c.claim_number); if (seen.has(id)) continue; seen.add(id);
    const amt = num(c.total_claimed) ?? round2((num(c.labor_amount) || 0) + (num(c.parts_amount) || 0)); claimed += amt;
    const hits = byClaim.get(id) || []; const net = round2(hits.reduce((s, h) => s + h.amount, 0)); paid += net;
    const open = round2(Math.max(0, amt - net));
    const sub = isoDate(c.submitted_date); const age = daysBetween(sub, today);
    const findings = []; const why = []; let resubmitBy = null;
    const rejected = hits.find((h) => REJECT.test(h.status)); const debit = hits.find((h) => h.amount < 0 || DEBIT.test(h.status));
    if (debit) { findings.push('debited_after_payment'); why.push(`Debited ${Math.abs(debit.amount)} on ${debit.date}${debit.reason ? `: ${debit.reason}` : ''}.`); }
    else if (rejected && net <= tolerance) { resubmitBy = rejected.date ? addDays(rejected.date, resubmitDays) : null; findings.push(resubmitBy && resubmitBy < today ? 'rejected_past_deadline' : 'rejected'); why.push(`Rejected${rejected.reason ? `: ${rejected.reason}` : ''}.${resubmitBy ? ` Resubmit by ${resubmitBy}${resubmitBy < today ? ' (passed)' : ''}.` : ''}`); }
    else if (hits.length && amt - net > tolerance) { findings.push('paid_short'); why.push(`Paid ${net} against ${amt} claimed.`); }
    else if (!hits.length) { findings.push('unpaid'); why.push(`Submitted ${age} days ago and not on the statement.`); }
    if (findings.length) items.push({ claim_number: str(c.claim_number), ro_number: str(c.ro_number), vin: str(c.vin), submitted_date: sub, age_days: age, bucket: findings[0] === 'unpaid' ? ageBucket(age, edges) : null, claimed: amt, paid: net, outstanding: open, resubmit_by: resubmitBy, reason: (debit || rejected || {}).reason || '', findings, why: why.join(' ') });
  }
  items.sort(by('-outstanding', 'claim_number'));
  const not = [...byClaim.keys()].filter((k) => !seen.has(k)).sort().map((k) => ({ claim_number: k, amount: round2(byClaim.get(k).reduce((s, l) => s + l.amount, 0)) }));
  const has = (...f) => items.filter((i) => i.findings.some((x) => f.includes(x)));
  const unpaid = has('unpaid');
  return { as_of: today, claims: seen.size, claimed: round2(claimed), paid: round2(paid), outstanding: round2(claimed - paid), unpaid: unpaid.length, unpaid_amount: round2(unpaid.reduce((s, i) => s + i.outstanding, 0)), paid_short: has('paid_short').length, short_amount: round2(has('paid_short').reduce((s, i) => s + i.outstanding, 0)), rejected: has('rejected', 'rejected_past_deadline').length, rejected_amount: round2(has('rejected', 'rejected_past_deadline').reduce((s, i) => s + i.outstanding, 0)), rejected_past_deadline: has('rejected_past_deadline').length, debited: has('debited_after_payment').length, debited_amount: round2(has('debited_after_payment').reduce((s, i) => s + i.outstanding, 0)),
    unpaid_by_age: bucketLabels(edges).map((b) => { const l = unpaid.filter((i) => i.bucket === b); return { bucket: b, claims: l.length, amount: round2(l.reduce((s, i) => s + i.outstanding, 0)) }; }),
    by_reason: tally(items.filter((i) => i.reason), (i) => i.reason, 'reason', (i) => i.outstanding).map((x) => ({ reason: x.reason, claims: x.count, amount: x.amount })), paid_not_on_schedule: not, items };
}

export const line = (r) => `${r.claims} claim(s): ${r.claimed} claimed, ${r.paid} paid, ${r.outstanding} outstanding. ${r.unpaid} unpaid (${r.unpaid_amount}), ${r.paid_short} paid short (${r.short_amount}), ${r.rejected} rejected (${r.rejected_amount}; ${r.rejected_past_deadline} past the resubmission date), ${r.debited} debited after payment (${r.debited_amount}).`;

export function reviewText(items, { from, contact }) {
  const list = items.filter((i) => i.findings.some((f) => ['rejected', 'rejected_past_deadline', 'paid_short', 'debited_after_payment'].includes(f)));
  const total = round2(list.reduce((s, i) => s + i.outstanding, 0));
  return { total, count: list.length, text: ['# Warranty claim review request', '', `**To:** ${contact || '[TO CONFIRM manufacturer warranty representative]'}`, `**From:** ${from || '[TO CONFIRM your name and dealer code]'}`, '',
    `Please review the ${list.length} claim(s) below, ${total} in total. Each was rejected, paid short or debited after payment.`, '',
    '| Claim | RO | Submitted | Claimed | Paid | Status | Reason given |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.claim_number} | ${i.ro_number} | ${i.submitted_date} | ${i.claimed} | ${i.paid} | ${i.findings.join(', ')} | ${i.reason} |`), '',
    '[ATTACH the repair order, technician notes and parts return for each claim]', '[CHECK the resubmission deadline in the warranty policy manual]'].join('\n') };
}
