// Reconditioning: days and cost from acquisition to front-line ready. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const UNIT_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Stock'], { required: true }),
  vin: t(['VIN', 'Serial Number']),
  acquired_date: t(['Acquired', 'Acquired Date', 'Inventory Date', 'Received Date', 'Purchase Date'], { type: 'date', required: true }),
  frontline_date: t(['Frontline Date', 'Front Line Ready', 'Ready Date', 'Lot Ready', 'Retail Ready'], { type: 'date' }),
  recon_budget: t(['Recon Budget', 'Budget', 'Reconditioning Budget'], { type: 'money' }),
  status: t(['Status', 'Vehicle Status', 'Stock Status']),
});
export const RO_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Stock', 'Internal Stock'], { required: true }),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order'], { required: true }),
  opened: t(['Open Date', 'Opened', 'RO Date', 'Created'], { type: 'date' }),
  closed: t(['Close Date', 'Closed', 'Closed Date', 'Invoice Date'], { type: 'date' }),
  total: t(['Total', 'RO Total', 'Internal Total', 'Amount', 'Cost'], { type: 'money', required: true }),
});
const GONE = /sold|deliver|wholesal|transfer/i;

/** Follow every used unit from acquisition to front-line ready. */
export function checkRecon(units, ros, { asOf, targetDays = 7, defaultBudget = 1500, noRoDays = 3, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const byStock = groupBy(ros.filter((r) => normId(r.stock_number) && normId(r.ro_number)), (r) => normId(r.stock_number));
  const seen = new Set(); const all = []; let skipped = 0;
  for (const u of [...units].filter((x) => normId(x.stock_number)).sort(by('stock_number'))) {
    const id = normId(u.stock_number); if (seen.has(id)) continue; seen.add(id);
    if (GONE.test(str(u.status))) { skipped++; continue; }
    const roList = [...new Map((byStock.get(id) || []).map((r) => [normId(r.ro_number), r])).values()];
    const cost = round2(roList.reduce((s, r) => s + (num(r.total) || 0), 0));
    const open = roList.filter((r) => !isoDate(r.closed));
    const acquired = isoDate(u.acquired_date), front = isoDate(u.frontline_date);
    const days = front ? daysBetween(acquired, front) : daysBetween(acquired, today);
    const budget = num(u.recon_budget) ?? defaultBudget;
    const findings = []; const why = [];
    if (cost - budget > tolerance) { findings.push('over_budget'); why.push(`Recon cost ${cost} against a budget of ${budget}.`); }
    if (front && days > targetDays) { findings.push('slow'); why.push(`${days} days to front line, target ${targetDays}.`); }
    if (!front && days > targetDays && open.length) { findings.push('stuck'); why.push(`${days} days since acquisition, not front-line ready, ${open.length} repair order(s) still open.`); }
    if (!front && !roList.length && days > noRoDays) { findings.push('waiting_no_ro'); why.push(`${days} days since acquisition and no recon repair order opened.`); }
    if (front && open.length) { findings.push('open_ro_after_frontline'); why.push(`On the front line with ${open.length} repair order(s) still open: cost may still be added.`); }
    all.push({ stock_number: str(u.stock_number), vin: str(u.vin), acquired_date: acquired, frontline_date: front, days, budget, recon_cost: cost, repair_orders: roList.map((r) => str(r.ro_number)).sort(), open_repair_orders: open.length, findings, why: why.join(' ') });
  }
  const items = all.filter((r) => r.findings.length).sort(by('-days', 'stock_number'));
  const done = all.filter((r) => r.frontline_date);
  const has = (f) => all.filter((r) => r.findings.includes(f)).length;
  const orphans = [...byStock.keys()].filter((k) => !seen.has(k)).sort().map((k) => ({ stock_number: str(byStock.get(k)[0].stock_number), repair_orders: byStock.get(k).length, total: round2(byStock.get(k).reduce((s, r) => s + (num(r.total) || 0), 0)) }));
  return { as_of: today, units: all.length, skipped_sold: skipped, frontline: done.length, in_recon: all.length - done.length, average_days_to_frontline: done.length ? round2(done.reduce((s, r) => s + (r.days || 0), 0) / done.length) : null, target_days: targetDays, recon_cost: round2(all.reduce((s, r) => s + r.recon_cost, 0)), average_cost: all.length ? round2(all.reduce((s, r) => s + r.recon_cost, 0) / all.length) : 0, over_budget: has('over_budget'), slow: has('slow'), stuck: has('stuck'), waiting_no_ro: has('waiting_no_ro'), open_ro_after_frontline: has('open_ro_after_frontline'), repair_orders_without_a_unit: orphans, items };
}

export const line = (r) => `${r.units} unit(s): ${r.frontline} front-line ready (average ${r.average_days_to_frontline ?? '-'} days, target ${r.target_days}), ${r.in_recon} in recon. Recon cost ${r.recon_cost}. ${r.over_budget} over budget, ${r.slow} slow, ${r.stuck} stuck with open repair orders, ${r.waiting_no_ro} waiting with no repair order, ${r.open_ro_after_frontline} on the line with orders still open.`;
