// Curtailments: the principal pay-downs a floorplan schedule asks for, overdue and coming due. Pure functions.
import { str, num, round2, normVin, isoDate, daysBetween, addDays, asOfDate, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const UNIT_FIELDS = Object.freeze({
  vin: t(['VIN', 'Serial Number', 'Collateral'], { required: true }),
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Dealer Stock']),
  floor_date: t(['Floor Date', 'Floored Date', 'Funding Date', 'Date Floored'], { type: 'date', required: true }),
  original_amount: t(['Original Amount', 'Amount Floored', 'Original Principal', 'Advance'], { type: 'money', required: true }),
  balance: t(['Principal Balance', 'Current Balance', 'Balance', 'Outstanding'], { type: 'money', required: true }),
  new_used: t(['New/Used', 'N/U', 'Type', 'Collateral Type']),
});
// Working defaults, not any lender's terms: 10% at 91, 181 and 271 days and payoff at 361 on new
// units; 10% at 61 and 121 days and payoff at 181 on used units.
export const DEFAULT_NEW = Object.freeze([{ day: 91, pct: 10 }, { day: 181, pct: 10 }, { day: 271, pct: 10 }, { day: 361, pct: 100 }]);
export const DEFAULT_USED = Object.freeze([{ day: 61, pct: 10 }, { day: 121, pct: 10 }, { day: 181, pct: 100 }]);
const isUsed = (v) => /used|pre-?owned|\bu\b|cpo/i.test(str(v));

/** Curtailment position of one unit on a date. */
export function position(u, schedule, today) {
  const orig = num(u.original_amount) ?? 0, bal = num(u.balance) ?? 0, floored = isoDate(u.floor_date);
  const age = daysBetween(floored, today);
  const steps = [...schedule].sort((a, b) => a.day - b.day);
  const cum = (n) => Math.min(100, steps.filter((s) => s.day <= n).reduce((s, x) => s + x.pct, 0));
  const paid = round2(Math.max(0, orig - bal));
  const requiredNow = round2((orig * cum(age ?? 0)) / 100);
  const overdue = round2(Math.max(0, requiredNow - paid));
  const next = steps.find((s) => s.day > (age ?? 0) && cum(s.day) > cum(age ?? 0));
  const nextAmount = next ? round2(Math.max(0, (orig * cum(next.day)) / 100 - Math.max(paid, requiredNow))) : 0;
  return { age_days: age, paid, required_now: requiredNow, overdue, next_date: next && floored ? addDays(floored, next.day) : null, next_amount: nextAmount, past_last_step: !!steps.length && (age ?? 0) >= steps.at(-1).day };
}

/** Overdue curtailments and those coming due within the horizon, with totals by week. */
export function scheduleCurtailments(units, { asOf, schedule = DEFAULT_NEW, usedSchedule = DEFAULT_USED, weeks = 4, tolerance = 1 } = {}) {
  const today = asOfDate(asOf); const end = addDays(today, weeks * 7 - 1);
  const items = []; const seen = new Set(); let balance = 0;
  for (const u of [...units].filter((x) => normVin(x.vin) && isoDate(x.floor_date)).sort(by('floor_date', 'vin'))) {
    const v = normVin(u.vin); if (seen.has(v)) continue; seen.add(v);
    balance += num(u.balance) ?? 0;
    const used = isUsed(u.new_used);
    const p = position(u, used ? usedSchedule : schedule, today);
    const base = { vin: v, stock_number: str(u.stock_number), new_used: used ? 'used' : 'new', floor_date: isoDate(u.floor_date), original_amount: num(u.original_amount), balance: num(u.balance), ...p };
    if (p.overdue > tolerance) items.push({ ...base, finding: 'overdue', amount: p.overdue, due_date: null, why: p.past_last_step ? `Floored ${p.age_days} days ago, past the last step of the schedule: the whole balance (${p.overdue}) is due.` : `${p.required_now} should have been paid down by now; ${p.paid} has been. ${p.overdue} is overdue.` });
    if (p.next_date && p.next_date <= end && p.next_amount > tolerance) items.push({ ...base, finding: 'due_soon', amount: p.next_amount, due_date: p.next_date, why: `${p.next_amount} falls due on ${p.next_date}.` });
  }
  items.sort((a, b) => (a.finding === b.finding ? 0 : a.finding === 'overdue' ? -1 : 1) || (a.due_date || '') .localeCompare(b.due_date || '') || b.amount - a.amount || (a.vin < b.vin ? -1 : 1));
  const byWeek = Array.from({ length: weeks }, (_, k) => { const from = addDays(today, k * 7), to = addDays(today, k * 7 + 6); const l = items.filter((i) => i.finding === 'due_soon' && i.due_date >= from && i.due_date <= to); return { week_from: from, week_to: to, units: l.length, amount: round2(l.reduce((s, i) => s + i.amount, 0)) }; });
  const sumOf = (f) => round2(items.filter((i) => i.finding === f).reduce((s, i) => s + i.amount, 0));
  return { as_of: today, units: seen.size, balance: round2(balance), overdue_units: items.filter((i) => i.finding === 'overdue').length, overdue_amount: sumOf('overdue'), due_soon_units: items.filter((i) => i.finding === 'due_soon').length, due_soon_amount: sumOf('due_soon'), weeks, by_week: byWeek, items };
}

export const line = (r) => `${r.units} floored unit(s), ${r.balance} outstanding. ${r.overdue_units} with curtailments overdue (${r.overdue_amount}); ${r.due_soon_units} coming due in the next ${r.weeks} week(s) (${r.due_soon_amount}).`;
