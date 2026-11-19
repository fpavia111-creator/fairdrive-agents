// Catalogue of export files from dealer management systems (DMS), shop management
// systems, estimating systems, floorplan lenders and manufacturers that the Fairdrive
// agents recognise.
//
// Each entry says how to recognise the file (column names that must be there).
// An agent turns an entry into a profile by adding its own column map:
//
//   exportProfile('tekmetric_repair_orders', { ro_number: 'RO #', opened: 'Created Date' })
//
// basis:
//   'documented'  the column names were checked against the vendor's own
//                 documentation (source and date given);
//   'recalled'    the layout was written from knowledge of the export and was
//                 not checked against documentation or a live account.
// Every layout below is 'recalled': DMS and shop-system reports are built per store
// and their column titles vary, so the first setup confirms them with `inspect`.
// When a header differs, the file still maps by each column's "also called" list,
// and fairdrive-sources.json names the columns by hand.

const e = (id, system, label, signature, extra = {}) => Object.freeze({ id, system, label, signature, basis: 'recalled', ...extra });

export const EXPORTS = Object.freeze(Object.fromEntries([
  // Dealer management systems: deals and F&I
  e('cdk_deal_list', 'CDK Drive', 'F&I deal list report saved as CSV', ['Deal No', 'Stock No', ['Contract Date', 'Deal Date']]),
  e('reynolds_deal_recap', 'Reynolds & Reynolds ERA-IGNITE', 'Deal recap report saved as CSV', ['Deal Number', 'Stock Number', ['Front Gross', 'Front End Gross']]),
  e('tekion_deals', 'Tekion ARC', 'Deals list export (CSV)', ['Deal ID', 'Stock #', 'Deal Status']),
  e('dealertrack_funding', 'Dealertrack', 'Funding status / contracts in transit report (CSV)', [['Deal #', 'Deal Number'], 'Lender', ['Funded Date', 'Date Funded']]),
  // Inventory
  e('cdk_vehicle_inventory', 'CDK Drive', 'Vehicle inventory list saved as CSV', ['Stock No', 'VIN', ['Inventory Date', 'In Stock Date']]),
  e('dealersocket_inventory', 'DealerSocket', 'Inventory export (CSV)', ['Stock #', 'VIN', ['Days In Stock', 'Age']]),
  // Floorplan lenders
  e('floorplan_statement', 'Floorplan lender (generic)', 'Floorplan statement or curtailment report (CSV)', ['VIN', ['Floor Date', 'Floored Date', 'Funding Date'], ['Principal Balance', 'Current Balance', 'Balance']]),
  // Service and parts
  e('cdk_open_ro', 'CDK Drive', 'Open RO report saved as CSV', ['RO Number', ['Open Date', 'RO Date'], ['Advisor', 'Service Advisor']]),
  e('tekmetric_repair_orders', 'Tekmetric', 'Repair orders export (CSV)', ['RO #', ['Created Date', 'Created'], ['Labor Total', 'Labor']]),
  e('shopmonkey_orders', 'Shopmonkey', 'Orders export (CSV)', ['Order #', ['Order Status', 'Status'], ['Total', 'Grand Total']]),
  // Collision estimating
  e('ccc_one_estimates', 'CCC ONE', 'Estimate and supplement list export (CSV)', [['RO Number', 'RO #'], ['Supplement', 'Supplement Number'], ['Gross Total', 'Estimate Total']]),
  e('mitchell_estimates', 'Mitchell Cloud Estimating', 'Estimate totals export (CSV)', [['Claim Number', 'Claim #'], ['Estimate Total', 'Grand Total'], ['Version', 'Supplement']]),
  // Manufacturer statements
  e('oem_warranty_statement', 'Manufacturer warranty statement (generic)', 'Warranty claim payment statement saved as CSV', ['Claim Number', 'Claim Status', ['Amount Paid', 'Paid Amount'], 'Debit Code']),
  e('oem_incentive_statement', 'Manufacturer incentive statement (generic)', 'Incentive / dealer cash payment statement saved as CSV', ['VIN', 'Program Code', ['Amount Paid', 'Paid Amount', 'Credit Amount'], 'Statement Date']),
].map((x) => [x.id, x])));

/** A profile for an agent: a catalogue entry plus the agent's column map. */
export function exportProfile(key, map, extra = {}) {
  const base = EXPORTS[key];
  if (!base) throw new Error(`unknown export "${key}"`);
  return { ...base, map, ...extra };
}

export const EXPORTS_BASIS_NOTE = 'Where a layout says "checked", its column names were compared with the vendor\'s documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.';

/**
 * Row hook for grouped reports (QuickBooks style): a row with only its first
 * cell filled names the group for the rows under it; "Total for ..." rows end it.
 * The group name is written to `field` on each detail row.
 */
export function carryGroup(field, { groupColumn = '', isDetail } = {}) {
  return (rows) => {
    const out = []; let group = '';
    for (const r of rows) {
      const label = String(r[groupColumn] ?? '').trim();
      const detail = isDetail ? isDetail(r) : Object.entries(r).some(([k, v]) => k !== groupColumn && k !== field && String(v ?? '').trim() !== '');
      if (label && /^(grand\s+)?total\b/i.test(label)) continue;
      if (label && !detail) { group = label; continue; }
      if (!detail) continue;
      const { [groupColumn]: _drop, ...rest } = r;
      out.push({ ...rest, [field]: String(r[field] ?? '').trim() || label || group });
    }
    return out;
  };
}

/** Row hook: keep the first row for each value of `field` (Shopify repeats an order once per line item). */
export function firstRowPer(field) {
  return (rows) => { const seen = new Set(); return rows.filter((r) => { const k = String(r[field] ?? ''); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
}

/** "First Last" from two columns, for exports that split the name. */
export const fullName = (first, last) => ({ from: [first, last], compute: (_r, get) => [get(first), get(last)].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ') });
