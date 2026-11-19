// Policy and goodwill adjustments: approvals, reasons, size and repeats. Pure functions.
import { str, num, round2, normId, normVin, isoDate, daysBetween, groupBy, tally, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const ADJ_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order'], { required: true }),
  date: t(['Date', 'Adjustment Date', 'Closed Date', 'Posted'], { type: 'date', required: true }),
  advisor: t(['Advisor', 'Service Advisor', 'Writer', 'Requested By'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Name'], { pii: 'name' }),
  vin: t(['VIN', 'Vehicle VIN']),
  amount: t(['Amount', 'Policy Amount', 'Adjustment', 'Goodwill Amount'], { type: 'money', required: true }),
  reason: t(['Reason', 'Explanation', 'Comment', 'Policy Reason']),
  approved_by: t(['Approved By', 'Approver', 'Manager', 'Authorized By']),
});
const who = (v) => str(v).toLowerCase().replace(/\s+/g, ' ');

export function checkPolicy(rows, { approvalLimit = 250, repeatDays = 90 } = {}) {
  const seen = new Set(); const list = [];
  for (const r of [...rows].filter((x) => normId(x.ro_number) && isoDate(x.date)).sort(by('date', 'ro_number'))) { const k = `${normId(r.ro_number)}|${num(r.amount)}|${isoDate(r.date)}`; if (seen.has(k)) continue; seen.add(k); list.push(r); }
  const items = []; const lastByVin = new Map();
  for (const r of list) {
    const amt = num(r.amount) ?? 0; const v = normVin(r.vin);
    const findings = []; const why = [];
    if (!str(r.approved_by)) { findings.push('no_approver'); why.push('No approver recorded.'); }
    else if (who(r.approved_by) === who(r.advisor)) { findings.push('self_approved'); why.push('Approved by the advisor who wrote it.'); }
    if (amt > approvalLimit) { findings.push('large_adjustment'); why.push(`${amt} is over your ${approvalLimit} review line.`); }
    if (!str(r.reason)) { findings.push('no_reason'); why.push('No reason recorded.'); }
    if (v && lastByVin.has(v)) { const prev = lastByVin.get(v); const d = daysBetween(isoDate(prev.date), isoDate(r.date)); if (d <= repeatDays) { findings.push('repeat_vehicle'); why.push(`Same vehicle adjusted ${d} days earlier on RO ${str(prev.ro_number)}.`); } }
    if (v) lastByVin.set(v, r);
    if (findings.length) items.push({ ro_number: str(r.ro_number), date: isoDate(r.date), advisor: str(r.advisor), customer: str(r.customer), vin: v, amount: amt, reason: str(r.reason), approved_by: str(r.approved_by), findings, why: why.join(' ') });
  }
  items.sort(by('-amount', 'ro_number'));
  const byAdvisor = [...groupBy(list, (r) => str(r.advisor))].map(([advisor, l]) => ({ advisor, adjustments: l.length, amount: round2(l.reduce((s, r) => s + (num(r.amount) || 0), 0)) })).sort(by('-amount', 'advisor'));
  const byReason = tally(list, (r) => str(r.reason) || '(none)', 'reason', (r) => num(r.amount)).map((x) => ({ reason: x.reason, adjustments: x.count, amount: x.amount }));
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  return { adjustments: list.length, amount: round2(list.reduce((s, r) => s + (num(r.amount) || 0), 0)), approval_limit: approvalLimit, no_approver: n('no_approver'), self_approved: n('self_approved'), large_adjustment: n('large_adjustment'), no_reason: n('no_reason'), repeat_vehicle: n('repeat_vehicle'), by_advisor: byAdvisor, by_reason: byReason, items };
}

export const line = (r) => `${r.adjustments} policy adjustment(s) totalling ${r.amount}. ${r.no_approver} with no approver, ${r.self_approved} self-approved, ${r.large_adjustment} over ${r.approval_limit}, ${r.no_reason} with no reason, ${r.repeat_vehicle} repeated on the same vehicle.`;
