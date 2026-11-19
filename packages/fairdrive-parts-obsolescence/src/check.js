// Parts obsolescence: months since last sale, value by class, returnable stock first. Pure functions.
import { str, num, round2, pct, normId, isoDate, daysBetween, asOfDate, yes, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const PART_FIELDS = Object.freeze({
  part_number: t(['Part Number', 'Part No', 'Part #', 'Part'], { required: true }),
  description: t(['Description', 'Part Description', 'Desc']),
  on_hand: t(['On Hand', 'QOH', 'Qty On Hand', 'Quantity'], { type: 'number', required: true }),
  unit_cost: t(['Unit Cost', 'Cost', 'Dealer Cost', 'Avg Cost'], { type: 'money', required: true }),
  last_sale_date: t(['Last Sale', 'Last Sale Date', 'Last Sold', 'Date Last Sold'], { type: 'date' }),
  last_receipt_date: t(['Last Receipt', 'Last Received', 'Date Last Received'], { type: 'date' }),
  returnable: t(['Returnable', 'Return Eligible', 'RIM Eligible'], { type: 'bool' }),
  source: t(['Source', 'Source Code', 'Supplier']),
});
export const CLASSES = Object.freeze(['active', 'slow', 'obsolete_candidate', 'obsolete']);

/** Class every part with stock by months since its last sale (or receipt when never sold). */
export function classifyParts(parts, { asOf, monthEdges = [6, 9, 12] } = {}) {
  const today = asOfDate(asOf); const [a, b, c] = monthEdges;
  const seen = new Set(); const all = [];
  for (const p of [...parts].filter((x) => normId(x.part_number)).sort(by('part_number'))) {
    const id = normId(p.part_number); if (seen.has(id)) continue; seen.add(id);
    const qty = num(p.on_hand) ?? 0; if (qty <= 0) continue;
    const since = isoDate(p.last_sale_date) || isoDate(p.last_receipt_date);
    const months = since ? round2(daysBetween(since, today) / 30.44) : null;
    const cls = months === null ? 'obsolete' : months <= a ? 'active' : months <= b ? 'slow' : months <= c ? 'obsolete_candidate' : 'obsolete';
    const value = round2(qty * (num(p.unit_cost) ?? 0));
    all.push({ part_number: str(p.part_number), description: str(p.description), on_hand: qty, unit_cost: num(p.unit_cost), value, last_sale_date: isoDate(p.last_sale_date), last_receipt_date: isoDate(p.last_receipt_date), months_idle: months, never_sold: !isoDate(p.last_sale_date), class: cls, returnable: yes(p.returnable) === true, source: str(p.source) });
  }
  const total = round2(all.reduce((s, p) => s + p.value, 0));
  const byClass = CLASSES.map((k) => { const l = all.filter((p) => p.class === k); return { class: k, parts: l.length, value: round2(l.reduce((s, p) => s + p.value, 0)) }; });
  const items = all.filter((p) => p.class !== 'active').sort(by('-value', 'part_number'));
  const obsolete = byClass.find((x) => x.class === 'obsolete').value;
  return { as_of: today, parts: all.length, value: total, obsolete_value: obsolete, obsolete_pct: pct(obsolete, total) ?? 0, returnable_value: round2(items.filter((p) => p.returnable).reduce((s, p) => s + p.value, 0)), never_sold: items.filter((p) => p.never_sold).length, month_edges: monthEdges, by_class: byClass, items };
}

export const line = (r) => `${r.parts} part number(s) on hand, ${r.value} at cost. Obsolete ${r.obsolete_value} (${r.obsolete_pct}%); ${r.items.length} part number(s) idle past ${r.month_edges[0]} months, ${r.returnable_value} of them returnable; ${r.never_sold} never sold.`;
