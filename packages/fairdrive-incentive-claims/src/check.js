// Manufacturer incentives and holdback expected per unit against the manufacturer statement. Pure functions.
import { str, num, round2, normId, normVin, vinTail, isoDate, daysBetween, asOfDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const EXPECTED_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #']),
  vin: t(['VIN', 'Vehicle VIN', 'Serial Number'], { required: true }),
  sale_date: t(['Sale Date', 'Delivery Date', 'RDR Date', 'Deal Date'], { type: 'date', required: true }),
  program: t(['Program', 'Program Code', 'Incentive', 'Incentive Program'], { required: true }),
  amount_expected: t(['Amount Expected', 'Expected', 'Incentive Amount', 'Amount', 'Claim Amount'], { type: 'money', required: true }),
  claim_submitted: t(['Claim Submitted', 'Submitted', 'Submitted Date', 'Claim Date'], { type: 'date' }),
  claim_number: t(['Claim Number', 'Claim #', 'Claim ID']),
});
export const STATEMENT_FIELDS = Object.freeze({
  vin: t(['VIN', 'Serial Number', 'Vehicle'], { required: true }),
  program: t(['Program', 'Program Code', 'Incentive']),
  amount_paid: t(['Amount Paid', 'Paid Amount', 'Credit Amount', 'Amount'], { type: 'money', required: true }),
  paid_date: t(['Paid Date', 'Statement Date', 'Date', 'Credit Date'], { type: 'date' }),
  status: t(['Status', 'Claim Status', 'Type']),
  reason: t(['Reason', 'Rejection Reason', 'Comment', 'Debit Reason']),
});
const prog = (v) => normId(v);
const REJECT = /reject|denied|declin|return/i, CHARGE = /charge ?back|debit|reversal|reverse/i;

export function checkIncentives(expected, statement, { asOf, deadlineDays = 30, unpaidDays = 45, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const lines = statement.filter((s) => normVin(s.vin)).sort(by('paid_date', 'vin', 'program')).map((s, i) => ({ i, tail: vinTail(s.vin), program: prog(s.program), amount: num(s.amount_paid) ?? 0, date: isoDate(s.paid_date), status: str(s.status), reason: str(s.reason), used: false }));
  const byKey = groupBy(lines, (l) => `${l.tail}|${l.program}`);
  const seen = new Set(); const items = []; let expTotal = 0, paidTotal = 0, outstanding = 0;
  for (const e of [...expected].filter((x) => normVin(x.vin) && prog(x.program)).sort(by('sale_date', 'vin', 'program'))) {
    const key = `${vinTail(e.vin)}|${prog(e.program)}`; if (seen.has(key)) continue; seen.add(key);
    const exp = num(e.amount_expected) ?? 0; expTotal += exp;
    const hits = byKey.get(key) || []; for (const h of hits) h.used = true;
    const net = round2(hits.reduce((s, h) => s + h.amount, 0)); paidTotal += net;
    const open = round2(Math.max(0, exp - net)); outstanding += open;
    const sold = isoDate(e.sale_date), sub = isoDate(e.claim_submitted);
    const findings = []; const why = [];
    const rejected = hits.find((h) => REJECT.test(h.status)); const charged = hits.find((h) => h.amount < 0 || CHARGE.test(h.status));
    if (charged) { findings.push('charged_back'); why.push(`Charged back ${Math.abs(charged.amount)} on ${charged.date}${charged.reason ? `: ${charged.reason}` : ''}.`); }
    else if (rejected && net <= tolerance) { findings.push('rejected'); why.push(`Rejected${rejected.reason ? `: ${rejected.reason}` : ''}. Fix and resubmit before the program deadline.`); }
    else if (hits.length && exp - net > tolerance) { findings.push('paid_short'); why.push(`Paid ${net} against ${exp} expected.`); }
    else if (!hits.length && !sub) {
      const days = daysBetween(sold, today);
      if (days > deadlineDays) { findings.push('not_submitted_past_deadline'); why.push(`Sold ${days} days ago and no claim submitted; your deadline is ${deadlineDays} days.`); }
      else { findings.push('not_submitted'); why.push(`Sold ${days} days ago; submit within ${deadlineDays - days} day(s).`); }
    } else if (!hits.length && sub && daysBetween(sub, today) > unpaidDays) { findings.push('unpaid'); why.push(`Submitted ${daysBetween(sub, today)} days ago and not on the statement.`); }
    if (findings.length) items.push({ deal_number: str(e.deal_number), vin: normVin(e.vin), program: str(e.program), sale_date: sold, claim_submitted: sub, claim_number: str(e.claim_number), expected: exp, paid: net, outstanding: open, findings, why: why.join(' ') });
  }
  items.sort(by('-outstanding', 'vin', 'program'));
  const unexpected = lines.filter((l) => !l.used && l.amount > 0).map((l) => ({ vin: str(statement[0] && l.tail), program: l.program, amount: l.amount, paid_date: l.date }));
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  return { as_of: today, lines: seen.size, expected: round2(expTotal), paid: round2(paidTotal), outstanding: round2(outstanding), not_submitted_past_deadline: n('not_submitted_past_deadline'), not_submitted: n('not_submitted'), unpaid: n('unpaid'), paid_short: n('paid_short'), rejected: n('rejected'), charged_back: n('charged_back'), paid_not_expected: unexpected, items };
}

export const line = (r) => `${r.lines} incentive line(s): ${r.expected} expected, ${r.paid} paid, ${r.outstanding} outstanding. ${r.not_submitted_past_deadline} not submitted past the deadline, ${r.not_submitted} still to submit, ${r.unpaid} unpaid, ${r.paid_short} paid short, ${r.rejected} rejected, ${r.charged_back} charged back; ${r.paid_not_expected.length} paid line(s) not expected.`;

/** Inquiry to the manufacturer incentive desk about unpaid, short, rejected and charged-back claims. */
export function inquiryText(items, { from, contact }) {
  const list = items.filter((i) => i.findings.some((f) => ['unpaid', 'paid_short', 'rejected', 'charged_back'].includes(f)));
  const total = round2(list.reduce((s, i) => s + i.outstanding, 0));
  return { total, count: list.length, text: ['# Incentive claim inquiry', '', `**To:** ${contact || '[TO CONFIRM manufacturer incentive desk contact]'}`, `**From:** ${from || '[TO CONFIRM your name and dealer code]'}`, '',
    `Please review the ${list.length} claim(s) below, ${total} outstanding in total, and tell us what is needed to pay them.`, '',
    '| VIN | Program | Claim | Sold | Expected | Paid | Status |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.vin} | ${i.program} | ${i.claim_number} | ${i.sale_date} | ${i.expected} | ${i.paid} | ${i.findings.join(', ')} |`), '',
    '[CHECK each program rule and deadline in the current program bulletin before sending]'].join('\n') };
}
