import { readFileSync } from 'node:fs';
import { checkAgent, LIMITS } from 'fairdrive-core';
import { PART_FIELDS, classifyParts, line } from './check.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const args = {
  parts: { type: 'string', description: 'Parts inventory under --root (CSV, Excel or JSON) from the DMS parts module: part number, description, on hand, unit cost, last sale date, last receipt date, returnable, source' },
  month_edges: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 60, description: 'Months since last sale' }, minItems: 3, maxItems: 3, description: 'Month limits for slow, obsolete candidate and obsolete (default 6, 9, 12)' },
  as_of: { type: 'string', format: 'date', description: 'Date to count from, YYYY-MM-DD (default today)' },
};
const run = (a, ctx) => classifyParts(ctx.records(a.parts), { asOf: a.as_of, monthEdges: a.month_edges && a.month_edges.length === 3 ? [...a.month_edges].sort((x, y) => x - y) : [6, 9, 12] });

export const manifest = checkAgent({
  name: 'fairdrive-parts-obsolescence', version: pkg.version, prefix: 'obsolescence',
  description: 'Classes every part on hand by months since its last sale (or its last receipt when it never sold) as active, slow, obsolete candidate or obsolete, values each class at cost, and lists idle parts by value with the returnable ones marked, so the most valuable returns go back first. It never adjusts inventory, changes a bin or returns parts.',
  sources: { parts: { label: 'Parts inventory', args: ['parts'], fields: PART_FIELDS } },
  args, required: ['parts'], run, line,
  scan: { name: 'obsolescence_check', title: 'Class parts by months since last sale', description: 'One row per idle part number, highest value first: on hand, cost, value, months idle, class, returnable, never sold. Totals, value by class and the obsolete percent.' },
  report: { base: 'parts-obsolescence', what: 'parts obsolescence report', title: (r) => `Parts obsolescence at ${r.as_of}`, columns: ['part_number', 'description', 'on_hand', 'unit_cost', 'value', 'last_sale_date', 'last_receipt_date', 'months_idle', 'never_sold', 'class', 'returnable', 'source'],
    sections: (r) => [{ title: 'By class', rows: r.by_class, columns: ['class', 'parts', 'value'] }],
    limits: [LIMITS.files, 'Returnable is the flag in your file; the manufacturer return program decides what it takes back and when.', 'Months are days divided by 30.44.'] },
  refused: [{ name: 'dms_adjust_inventory', category: 'production_deploy', description: 'It never adjusts quantities, costs or bins.' }, { name: 'oem_parts_return_submit', category: 'binding_send', description: 'It never submits a parts return.' }],
  prompt: { name: 'parts_obsolescence', title: 'Review parts obsolescence', description: 'Walks the host model through a parts obsolescence review.', arguments: [{ name: 'parts', description: 'Parts inventory', required: true }],
    text: 'You are helping a parts manager with fairdrive-parts-obsolescence. Parts: {{parts}}.\n\nRules: it reads files and writes a report. It never changes inventory or returns parts.\n\n1. Call obsolescence_check (month_edges if the store uses other limits). Give the obsolete percent and the returnable value first.\n2. Call obsolescence_write_report.' },
});
