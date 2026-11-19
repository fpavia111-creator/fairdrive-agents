// Labor and parts gross profit on closed repair orders, by pay type and advisor. Pure functions.
import { str, num, round2, pct, normId, isoDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const RO_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order', 'Invoice'], { required: true }),
  closed_date: t(['Closed Date', 'Close Date', 'Closed', 'Invoice Date'], { type: 'date' }),
  advisor: t(['Advisor', 'Service Advisor', 'Writer', 'SA']),
  customer: t(['Customer', 'Customer Name', 'Name'], { pii: 'name' }),
  labor_type: t(['Labor Type', 'Pay Type', 'Type', 'Payment Type']),
  labor_sale: t(['Labor Sale', 'Labor Sales', 'Labor', 'Labor Amount'], { type: 'money' }),
  labor_cost: t(['Labor Cost', 'Tech Cost', 'Labor Cost Amount'], { type: 'money' }),
  parts_sale: t(['Parts Sale', 'Parts Sales', 'Parts', 'Parts Amount'], { type: 'money' }),
  parts_cost: t(['Parts Cost', 'Parts Cost Amount'], { type: 'money' }),
});
export const payType = (v) => { const s = str(v).toLowerCase(); return /warr|^w$/.test(s) ? 'warranty' : /intern|^i$|policy|recon/.test(s) ? 'internal' : 'customer_pay'; };
const sumOf = (l, k) => round2(l.reduce((s, x) => s + (num(x[k]) || 0), 0));
const block = (l) => { const ls = sumOf(l, 'labor_sale'), lc = sumOf(l, 'labor_cost'), ps = sumOf(l, 'parts_sale'), pc = sumOf(l, 'parts_cost'); return { labor_sale: ls, labor_cost: lc, labor_gp: round2(ls - lc), labor_gp_pct: pct(ls - lc, ls), parts_sale: ps, parts_cost: pc, parts_gp: round2(ps - pc), parts_gp_pct: pct(ps - pc, ps) }; };

export function checkMargins(rows, { laborFloor = 65, partsFloor = 30 } = {}) {
  const lines = rows.filter((r) => normId(r.ro_number));
  const groups = groupBy(lines, (r) => `${normId(r.ro_number)}|${payType(r.labor_type)}`);
  const items = [];
  for (const [k, l] of [...groups].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const type = k.split('|')[1]; const b = block(l);
    const findings = []; const why = [];
    if (type === 'customer_pay') {
      if (b.labor_sale > 0 && b.labor_gp_pct < laborFloor) { findings.push('labor_gp_below_floor'); why.push(`Customer-pay labor gross ${b.labor_gp_pct}%, floor ${laborFloor}%.`); }
      if (b.labor_sale <= 0 && b.labor_cost > 0) { findings.push('labor_given_away'); why.push(`Customer-pay labor cost ${b.labor_cost} with no labor sold.`); }
      if (b.parts_sale > 0 && b.parts_sale >= b.parts_cost && b.parts_gp_pct < partsFloor) { findings.push('parts_gp_below_floor'); why.push(`Customer-pay parts gross ${b.parts_gp_pct}%, floor ${partsFloor}%.`); }
    }
    if (b.parts_cost > 0 && b.parts_sale < b.parts_cost) { findings.push('parts_below_cost'); why.push(`Parts sold for ${b.parts_sale} against ${b.parts_cost} cost.`); }
    if (findings.length) items.push({ ro_number: str(l[0].ro_number), pay_type: type, closed_date: l.map((x) => isoDate(x.closed_date)).filter(Boolean).sort().pop() || null, advisor: str(l[0].advisor), customer: str(l[0].customer), ...b, findings, why: why.join(' ') });
  }
  items.sort(by('ro_number', 'pay_type'));
  const byType = ['customer_pay', 'warranty', 'internal'].map((tp) => ({ pay_type: tp, repair_orders: new Set(lines.filter((r) => payType(r.labor_type) === tp).map((r) => normId(r.ro_number))).size, ...block(lines.filter((r) => payType(r.labor_type) === tp)) }));
  const cp = lines.filter((r) => payType(r.labor_type) === 'customer_pay');
  const byAdvisor = [...groupBy(cp, (r) => str(r.advisor) || '(none)')].map(([advisor, l]) => ({ advisor, repair_orders: new Set(l.map((r) => normId(r.ro_number))).size, ...block(l) })).sort(by('advisor'));
  const n = (f) => items.filter((i) => i.findings.includes(f)).length;
  const c = byType[0];
  return { repair_orders: new Set(lines.map((r) => normId(r.ro_number))).size, customer_pay_labor_gp_pct: c.labor_gp_pct, customer_pay_parts_gp_pct: c.parts_gp_pct, labor_floor: laborFloor, parts_floor: partsFloor, labor_below_floor: n('labor_gp_below_floor'), parts_below_floor: n('parts_gp_below_floor'), labor_given_away: n('labor_given_away'), parts_below_cost: n('parts_below_cost'), by_pay_type: byType, by_advisor: byAdvisor, items };
}

export const line = (r) => `${r.repair_orders} repair order(s). Customer-pay labor gross ${r.customer_pay_labor_gp_pct}%, parts ${r.customer_pay_parts_gp_pct}%. ${r.labor_below_floor} under the ${r.labor_floor}% labor floor, ${r.parts_below_floor} under the ${r.parts_floor}% parts floor, ${r.labor_given_away} with customer-pay labor given away, ${r.parts_below_cost} with parts sold below cost.`;
