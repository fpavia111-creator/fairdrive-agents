// Salesperson commissions from pay plans, against what was paid. Pure functions.
import { str, num, round2, normId, isoDate, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const DEAL_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  delivery_date: t(['Delivery Date', 'Deal Date', 'Sold Date'], { type: 'date' }),
  salesperson: t(['Salesperson', 'Sales Person', 'Salesperson 1', 'Sales Rep'], { required: true }),
  split_with: t(['Split With', 'Salesperson 2', 'Second Salesperson', 'Split']),
  customer: t(['Customer', 'Customer Name', 'Buyer'], { pii: 'name' }),
  sale_type: t(['Sale Type', 'New/Used', 'N/U']),
  front_gross: t(['Front Gross', 'Front End Gross', 'Front'], { type: 'money' }),
  back_gross: t(['Back Gross', 'Back End Gross', 'F&I Gross', 'Back'], { type: 'money' }),
});
export const PLAN_FIELDS = Object.freeze({
  salesperson: t(['Salesperson', 'Sales Person', 'Name', 'Employee'], { required: true }),
  front_pct: t(['Front %', 'Front Pct', 'Front Percent', 'Commission %'], { type: 'number', required: true }),
  back_pct: t(['Back %', 'Back Pct', 'Back Percent'], { type: 'number' }),
  mini: t(['Mini', 'Minimum', 'Flat Minimum', 'Mini Deal'], { type: 'money' }),
});
export const PAID_FIELDS = Object.freeze({
  salesperson: t(['Salesperson', 'Sales Person', 'Name', 'Employee'], { required: true }),
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  amount_paid: t(['Amount Paid', 'Paid', 'Commission Paid', 'Amount'], { type: 'money', required: true }),
});
const who = (v) => str(v).toLowerCase().replace(/\s+/g, ' ');

/** Commission on one deal for one plan and share: the greater of the mini and the percentages, times the share. */
export function commissionFor(deal, plan, share = 1) {
  const pctPart = ((num(plan.front_pct) || 0) * Math.max(0, num(deal.front_gross) || 0) + (num(plan.back_pct) || 0) * Math.max(0, num(deal.back_gross) || 0)) / 100;
  return round2(Math.max(num(plan.mini) || 0, pctPart) * share);
}

