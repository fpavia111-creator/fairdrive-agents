// We-owes (due bills): promises made on deals, open, late, unscheduled, or done without cost. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, ageBucket, bucketLabels, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const WEOWE_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  delivery_date: t(['Delivery Date', 'Delivered', 'Deal Date', 'Sold Date'], { type: 'date' }),
  item: t(['Item', 'We Owe', 'Description', 'Due Bill Item', 'Promise'], { required: true }),
  promised_date: t(['Promised Date', 'Promised', 'Due Date', 'Promise Date'], { type: 'date' }),
  estimated_cost: t(['Estimated Cost', 'Est Cost', 'Cost Estimate', 'Estimate'], { type: 'money' }),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order']),
  completed_date: t(['Completed', 'Completed Date', 'Done Date', 'Closed'], { type: 'date' }),
  cost_booked: t(['Cost Booked', 'Actual Cost', 'Cost Posted', 'Cost'], { type: 'money' }),
});

export function checkWeOwes(rows, { asOf, openDays = 30, scheduleDays = 7, edges = [30, 60, 90] } = {}) {
  const today = asOfDate(asOf);
  const seen = new Set(); const all = [];
  for (const r of [...rows].filter((x) => normId(x.deal_number) && str(x.item)).sort(by('delivery_date', 'deal_number', 'item'))) {
    const k = `${normId(r.deal_number)}|${str(r.item).toLowerCase()}`; if (seen.has(k)) continue; seen.add(k);
    const delivered = isoDate(r.delivery_date); const days = delivered ? daysBetween(delivered, today) : null;
    const done = isoDate(r.completed_date); const promised = isoDate(r.promised_date);
    const findings = []; const why = [];
    if (done) { const booked = num(r.cost_booked); if (!booked) { findings.push('cost_not_booked'); why.push(`Done on ${done}; no cost booked, so the deal gross is overstated by about ${num(r.estimated_cost) ?? '?'}.`); } }
    else {
      if (promised && promised < today) { findings.push('past_promise'); why.push(`Promised for ${promised}.`); }
      if (!promised && days !== null && days > openDays) { findings.push('open_long'); why.push(`Open ${days} days with no promise date.`); }
      if (!str(r.ro_number) && days !== null && days > scheduleDays) { findings.push('not_scheduled'); why.push('No repair order opened for it.'); }
    }
    all.push({ deal_number: str(r.deal_number), customer: str(r.customer), item: str(r.item), delivery_date: delivered, days_since_delivery: days, bucket: done ? null : ageBucket(days, edges), promised_date: promised, estimated_cost: num(r.estimated_cost), ro_number: str(r.ro_number), completed_date: done, cost_booked: num(r.cost_booked), open: !done, findings, why: why.join(' ') });
  }
  const open = all.filter((r) => r.open);
  const items = all.filter((r) => r.findings.length).sort(by('-days_since_delivery', 'deal_number', 'item'));
  const n = (f) => items.filter((i) => i.findings.includes(f));
  return { as_of: today, we_owes: all.length, open: open.length, open_cost: round2(open.reduce((s, r) => s + (r.estimated_cost || 0), 0)), past_promise: n('past_promise').length, not_scheduled: n('not_scheduled').length, open_long: n('open_long').length, cost_not_booked: n('cost_not_booked').length, cost_not_booked_estimate: round2(n('cost_not_booked').reduce((s, i) => s + (i.estimated_cost || 0), 0)), open_by_age: bucketLabels(edges).map((b) => { const l = open.filter((r) => r.bucket === b); return { bucket: b, we_owes: l.length, estimated_cost: round2(l.reduce((s, r) => s + (r.estimated_cost || 0), 0)) }; }), items };
}

export const line = (r) => `${r.we_owes} we-owe(s), ${r.open} open (${r.open_cost} estimated cost still owed). ${r.past_promise} past the promised date, ${r.not_scheduled} not scheduled, ${r.open_long} open with no promise date too long, ${r.cost_not_booked} done without cost booked (about ${r.cost_not_booked_estimate}).`;
