// Service loaners and demonstrators against day and mileage limits, and loan agreements. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const FLEET_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Unit'], { required: true }),
  vin: t(['VIN', 'Serial Number']),
  use: t(['Use', 'Type', 'Fleet Type', 'Program']),
  in_service_date: t(['In Service Date', 'In Service', 'Put In Service', 'Loaner Date'], { type: 'date', required: true }),
  odometer: t(['Odometer', 'Current Miles', 'Mileage'], { type: 'number' }),
  odometer_in_service: t(['Odometer In Service', 'Start Miles', 'Miles In Service'], { type: 'number' }),
  status: t(['Status', 'Unit Status']),
});
export const AGREEMENT_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Unit'], { required: true }),
  out_date: t(['Out Date', 'Date Out', 'Loaned', 'Start'], { type: 'date', required: true }),
  return_date: t(['Return Date', 'Date In', 'Returned', 'End'], { type: 'date' }),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order']),
  customer: t(['Customer', 'Customer Name', 'Driver'], { pii: 'name' }),
});
const GONE = /retail|sold|wholesal|defleet|returned to/i;

export function checkFleet(fleet, agreements = [], { asOf, maxDays = 180, maxMiles = 6000, nearPct = 80, openDays = 14 } = {}) {
  const today = asOfDate(asOf);
  const ag = groupBy(agreements.filter((a) => normId(a.stock_number) && isoDate(a.out_date)), (a) => normId(a.stock_number));
  const seen = new Set(); const all = []; let skipped = 0;
  for (const u of [...fleet].filter((x) => normId(x.stock_number)).sort(by('stock_number'))) {
    const id = normId(u.stock_number); if (seen.has(id)) continue; seen.add(id);
    if (GONE.test(str(u.status))) { skipped++; continue; }
    const days = daysBetween(isoDate(u.in_service_date), today);
    const odo = num(u.odometer), start = num(u.odometer_in_service) ?? 0;
    const miles = odo === null ? null : round2(Math.max(0, odo - start));
    const open = (ag.get(id) || []).filter((a) => !isoDate(a.return_date)).sort(by('out_date'));
    const findings = []; const why = [];
    if (days !== null && days > maxDays) { findings.push('over_days'); why.push(`In service ${days} days, past ${maxDays}.`); }
    if (miles !== null && miles > maxMiles) { findings.push('over_miles'); why.push(`${miles} miles in service, past ${maxMiles}.`); }
    if (!findings.length && ((days !== null && days >= (maxDays * nearPct) / 100) || (miles !== null && miles >= (maxMiles * nearPct) / 100))) { findings.push('near_limit'); why.push(`${days} days and ${miles ?? '?'} miles: within ${100 - nearPct}% of a limit.`); }
    for (const a of open) {
      const out = daysBetween(isoDate(a.out_date), today);
      if (!str(a.ro_number)) { findings.push('loaner_out_no_ro'); why.push(`Out since ${isoDate(a.out_date)} with no repair order on the agreement.`); }
      else if (out > openDays) { findings.push('agreement_open_long'); why.push(`Out ${out} days on RO ${str(a.ro_number)}.`); }
    }
    all.push({ stock_number: str(u.stock_number), vin: str(u.vin), use: /demo/i.test(str(u.use)) ? 'demo' : 'loaner', in_service_date: isoDate(u.in_service_date), days_in_service: days, miles_in_service: miles, out_now: open.length > 0, customer: open.length ? str(open[0].customer) : '', findings, why: why.join(' ') });
  }
  const items = all.filter((r) => r.findings.length).sort(by('-days_in_service', 'stock_number'));
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  return { as_of: today, units: all.length, skipped_retailed: skipped, out_now: all.filter((r) => r.out_now).length, max_days: maxDays, max_miles: maxMiles, over_days: n('over_days'), over_miles: n('over_miles'), near_limit: n('near_limit'), loaner_out_no_ro: n('loaner_out_no_ro'), agreement_open_long: n('agreement_open_long'), items };
}

export const line = (r) => `${r.units} loaner and demo unit(s), ${r.out_now} out now. ${r.over_days} past ${r.max_days} days, ${r.over_miles} past ${r.max_miles} miles, ${r.near_limit} near a limit; ${r.loaner_out_no_ro} out with no repair order, ${r.agreement_open_long} out too long.`;
