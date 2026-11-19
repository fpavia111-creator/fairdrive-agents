import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS, exportProfile } from 'fairdrive-core';
import { UNIT_FIELDS, ageInventory, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  inventory: { type: 'string', description: 'Used-vehicle inventory under --root (CSV, Excel or JSON) from the DMS or a pricing tool: stock number, VIN, year, description, inventory date, cost, list price, market price, last price change, odometer, status' },
  wholesale_days: { type: 'integer', minimum: 1, maximum: 365, description: 'Days in stock after which a unit is a wholesale candidate (default 60)' },
  above_market_pct: { type: 'number', minimum: 50, maximum: 200, description: 'List price above this percent of market is flagged (default 103)' },
  below_market_pct: { type: 'number', minimum: 10, maximum: 150, description: 'List price below this percent of market is flagged (default 90)' },
  stale_days: { type: 'integer', minimum: 1, maximum: 120, description: 'A unit over 30 days old whose price has not changed for this many days is flagged (default 14)' },
  as_of: { type: 'string', format: 'date', description: 'Date to age from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => ageInventory(ctx.records(a.inventory), { asOf: a.as_of, wholesaleDays: a.wholesale_days ?? 60, aboveMarketPct: a.above_market_pct ?? 103, belowMarketPct: a.below_market_pct ?? 90, staleDays: a.stale_days ?? 14 });

export const manifest = checkAgent({
  name: 'fairdrive-used-vehicle-aging', version: pkg.version, prefix: 'aging',
  description: 'Ages the used-vehicle inventory by days in stock and totals cost by age, and flags units past your wholesale age, priced above market or well below it (with the market figure you supply), listed below cost, with a price unchanged for too long, or with no price. Sold, wholesaled and transferred units are left out. It never changes a price or lists a car at auction.',
  sources: { inventory: { label: 'Used-vehicle inventory', args: ['inventory'], fields: UNIT_FIELDS, profiles: [exportProfile('dealersocket_inventory', { stock_number: 'Stock #', vin: 'VIN', received_date: ['Inventory Date', 'Date In Stock', 'In Stock Date'], cost: ['Cost', 'Total Cost'], list_price: ['Internet Price', 'Price'] }, { note: 'DealerSocket inventory export: "Days In Stock" is not used; the age is worked out from the inventory date.' })] } },
  args, required: ['inventory'], run, line,
  scan: { name: 'aging_check', title: 'Age the used-vehicle inventory', description: 'One row per unit that needs a look: age and bucket, cost, list and market price, price-to-market percent, days since the last price change, findings (over_wholesale_age, priced_above_market, priced_well_below_market, price_below_cost, stale_price, no_price). Totals and cost by age.' },
  report: { base: 'used-vehicle-aging', what: 'used-vehicle aging report', title: (r) => `Used vehicle aging at ${r.as_of}`, columns: ['stock_number', 'vin', 'year', 'description', 'received_date', 'age_days', 'bucket', 'cost', 'list_price', 'market_price', 'price_to_market_pct', 'days_since_price_change', 'findings', 'why'],
    sections: (r) => [{ title: 'By age', rows: r.by_age, columns: ['bucket', 'units', 'cost'] }],
    limits: [LIMITS.files, 'Market prices are the figures in your file (from your pricing tool); this agent does not look them up.', 'It suggests where to look; a manager decides prices and wholesale.'] },
  refused: [{ name: 'dms_change_price', category: 'production_deploy', description: 'It never changes a price in the DMS or on a website.' }, { name: 'auction_list_vehicle', category: 'binding_send', description: 'It never lists a vehicle at auction.' }],
  prompt: { name: 'used_aging', title: 'Review used-vehicle aging', description: 'Walks the host model through a used-vehicle aging review.', arguments: [{ name: 'inventory', description: 'Used inventory', required: true }],
    text: 'You are helping a used-car manager with fairdrive-used-vehicle-aging. Inventory: {{inventory}}.\n\nRules: it reads files and writes a report. It never changes a price or sends a car to auction.\n\n1. Ask the store wholesale line (days) and price-to-market targets; run aging_check with them.\n2. Lead with cost past the wholesale line, then units priced above market and stale prices.\n3. Call aging_write_report.' },
});