export function computeCommissions(deals, plans, paid = null, { tolerance = 1 } = {}) {
  const planOf = new Map(plans.filter((p) => who(p.salesperson)).map((p) => [who(p.salesperson), p]));
  const names = new Map(); for (const n of [...deals.flatMap((d) => [d.salesperson, d.split_with]), ...plans.map((p) => p.salesperson), ...(paid || []).map((p) => p.salesperson)].map(str).filter(Boolean).sort()) if (!names.has(who(n))) names.set(who(n), n);
  const paidMap = new Map(); for (const p of paid || []) { const k = `${who(p.salesperson)}|${normId(p.deal_number)}`; paidMap.set(k, round2((paidMap.get(k) || 0) + (num(p.amount_paid) || 0))); }
  const rows = []; const seen = new Set();
  for (const d of [...deals].filter((x) => normId(x.deal_number) && who(x.salesperson)).sort(by('deal_number'))) {
    const id = normId(d.deal_number); if (seen.has(id)) continue; seen.add(id);
    const people = [...new Set([who(d.salesperson), who(d.split_with)].filter(Boolean))]; const share = 1 / people.length;
    for (const p of people) {
      const plan = planOf.get(p); const comp = plan ? commissionFor(d, plan, share) : null;
      const k = `${p}|${id}`; const got = paidMap.has(k) ? paidMap.get(k) : null; paidMap.delete(k);
      let finding = null, why = '';
      if (!plan) { finding = 'no_plan'; why = 'No pay plan for this salesperson in the plan file.'; }
      else if (paid && got === null) { finding = 'unpaid'; why = `${comp} computed; nothing paid.`; }
      else if (paid && comp - got > tolerance) { finding = 'underpaid'; why = `${comp} computed; ${got} paid.`; }
      else if (paid && got - comp > tolerance) { finding = 'overpaid'; why = `${comp} computed; ${got} paid.`; }
      rows.push({ salesperson: names.get(p), deal_number: str(d.deal_number), delivery_date: isoDate(d.delivery_date), customer: str(d.customer), share: round2(share), front_gross: round2((num(d.front_gross) || 0) * share), back_gross: round2((num(d.back_gross) || 0) * share), commission: comp, paid: got, difference: comp !== null && got !== null ? round2(got - comp) : null, finding, why });
    }
  }
  const orphans = [...paidMap].sort().map(([k, v]) => ({ salesperson: names.get(k.split('|')[0]), deal_number: k.split('|')[1], delivery_date: null, customer: '', share: null, front_gross: null, back_gross: null, commission: null, paid: v, difference: null, finding: 'paid_without_deal', why: 'Commission paid on a deal not in the deal file (or not this salesperson).' }));
  const items = [...rows.filter((r) => r.finding), ...orphans];
  const people = [...groupBy(rows, (r) => r.salesperson)].map(([salesperson, l]) => ({ salesperson, units: round2(l.reduce((s, r) => s + r.share, 0)), front_gross: round2(l.reduce((s, r) => s + r.front_gross, 0)), back_gross: round2(l.reduce((s, r) => s + r.back_gross, 0)), commission: l.some((r) => r.commission === null) ? null : round2(l.reduce((s, r) => s + r.commission, 0)), paid: paid ? round2(l.reduce((s, r) => s + (r.paid || 0), 0)) : null })).map((x) => ({ ...x, difference: x.commission !== null && x.paid !== null ? round2(x.paid - x.commission) : null })).sort(by('salesperson'));
  const n = (f) => items.filter((i) => i.finding === f);
  return { deals: seen.size, salespeople: people.length, commission: round2(rows.reduce((s, r) => s + (r.commission || 0), 0)), paid_checked: !!paid, paid: paid ? round2(rows.reduce((s, r) => s + (r.paid || 0), 0)) : null, underpaid: n('underpaid').length, underpaid_amount: round2(n('underpaid').reduce((s, i) => s + (i.commission - i.paid), 0)), overpaid: n('overpaid').length, unpaid: n('unpaid').length, unpaid_amount: round2(n('unpaid').reduce((s, i) => s + i.commission, 0)), no_plan: n('no_plan').length, paid_without_deal: orphans.length, by_salesperson: people, lines: rows, items };
}

export const line = (r) => `${r.deals} deal(s), ${r.salespeople} salesperson(s): ${r.commission} commission by the pay plans.${r.paid_checked ? ` ${r.paid} paid; ${r.underpaid} underpaid (${r.underpaid_amount}), ${r.overpaid} overpaid, ${r.unpaid} unpaid (${r.unpaid_amount}), ${r.paid_without_deal} paid with no deal.` : ''}${r.no_plan ? ` ${r.no_plan} deal line(s) with no pay plan.` : ''}`;

export function sheetText(rows, { salesperson, period, from }) {
  const total = round2(rows.reduce((s, r) => s + (r.commission || 0), 0));
  return { total, text: [`# Commission sheet: ${salesperson}${period ? `, ${period}` : ''}`, '', `**Prepared by:** ${from || '[TO CONFIRM your name]'}`, '',
    '| Deal | Delivered | Share | Front gross | Back gross | Commission |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.deal_number} | ${r.delivery_date || ''} | ${r.share} | ${r.front_gross} | ${r.back_gross} | ${r.commission ?? '[MISSING pay plan]'} |`), '',
    `**Total commission:** ${total}`, '', '[CHECK the pay plan, spiffs, draws and chargebacks before this goes to payroll]'].join('\n') };
}
