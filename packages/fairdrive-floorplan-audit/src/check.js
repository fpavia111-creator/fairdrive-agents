// Floorplan audit: DMS vehicle inventory against the floorplan lender statement. Pure functions.
import { str, num, round2, normVin, isoDate, daysBetween, asOfDate, vinIndex, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const INVENTORY_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Stock'], { required: true }),
  vin: t(['VIN', 'Vehicle VIN', 'Serial Number'], { required: true }),
  status: t(['Status', 'Vehicle Status', 'Inventory Status', 'Stock Status']),
  sold_date: t(['Sold Date', 'Date Sold', 'Delivery Date', 'Deal Date'], { type: 'date' }),
  new_used: t(['New/Used', 'N/U', 'Type', 'Stock Type']),
  floorplan_balance: t(['Floorplan Balance', 'Floor Plan Liability', 'Flooring Balance', 'FP Balance'], { type: 'money' }),
});
export const STATEMENT_FIELDS = Object.freeze({
  vin: t(['VIN', 'Serial Number', 'Collateral', 'Vehicle ID'], { required: true }),
  floor_date: t(['Floor Date', 'Floored Date', 'Funding Date', 'Date Floored'], { type: 'date' }),
  balance: t(['Principal Balance', 'Current Balance', 'Balance', 'Outstanding', 'Amount Due'], { type: 'money', required: true }),
});
const SOLD = /sold|deliver|wholesal|retail|closed|booked/i;

/** Match inventory with the floorplan statement. */
export function auditFloorplan(inventory, statement, { asOf, payoffDays = 5, tolerance = 1 } = {}) {
  const today = asOfDate(asOf);
  const lines = statement.filter((s) => normVin(s.vin)).sort(by('vin')).map((s) => ({ vin: normVin(s.vin), floor_date: isoDate(s.floor_date), balance: num(s.balance) ?? 0, used: false }));
  const idx = vinIndex(lines, (l) => l.vin);
  const items = []; const seen = new Set(); let floored = 0;
  for (const u of [...inventory].filter((x) => normVin(x.vin)).sort(by('stock_number', 'vin'))) {
    const v = normVin(u.vin); if (seen.has(v)) continue; seen.add(v);
    const ln = idx.get(v); if (ln) { ln.used = true; floored++; }
    const sold = !!isoDate(u.sold_date) || SOLD.test(str(u.status));
    const base = { stock_number: str(u.stock_number), vin: v, status: str(u.status), sold_date: isoDate(u.sold_date), floor_date: ln ? ln.floor_date : null, statement_balance: ln ? ln.balance : null };
    if (sold && ln) {
      const days = base.sold_date ? daysBetween(base.sold_date, today) : null;
      const late = days === null || days > payoffDays;
      items.push({ ...base, finding: late ? 'sold_not_paid_off' : 'payoff_due', days_since_sale: days, amount: ln.balance, why: late ? `Sold ${days === null ? '(no date)' : `${days} days ago`} and still on the floorplan statement for ${ln.balance}. Pay it off; most floorplan agreements require it within days of the sale.` : `Sold ${days} day(s) ago; payoff of ${ln.balance} falls due within your ${payoffDays} days.` });
    } else if (!sold && !ln) {
      items.push({ ...base, finding: 'not_floored', days_since_sale: null, amount: null, why: 'In stock but not on the floorplan statement. Fine if it was bought for cash; otherwise it was never floored or was paid off by mistake.' });
    } else if (!sold && ln) {
      const dms = num(u.floorplan_balance);
      if (dms !== null && Math.abs(round2(dms - ln.balance)) > tolerance) items.push({ ...base, finding: 'balance_differs', days_since_sale: null, amount: round2(dms - ln.balance), why: `The DMS carries ${dms}; the lender shows ${ln.balance}. A curtailment or payoff was posted on one side only.` });
    }
  }
  for (const l of lines.filter((x) => !x.used)) items.push({ stock_number: '', vin: l.vin, status: '', sold_date: null, floor_date: l.floor_date, statement_balance: l.balance, finding: 'on_statement_not_in_inventory', days_since_sale: null, amount: l.balance, why: `The lender shows ${l.balance} on this VIN and the DMS inventory does not have it: sold and removed without a payoff, or not yours.` });
  const rank = { sold_not_paid_off: 0, on_statement_not_in_inventory: 1, balance_differs: 2, payoff_due: 3, not_floored: 4 };
  items.sort((a, b) => rank[a.finding] - rank[b.finding] || (b.days_since_sale ?? 0) - (a.days_since_sale ?? 0) || (a.vin < b.vin ? -1 : 1));
  const amt = (f) => round2(items.filter((i) => i.finding === f).reduce((s, i) => s + (i.amount || 0), 0));
  const cnt = (f) => items.filter((i) => i.finding === f).length;
  return { as_of: today, units: seen.size, floored_units: floored, statement_lines: lines.length, statement_balance: round2(lines.reduce((s, l) => s + l.balance, 0)), payoff_days: payoffDays, sold_not_paid_off: cnt('sold_not_paid_off'), sold_not_paid_off_amount: amt('sold_not_paid_off'), payoff_due: cnt('payoff_due'), payoff_due_amount: amt('payoff_due'), not_in_inventory: cnt('on_statement_not_in_inventory'), not_in_inventory_amount: amt('on_statement_not_in_inventory'), balance_differs: cnt('balance_differs'), not_floored: cnt('not_floored'), items };
}

export const line = (r) => `${r.units} unit(s) in inventory, ${r.statement_lines} on the floorplan statement (${r.statement_balance}). ${r.sold_not_paid_off} sold and not paid off (${r.sold_not_paid_off_amount}); ${r.payoff_due} payoff(s) due within ${r.payoff_days} days (${r.payoff_due_amount}); ${r.not_in_inventory} on the statement but not in inventory (${r.not_in_inventory_amount}); ${r.balance_differs} balance difference(s); ${r.not_floored} in stock but not floored.`;

/** Payoff list for the person who pays the lender. */
export function payoffText(items, { lender, from }) {
  const list = items.filter((i) => i.finding === 'sold_not_paid_off' || i.finding === 'payoff_due');
  const total = round2(list.reduce((s, i) => s + i.amount, 0));
  return { total, text: [`# Floorplan payoffs to approve: ${lender || 'floorplan lender'}`, '', `**To:** ${lender || '[TO CONFIRM floorplan lender]'}`, `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    `${list.length} sold unit(s) are still floored, ${total} in total by the statement balance.`, '',
    '| Stock | VIN | Sold | Days since sale | Statement balance |', '| --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.stock_number} | ${i.vin} | ${i.sold_date || ''} | ${i.days_since_sale ?? ''} | ${i.amount} |`), '',
    '[CHECK each amount against the lender payoff quote, which adds interest and fees to date]'].join('\n') };
}
