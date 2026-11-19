// Used vehicle aging and pricing. Pure functions.
import { str, num, round2, pct, normId, isoDate, daysBetween, asOfDate, ageBucket, bucketLabels, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const UNIT_FIELDS = Object.freeze({
  stock_number: t(['Stock No', 'Stock Number', 'Stock #', 'Stock'], { required: true }),
  vin: t(['VIN', 'Serial Number']),
  year: t(['Year', 'Model Year', 'Yr'], { type: 'number' }),
  description: t(['Description', 'Vehicle', 'Make/Model', 'Year Make Model', 'YMM']),
  received_date: t(['Received Date', 'Inventory Date', 'In Stock Date', 'Stock Date', 'Acquired'], { type: 'date', required: true }),
  cost: t(['Cost', 'Total Cost', 'Inventory Cost', 'Book Value', 'Unit Cost'], { type: 'money', required: true }),
  list_price: t(['List Price', 'Internet Price', 'Asking Price', 'Price', 'Sticker'], { type: 'money' }),
  market_price: t(['Market Price', 'Market Average', 'Market Value', 'Retail Market'], { type: 'money' }),
  last_price_change: t(['Last Price Change', 'Price Changed', 'Last Reprice', 'Price Date'], { type: 'date' }),
  odometer: t(['Odometer', 'Mileage', 'Miles'], { type: 'number' }),
  status: t(['Status', 'Vehicle Status', 'Stock Status']),
});
const GONE = /sold|deliver|wholesal|transfer|retail/i;

/** Age every used unit in stock and flag pricing that needs a look. */
export function ageInventory(units, { asOf, edges = [30, 60, 90], wholesaleDays = 60, aboveMarketPct = 103, belowMarketPct = 90, staleDays = 14 } = {}) {
  const today = asOfDate(asOf);
  const items = []; const all = []; const seen = new Set(); let skipped = 0;
  for (const u of [...units].filter((x) => normId(x.stock_number)).sort(by('stock_number'))) {
    const id = normId(u.stock_number); if (seen.has(id)) continue; seen.add(id);
    if (GONE.test(str(u.status))) { skipped++; continue; }
    const age = daysBetween(isoDate(u.received_date), today);
    const cost = num(u.cost) ?? 0, price = num(u.list_price), market = num(u.market_price);
    const ptm = price !== null && market ? pct(price, market) : null;
    const changed = isoDate(u.last_price_change) || isoDate(u.received_date);
    const sinceChange = changed ? daysBetween(changed, today) : null;
    const findings = []; const why = [];
    if (age !== null && age > wholesaleDays) { findings.push('over_wholesale_age'); why.push(`${age} days in stock, past your ${wholesaleDays}-day wholesale line.`); }
    if (price === null || price <= 0) { findings.push('no_price'); why.push('No list price.'); }
    else {
      if (price < cost) { findings.push('price_below_cost'); why.push(`Listed at ${price}, below its cost of ${cost}.`); }
      if (ptm !== null && ptm > aboveMarketPct) { findings.push('priced_above_market'); why.push(`${ptm}% of market (${market}).`); }
      if (ptm !== null && ptm < belowMarketPct) { findings.push('priced_well_below_market'); why.push(`${ptm}% of market (${market}): check the price or the market figure.`); }
      if (age !== null && age > 30 && sinceChange !== null && sinceChange > staleDays) { findings.push('stale_price'); why.push(`Price unchanged for ${sinceChange} days.`); }
    }
    const row = { stock_number: str(u.stock_number), vin: str(u.vin), year: num(u.year), description: str(u.description), received_date: isoDate(u.received_date), age_days: age, bucket: ageBucket(age, edges), cost, list_price: price, market_price: market, price_to_market_pct: ptm, days_since_price_change: sinceChange, findings, why: why.join(' ') };
    all.push(row); if (findings.length) items.push(row);
  }
  items.sort(by('-age_days', 'stock_number'));
  const byAge = bucketLabels(edges).map((b) => { const l = all.filter((r) => r.bucket === b); return { bucket: b, units: l.length, cost: round2(l.reduce((s, r) => s + r.cost, 0)) }; });
  const has = (f) => all.filter((r) => r.findings.includes(f));
  return { as_of: today, units: all.length, skipped_sold: skipped, total_cost: round2(all.reduce((s, r) => s + r.cost, 0)), average_age: all.length ? round2(all.reduce((s, r) => s + (r.age_days || 0), 0) / all.length) : 0, wholesale_days: wholesaleDays, over_wholesale_age: has('over_wholesale_age').length, over_wholesale_cost: round2(has('over_wholesale_age').reduce((s, r) => s + r.cost, 0)), priced_above_market: has('priced_above_market').length, priced_well_below_market: has('priced_well_below_market').length, price_below_cost: has('price_below_cost').length, stale_price: has('stale_price').length, no_price: has('no_price').length, by_age: byAge, items };
}

export const line = (r) => `${r.units} used unit(s) in stock, ${r.total_cost} at cost, average age ${r.average_age} days. ${r.over_wholesale_age} past ${r.wholesale_days} days (${r.over_wholesale_cost}); ${r.priced_above_market} priced above market, ${r.priced_well_below_market} well below; ${r.price_below_cost} below cost; ${r.stale_price} with a stale price; ${r.no_price} with no price.`;
