// DMS schedules tied to the ledger and aged by control number. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, ageBucket, bucketLabels, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DETAIL_FIELDS = Object.freeze({
  schedule: t(['Schedule', 'Schedule Number', 'Sched', 'Account'], { required: true }),
  control_number: t(['Control Number', 'Control', 'Control #', 'Reference'], { required: true }),
  description: t(['Description', 'Desc', 'Memo', 'Name']),
  date: t(['Date', 'Posting Date', 'Post Date', 'Doc Date'], { type: 'date' }),
  amount: t(['Amount', 'Balance', 'Net Amount'], { type: 'money', required: true }),
});
export const BALANCE_FIELDS = Object.freeze({
  schedule: t(['Schedule', 'Schedule Number', 'Account', 'GL Account'], { required: true }),
  schedule_name: t(['Schedule Name', 'Account Name', 'Description', 'Name']),
  gl_balance: t(['GL Balance', 'Balance', 'Ledger Balance', 'Ending Balance'], { type: 'money', required: true }),
});
const RECEIVABLE = /receiv|in transit|\bcit\b|warranty|factory|rebate|holdback/i;

export function ageSchedules(detail, balances, { asOf, edges = [30, 60, 90], tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const bal = new Map(balances.filter((b) => normId(b.schedule)).map((b) => [normId(b.schedule), b]));
  const bySched = groupBy(detail.filter((d) => normId(d.schedule) && normId(d.control_number)), (d) => normId(d.schedule));
  const items = []; const schedules = [];
  for (const k of [...new Set([...bySched.keys(), ...bal.keys()])].sort()) {
    const lines = bySched.get(k) || []; const b = bal.get(k);
    const name = b ? str(b.schedule_name) : ''; const receivable = RECEIVABLE.test(name);
    const total = round2(lines.reduce((s, x) => s + (num(x.amount) || 0), 0));
    const gl = b ? num(b.gl_balance) ?? 0 : null;
    const controls = [...groupBy(lines, (x) => normId(x.control_number))].map(([, l]) => { const net = round2(l.reduce((s, x) => s + (num(x.amount) || 0), 0)); const oldest = l.map((x) => isoDate(x.date)).filter(Boolean).sort()[0] || null; const age = oldest ? daysBetween(oldest, today) : null; return { control_number: str(l[0].control_number), description: str(l[0].description), lines: l.length, net, oldest, age, bucket: ageBucket(age, edges) }; }).sort(by('control_number'));
    const open = controls.filter((c) => Math.abs(c.net) > tolerance);
    const schedLabel = str((lines[0] || b).schedule);
    schedules.push({ schedule: schedLabel, schedule_name: name, gl_balance: gl, detail_total: total, difference: gl === null ? null : round2(total - gl), open_controls: open.length, over_90: round2(open.filter((c) => c.age !== null && c.age > edges.at(-1)).reduce((s, c) => s + c.net, 0)), ...Object.fromEntries(bucketLabels(edges).map((x) => [`age_${x}`, round2(open.filter((c) => c.bucket === x).reduce((s, c) => s + c.net, 0))])) });
    const base = { schedule: schedLabel, schedule_name: name };
    if (gl === null) items.push({ ...base, control_number: '', finding: 'no_gl_balance', amount: total, age: null, why: 'Detail for a schedule with no ledger balance in the balances file.' });
    else if (Math.abs(round2(total - gl)) > tolerance) items.push({ ...base, control_number: '', finding: 'out_of_balance', amount: round2(total - gl), age: null, why: `Detail adds up to ${total}; the ledger shows ${gl}. Something was posted to the account without a control number, or to the wrong schedule.` });
    for (const c of controls) {
      if (Math.abs(c.net) <= tolerance && c.lines > 1) items.push({ ...base, control_number: c.control_number, finding: 'zero_balance_control', amount: 0, age: c.age, why: `${c.lines} lines net to zero; ready to clear from the schedule.` });
      else if (Math.abs(c.net) > tolerance && c.age !== null && c.age > edges.at(-1)) items.push({ ...base, control_number: c.control_number, finding: 'over_90_days', amount: c.net, age: c.age, why: `Open ${c.age} days.` });
      if (receivable && c.net < -tolerance) items.push({ ...base, control_number: c.control_number, finding: 'credit_balance', amount: c.net, age: c.age, why: `A credit of ${c.net} on a receivable schedule: paid twice, posted to the wrong control, or a debit still to come.` });
    }
  }
  const rank = { out_of_balance: 0, no_gl_balance: 1, over_90_days: 2, credit_balance: 3, zero_balance_control: 4 };
  items.sort((a, b) => rank[a.finding] - rank[b.finding] || Math.abs(b.amount) - Math.abs(a.amount) || (a.schedule + a.control_number < b.schedule + b.control_number ? -1 : 1));
  const n = (f) => items.filter((i) => i.finding === f);
  return { as_of: today, schedules: schedules.length, out_of_balance: n('out_of_balance').length + n('no_gl_balance').length, open_total: round2(schedules.reduce((s, x) => s + x.detail_total, 0)), over_90_controls: n('over_90_days').length, over_90_amount: round2(n('over_90_days').reduce((s, i) => s + i.amount, 0)), zero_balance_controls: n('zero_balance_control').length, credit_balances: n('credit_balance').length, by_schedule: schedules, items };
}

export const line = (r) => `${r.schedules} schedule(s), ${r.open_total} in detail. ${r.out_of_balance} out of balance with the ledger; ${r.over_90_controls} control(s) open over 90 days (${r.over_90_amount}); ${r.credit_balances} credit balance(s) on receivables; ${r.zero_balance_controls} control(s) netting to zero, ready to clear.`;
