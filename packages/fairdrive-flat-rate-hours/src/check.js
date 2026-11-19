// Technician flagged hours against clocked attendance and time punched on repair orders. Pure functions.
import { str, num, round2, pct, normId, isoDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const FLAG_FIELDS = Object.freeze({
  technician: t(['Technician', 'Tech', 'Tech Name', 'Technician Name', 'Tech #'], { required: true }),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order'], { required: true }),
  date: t(['Date', 'Flag Date', 'Closed Date', 'Work Date'], { type: 'date', required: true }),
  labor_type: t(['Labor Type', 'Pay Type', 'Type', 'Labor Code']),
  flag_hours: t(['Flag Hours', 'Flagged Hours', 'Sold Hours', 'Hours Flagged', 'Flagged'], { type: 'number', required: true }),
  actual_hours: t(['Actual Hours', 'Clocked On RO', 'Punch Hours', 'Time On Job', 'Actual'], { type: 'number' }),
});
export const CLOCK_FIELDS = Object.freeze({
  technician: t(['Technician', 'Tech', 'Employee', 'Name', 'Tech Name'], { required: true }),
  date: t(['Date', 'Work Date', 'Shift Date'], { type: 'date', required: true }),
  clock_hours: t(['Clock Hours', 'Hours Clocked', 'Attendance Hours', 'Hours', 'Total Hours'], { type: 'number', required: true }),
});
const who = (v) => str(v).toLowerCase().replace(/\s+/g, ' ');

export function checkFlatRate(flags, clock, { floorPct = 85, ratio = 3, minFlag = 0.5 } = {}) {
  const f = flags.filter((x) => who(x.technician) && isoDate(x.date)).sort(by('date', 'ro_number', 'technician'));
  const c = clock.filter((x) => who(x.technician) && isoDate(x.date));
  const names = new Map(); for (const n of [...f, ...c].map((x) => str(x.technician)).sort()) if (!names.has(who(n))) names.set(who(n), n);
  const attendance = new Map(); for (const x of c) { const k = `${who(x.technician)}|${isoDate(x.date)}`; attendance.set(k, round2((attendance.get(k) || 0) + (num(x.clock_hours) || 0))); }
  const items = []; const seenLine = new Set();
  const lines = [];
  for (const x of f) { const k = `${who(x.technician)}|${normId(x.ro_number)}|${isoDate(x.date)}|${num(x.flag_hours)}|${str(x.labor_type)}`; if (seenLine.has(k)) continue; seenLine.add(k); lines.push(x); }
  for (const x of lines) {
    const fl = num(x.flag_hours) ?? 0, act = num(x.actual_hours);
    const base = { technician: names.get(who(x.technician)), ro_number: str(x.ro_number), date: isoDate(x.date), labor_type: str(x.labor_type), flag_hours: fl, actual_hours: act };
    if (fl > 0 && !act) items.push({ ...base, finding: 'flagged_no_time', why: `${fl} hours flagged with no time punched on the job.` });
    else if (fl >= minFlag && act && fl >= ratio * act) items.push({ ...base, finding: 'flag_far_above_time', why: `${fl} hours flagged against ${act} punched (${round2(fl / act)} times).` });
  }
  const flaggedDays = groupBy(lines, (x) => `${who(x.technician)}|${isoDate(x.date)}`);
  for (const [k, l] of [...flaggedDays].sort()) if (!attendance.get(k)) items.push({ technician: names.get(k.split('|')[0]), ro_number: l.map((x) => str(x.ro_number)).sort().join(' / '), date: k.split('|')[1], labor_type: '', flag_hours: round2(l.reduce((s, x) => s + (num(x.flag_hours) || 0), 0)), actual_hours: null, finding: 'flags_without_clock', why: 'Hours flagged on a day with no attendance clocked.' });
  const techs = [...names.keys()].sort().map((k) => {
    const mine = lines.filter((x) => who(x.technician) === k);
    const att = round2([...attendance].filter(([key]) => key.startsWith(`${k}|`)).reduce((s, [, v]) => s + v, 0));
    const flagged = round2(mine.reduce((s, x) => s + (num(x.flag_hours) || 0), 0)), actual = round2(mine.reduce((s, x) => s + (num(x.actual_hours) || 0), 0));
    return { technician: names.get(k), attendance_hours: att, flagged_hours: flagged, actual_hours: actual, proficiency_pct: pct(flagged, att), efficiency_pct: pct(flagged, actual), productivity_pct: pct(actual, att) };
  });
  for (const tch of techs) if (tch.proficiency_pct !== null && tch.proficiency_pct < floorPct) items.push({ technician: tch.technician, ro_number: '', date: null, labor_type: '', flag_hours: tch.flagged_hours, actual_hours: tch.actual_hours, finding: 'below_proficiency_floor', why: `Flagged ${tch.flagged_hours} of ${tch.attendance_hours} hours clocked (${tch.proficiency_pct}%), under the ${floorPct}% floor.` });
  const rank = { flagged_no_time: 0, flag_far_above_time: 1, flags_without_clock: 2, below_proficiency_floor: 3 };
  items.sort((a, b) => rank[a.finding] - rank[b.finding] || (a.technician < b.technician ? -1 : a.technician > b.technician ? 1 : 0) || ((a.date || '') < (b.date || '') ? -1 : 1));
  const tot = (k) => round2(techs.reduce((s, x) => s + x[k], 0));
  const n = (k) => items.filter((i) => i.finding === k).length;
  return { technicians: techs.length, attendance_hours: tot('attendance_hours'), flagged_hours: tot('flagged_hours'), actual_hours: tot('actual_hours'), shop_proficiency_pct: pct(tot('flagged_hours'), tot('attendance_hours')), floor_pct: floorPct, flagged_no_time: n('flagged_no_time'), flag_far_above_time: n('flag_far_above_time'), flags_without_clock: n('flags_without_clock'), below_floor: n('below_proficiency_floor'), by_technician: techs, items };
}

export const line = (r) => `${r.technicians} technician(s): ${r.flagged_hours} hours flagged, ${r.attendance_hours} clocked, ${r.actual_hours} punched on jobs; shop proficiency ${r.shop_proficiency_pct}%. ${r.below_floor} under the ${r.floor_pct}% floor; ${r.flagged_no_time} job(s) flagged with no time, ${r.flag_far_above_time} flagged far above time, ${r.flags_without_clock} day(s) flagged with no clock-in.`;
