// Open repair orders aged by advisor and pay type. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, ageBucket, bucketLabels, groupBy, yes, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const RO_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order', 'Order #'], { required: true }),
  opened: t(['Opened', 'Open Date', 'RO Date', 'Created'], { type: 'date', required: true }),
  advisor: t(['Advisor', 'Service Advisor', 'Writer', 'SA']),
  customer: t(['Customer', 'Customer Name', 'Name'], { pii: 'name' }),
  labor_type: t(['Labor Type', 'Pay Type', 'Type']),
  status: t(['Status', 'RO Status', 'Order Status', 'Workflow']),
  promised_date: t(['Promised', 'Promise Date', 'Promised Date', 'Due'], { type: 'date' }),
  total: t(['Total', 'RO Total', 'Amount', 'Grand Total'], { type: 'money' }),
  parts_on_order: t(['Parts On Order', 'Parts Ordered', 'Waiting Parts'], { type: 'bool' }),
});
const payType = (v) => { const s = str(v).toLowerCase(); return /warr|^w$/.test(s) ? 'warranty' : /intern|^i$|policy|recon/.test(s) ? 'internal' : 'customer_pay'; };

export function ageOpenRos(ros, { asOf, edges = [7, 14, 30], longDays = 30, warrantyDays = 30, internalDays = 14 } = {}) {
  const today = asOfDate(asOf);
  const seen = new Set(); const all = [];
  for (const r of [...ros].filter((x) => normId(x.ro_number) && isoDate(x.opened)).sort(by('opened', 'ro_number'))) {
    const id = normId(r.ro_number); if (seen.has(id)) continue; seen.add(id);
    const age = daysBetween(isoDate(r.opened), today); const type = payType(r.labor_type);
    const promised = isoDate(r.promised_date);
    const findings = []; const why = [];
    if (promised && promised < today) { findings.push('past_promise'); why.push(`Promised for ${promised}.`); }
    if (yes(r.parts_on_order) === true || /part/i.test(str(r.status))) { findings.push('waiting_parts'); why.push('Waiting on parts.'); }
    if (type === 'warranty' && age > warrantyDays) { findings.push('warranty_open_long'); why.push(`Warranty order open ${age} days; the claim cannot be filed until it closes.`); }
    if (type === 'internal' && age > internalDays) { findings.push('internal_open_long'); why.push(`Internal order open ${age} days; its cost is not in the books yet.`); }
    if (type === 'customer_pay' && age > longDays) { findings.push('open_long'); why.push(`Customer-pay order open ${age} days.`); }
    all.push({ ro_number: str(r.ro_number), opened: isoDate(r.opened), age_days: age, bucket: ageBucket(age, edges), advisor: str(r.advisor) || '(none)', customer: str(r.customer), pay_type: type, status: str(r.status), promised_date: promised, total: num(r.total) ?? 0, findings, why: why.join(' ') });
  }
  const items = all.filter((r) => r.findings.length).sort(by('-age_days', 'ro_number'));
  const byBucket = bucketLabels(edges).map((b) => { const l = all.filter((r) => r.bucket === b); return { bucket: b, repair_orders: l.length, amount: round2(l.reduce((s, r) => s + r.total, 0)) }; });
  const byAdvisor = [...groupBy(all, (r) => r.advisor)].map(([advisor, l]) => ({ advisor, repair_orders: l.length, amount: round2(l.reduce((s, r) => s + r.total, 0)), oldest_days: Math.max(...l.map((r) => r.age_days ?? 0)) })).sort(by('-amount', 'advisor'));
  const byType = ['customer_pay', 'warranty', 'internal'].map((p) => { const l = all.filter((r) => r.pay_type === p); return { pay_type: p, repair_orders: l.length, amount: round2(l.reduce((s, r) => s + r.total, 0)) }; });
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  return { as_of: today, open: all.length, amount: round2(all.reduce((s, r) => s + r.total, 0)), oldest_days: all.reduce((m, r) => Math.max(m, r.age_days ?? 0), 0), past_promise: n('past_promise'), waiting_parts: n('waiting_parts'), warranty_open_long: n('warranty_open_long'), internal_open_long: n('internal_open_long'), open_long: n('open_long'), by_age: byBucket, by_advisor: byAdvisor, by_pay_type: byType, items };
}

export const line = (r) => `${r.open} open repair order(s) worth ${r.amount}, oldest ${r.oldest_days} days. ${r.past_promise} past the promised date, ${r.waiting_parts} waiting on parts, ${r.warranty_open_long} warranty and ${r.internal_open_long} internal open too long, ${r.open_long} customer-pay open too long.`;
