// Comebacks: the same vehicle back within days and miles for the same operation or concern. Pure functions.
import { str, num, round2, pct, normId, normVin, isoDate, daysBetween, groupBy, tally, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const RO_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order', 'Invoice'], { required: true }),
  vin: t(['VIN', 'Vehicle VIN', 'Serial Number'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Name'], { pii: 'name' }),
  opened: t(['Opened', 'Open Date', 'RO Date', 'Date In'], { type: 'date', required: true }),
  closed: t(['Closed', 'Close Date', 'Closed Date'], { type: 'date' }),
  odometer: t(['Odometer', 'Mileage In', 'Miles In', 'Mileage'], { type: 'number' }),
  technician: t(['Technician', 'Tech', 'Tech Name']),
  op_code: t(['Op Code', 'Operation', 'Labor Op', 'Op']),
  concern: t(['Concern', 'Complaint', 'Customer Concern', 'Description']),
  labor_type: t(['Labor Type', 'Pay Type', 'Type']),
});
const STOP = new Set(['the', 'and', 'with', 'from', 'when', 'again', 'still', 'customer', 'states', 'check', 'please', 'vehicle', 'car', 'noise', 'front', 'rear', 'left', 'right', 'side', 'into', 'over', 'have', 'that', 'this', 'came', 'back']);
export const words = (s) => new Set(str(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w)));
/** Two visits are about the same thing: the same op code, or two or more significant concern words in common. */
export function sameWork(a, b) {
  const oa = normId(a.op_code), ob = normId(b.op_code);
  if (oa && oa === ob) return 'same_op_code';
  const wa = words(a.concern), wb = words(b.concern);
  return [...wa].filter((w) => wb.has(w)).length >= 2 ? 'same_concern' : null;
}

export function findComebacks(ros, { days = 30, miles = 1000 } = {}) {
  const seen = new Set(); const list = [];
  for (const r of [...ros].filter((x) => normId(x.ro_number) && normVin(x.vin) && isoDate(x.opened)).sort(by('opened', 'ro_number'))) { const id = normId(r.ro_number); if (seen.has(id)) continue; seen.add(id); list.push(r); }
  const items = [];
  for (const [, visits] of groupBy(list, (r) => normVin(r.vin))) {
    for (let j = 1; j < visits.length; j++) {
      const back = visits[j];
      for (let i = j - 1; i >= 0; i--) {
        const first = visits[i];
        if (/intern/i.test(str(first.labor_type))) continue;
        const from = isoDate(first.closed) || isoDate(first.opened);
        const d = daysBetween(from, isoDate(back.opened)); if (d === null || d > days) break;
        const m = num(back.odometer) !== null && num(first.odometer) !== null ? round2(num(back.odometer) - num(first.odometer)) : null;
        if (m !== null && m > miles) continue;
        const how = sameWork(first, back); if (!how) continue;
        items.push({ vin: normVin(back.vin), customer: str(back.customer), first_ro: str(first.ro_number), first_date: isoDate(first.opened), technician: str(first.technician) || '(none)', op_code: str(first.op_code), concern: str(first.concern), return_ro: str(back.ro_number), return_date: isoDate(back.opened), days: d, miles: m, matched_by: how, why: `Back after ${d} day(s)${m !== null ? ` and ${m} miles` : ''} for ${how === 'same_op_code' ? `the same operation (${str(first.op_code)})` : 'the same concern'}.` });
        break;
      }
    }
  }
  items.sort(by('return_date', 'return_ro'));
  return { repair_orders: list.length, comebacks: items.length, comeback_pct: pct(items.length, list.length) ?? 0, days, miles, by_technician: tally(items, (i) => i.technician, 'technician').map((x) => ({ technician: x.technician, comebacks: x.count })), by_op_code: tally(items, (i) => i.op_code || '(none)', 'op_code').map((x) => ({ op_code: x.op_code, comebacks: x.count })), items };
}

export const line = (r) => `${r.repair_orders} repair order(s), ${r.comebacks} comeback(s) within ${r.days} days and ${r.miles} miles (${r.comeback_pct}%).${r.by_technician.length ? ` Most: ${r.by_technician[0].technician} (${r.by_technician[0].comebacks}).` : ''}`;
