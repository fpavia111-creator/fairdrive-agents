// Insurance supplements: waiting, approved short, denied, and response times by insurer. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, partyGrouper, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const SUPPLEMENT_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'Repair Order', 'Work Order'], { required: true }),
  claim_number: t(['Claim Number', 'Claim #', 'Claim']),
  insurer: t(['Insurer', 'Insurance Company', 'Carrier', 'Payer'], { required: true }),
  supplement_number: t(['Supplement', 'Supplement Number', 'Sup', 'Version']),
  submitted_date: t(['Submitted', 'Submitted Date', 'Sent Date', 'Date Sent'], { type: 'date', required: true }),
  amount_requested: t(['Amount Requested', 'Requested', 'Supplement Amount', 'Amount'], { type: 'money', required: true }),
  status: t(['Status', 'Supplement Status', 'Response']),
  response_date: t(['Response Date', 'Approved Date', 'Responded', 'Decision Date'], { type: 'date' }),
  amount_approved: t(['Amount Approved', 'Approved', 'Approved Amount'], { type: 'money' }),
  customer: t(['Customer', 'Customer Name', 'Owner', 'Insured'], { pii: 'name' }),
});
const DENIED = /deni|declin|reject/i, PENDING = /pend|wait|submitted|sent|open/i;

export function trackSupplements(rows, { asOf, followUpDays = 5, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const group = partyGrouper(rows.map((r) => r.insurer));
  const names = new Map(); for (const n of rows.map((r) => str(r.insurer)).filter(Boolean).sort()) if (!names.has(group(n))) names.set(group(n), n);
  const seen = new Set(); const all = []; const items = [];
  for (const r of [...rows].filter((x) => normId(x.ro_number) && isoDate(x.submitted_date)).sort(by('submitted_date', 'ro_number', 'supplement_number'))) {
    const k = `${normId(r.ro_number)}|${normId(r.supplement_number)}`; if (seen.has(k)) continue; seen.add(k);
    const req = num(r.amount_requested) ?? 0, appr = num(r.amount_approved);
    const sub = isoDate(r.submitted_date), resp = isoDate(r.response_date);
    const pending = !resp && !DENIED.test(str(r.status)) && (appr === null || PENDING.test(str(r.status)));
    const row = { ro_number: str(r.ro_number), claim_number: str(r.claim_number), insurer: names.get(group(r.insurer)) || str(r.insurer), customer: str(r.customer), supplement_number: str(r.supplement_number), submitted_date: sub, requested: req, approved: pending ? null : appr ?? 0, pending, days_waiting: pending ? daysBetween(sub, today) : null, days_to_response: resp ? daysBetween(sub, resp) : null };
    all.push(row);
    if (pending && row.days_waiting > followUpDays) items.push({ ...row, finding: 'pending_over', amount: req, why: `Sent ${row.days_waiting} days ago with no answer.` });
    else if (!pending && DENIED.test(str(r.status))) items.push({ ...row, finding: 'denied', amount: req, why: `Denied${resp ? ` on ${resp}` : ''}.` });
    else if (!pending && req - (appr ?? 0) > tolerance) items.push({ ...row, finding: 'approved_short', amount: round2(req - (appr ?? 0)), why: `Approved ${appr ?? 0} of ${req} requested.` });
  }
  items.sort(by('-amount', 'ro_number'));
  const byInsurer = [...groupBy(all, (r) => r.insurer)].map(([insurer, l]) => { const answered = l.filter((r) => r.days_to_response !== null); return { insurer, supplements: l.length, requested: round2(l.reduce((s, r) => s + r.requested, 0)), approved: round2(l.reduce((s, r) => s + (r.approved || 0), 0)), pending: round2(l.filter((r) => r.pending).reduce((s, r) => s + r.requested, 0)), average_days_to_response: answered.length ? round2(answered.reduce((s, r) => s + r.days_to_response, 0) / answered.length) : null }; }).sort(by('insurer'));
  const n = (f) => items.filter((i) => i.finding === f);
  return { as_of: today, supplements: all.length, requested: round2(all.reduce((s, r) => s + r.requested, 0)), approved: round2(all.reduce((s, r) => s + (r.approved || 0), 0)), pending_amount: round2(all.filter((r) => r.pending).reduce((s, r) => s + r.requested, 0)), follow_up_days: followUpDays, pending_over: n('pending_over').length, approved_short: n('approved_short').length, short_amount: round2(n('approved_short').reduce((s, i) => s + i.amount, 0)), denied: n('denied').length, denied_amount: round2(n('denied').reduce((s, i) => s + i.amount, 0)), by_insurer: byInsurer, items };
}

export const line = (r) => `${r.supplements} supplement(s): ${r.requested} requested, ${r.approved} approved, ${r.pending_amount} waiting. ${r.pending_over} waiting over ${r.follow_up_days} days, ${r.approved_short} approved short (${r.short_amount}), ${r.denied} denied (${r.denied_amount}).`;

export function followUpText(items, { insurer, from, contact }) {
  const list = items.filter((i) => i.finding === 'pending_over');
  const total = round2(list.reduce((s, i) => s + i.amount, 0));
  return { total, count: list.length, text: [`# Supplement follow-up: ${insurer}`, '', `**To:** ${contact || `[TO CONFIRM ${insurer} adjuster]`}`, `**From:** ${from || '[TO CONFIRM your name and shop]'}`, '',
    `We are waiting on ${list.length} supplement(s), ${total} in total. The vehicles cannot be finished until we hear back.`, '',
    '| Claim | RO | Supplement | Sent | Days waiting | Requested |', '| --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.claim_number} | ${i.ro_number} | ${i.supplement_number} | ${i.submitted_date} | ${i.days_waiting} | ${i.requested} |`), '',
    '[ATTACH photos and the supplement estimate for each]'].join('\n') };
}
