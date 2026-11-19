// Service contracts sold against their remittances to the provider. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, addDays, asOfDate, partyKey, groupBy, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const SOLD_FIELDS = Object.freeze({
  deal_number: t(['Deal No', 'Deal Number', 'Deal #'], { required: true }),
  customer: t(['Customer', 'Customer Name', 'Contract Holder', 'Buyer'], { pii: 'name' }),
  contract_number: t(['Contract Number', 'Contract #', 'Certificate', 'Agreement Number']),
  provider: t(['Provider', 'Administrator', 'Company', 'Obligor'], { required: true }),
  sale_date: t(['Sale Date', 'Contract Date', 'Deal Date'], { type: 'date', required: true }),
  dealer_cost: t(['Dealer Cost', 'Remit Amount', 'Cost', 'Net Remit'], { type: 'money', required: true }),
});
export const REMIT_FIELDS = Object.freeze({
  contract_number: t(['Contract Number', 'Contract #', 'Certificate', 'Agreement Number']),
  deal_number: t(['Deal No', 'Deal Number', 'Deal #', 'Reference']),
  provider: t(['Provider', 'Administrator', 'Payee', 'Vendor']),
  remit_date: t(['Remit Date', 'Paid Date', 'Check Date', 'Date'], { type: 'date' }),
  amount: t(['Amount', 'Remitted', 'Amount Paid', 'Check Amount'], { type: 'money', required: true }),
});

export function checkRemittances(sold, remits, { asOf, remitDays = 30, dueSoonDays = 7, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const lines = [...remits].filter((r) => normId(r.contract_number) || normId(r.deal_number)).sort(by('remit_date', 'contract_number', 'deal_number', 'amount')).map((r) => ({ c: normId(r.contract_number), d: normId(r.deal_number), p: partyKey(r.provider), amount: num(r.amount) ?? 0, date: isoDate(r.remit_date), raw: r, used: false }));
  const seen = new Set(); const items = []; let cost = 0, remitted = 0;
  for (const s of [...sold].filter((x) => normId(x.deal_number)).sort(by('sale_date', 'deal_number', 'contract_number'))) {
    const key = `${normId(s.deal_number)}|${normId(s.contract_number)}`; if (seen.has(key)) continue; seen.add(key);
    const c = normId(s.contract_number), d = normId(s.deal_number), p = partyKey(s.provider);
    const mine = lines.filter((l) => !l.used && ((c && l.c === c) || (!l.c && l.d === d && (!l.p || l.p === p))));
    for (const l of mine) l.used = true;
    const due = num(s.dealer_cost) ?? 0; cost += due;
    const sale = isoDate(s.sale_date); const deadline = addDays(sale, remitDays);
    const base = { deal_number: str(s.deal_number), customer: str(s.customer), contract_number: str(s.contract_number), provider: str(s.provider), sale_date: sale, remit_by: deadline, dealer_cost: due };
    if (!mine.length) {
      const age = daysBetween(sale, today);
      if (age > remitDays) items.push({ ...base, remitted: null, remit_date: null, finding: 'not_remitted_overdue', amount: due, why: `Sold ${age} days ago and not remitted; it was due by ${deadline}. The contract may not be in force until it is.` });
      else if (remitDays - age <= dueSoonDays) items.push({ ...base, remitted: null, remit_date: null, finding: 'due_soon', amount: due, why: `Remittance due by ${deadline}.` });
      continue;
    }
    const groups = groupBy(mine, (l) => `${l.amount}|${l.date}`);
    const dup = [...groups.values()].find((g) => g.length > 1);
    const total = round2(mine.reduce((x, l) => x + l.amount, 0)); remitted += total;
    const first = mine.map((l) => l.date).filter(Boolean).sort()[0] || null;
    if (dup) items.push({ ...base, remitted: total, remit_date: first, finding: 'remitted_twice', amount: round2(dup[0].amount * (dup.length - 1)), why: `The same ${dup[0].amount} was remitted ${dup.length} times on ${dup[0].date}.` });
    else if (due - total > tolerance) items.push({ ...base, remitted: total, remit_date: first, finding: 'remitted_short', amount: round2(due - total), why: `Remitted ${total} against a dealer cost of ${due}.` });
    else if (total - due > tolerance) items.push({ ...base, remitted: total, remit_date: first, finding: 'remitted_over', amount: round2(total - due), why: `Remitted ${total} against a dealer cost of ${due}.` });
    if (first && first > deadline) items.push({ ...base, remitted: total, remit_date: first, finding: 'remitted_late', amount: total, why: `Remitted ${daysBetween(sale, first)} days after the sale; due by ${deadline}. Check the contract was accepted.` });
  }
  for (const l of lines.filter((x) => !x.used)) items.push({ deal_number: str(l.raw.deal_number), customer: '', contract_number: str(l.raw.contract_number), provider: str(l.raw.provider), sale_date: null, remit_by: null, dealer_cost: null, remitted: l.amount, remit_date: l.date, finding: 'remittance_no_sale', amount: l.amount, why: 'Remitted for a contract not in the sold file (cancelled, or another store).' });
  items.sort(by('-amount', 'deal_number', 'finding'));
  const n = (f) => items.filter((i) => i.finding === f);
  return { as_of: today, contracts: seen.size, dealer_cost: round2(cost), remitted: round2(remitted), not_remitted_overdue: n('not_remitted_overdue').length, overdue_amount: round2(n('not_remitted_overdue').reduce((x, i) => x + i.amount, 0)), due_soon: n('due_soon').length, remitted_short: n('remitted_short').length, remitted_over: n('remitted_over').length, remitted_twice: n('remitted_twice').length, remitted_late: n('remitted_late').length, remittance_no_sale: n('remittance_no_sale').length, items };
}

export const line = (r) => `${r.contracts} service contract(s), dealer cost ${r.dealer_cost}, remitted ${r.remitted}. ${r.not_remitted_overdue} not remitted past the deadline (${r.overdue_amount}), ${r.due_soon} due within a week, ${r.remitted_short} short, ${r.remitted_over} over, ${r.remitted_twice} remitted twice, ${r.remitted_late} remitted late, ${r.remittance_no_sale} remittance(s) with no sale.`;
