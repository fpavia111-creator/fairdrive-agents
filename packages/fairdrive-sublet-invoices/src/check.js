// Sublet lines on repair orders against vendor invoices. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, partyKey, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const LINE_FIELDS = Object.freeze({
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order'], { required: true }),
  po_number: t(['PO Number', 'PO', 'PO #', 'Sublet PO']),
  vendor: t(['Vendor', 'Sublet Vendor', 'Supplier']),
  description: t(['Description', 'Sublet Description', 'Work']),
  sublet_cost: t(['Sublet Cost', 'PO Amount', 'Cost', 'Expected Cost'], { type: 'money', required: true }),
  sublet_sale: t(['Sublet Sale', 'Sale', 'Billed To Customer', 'Sublet Sold'], { type: 'money' }),
  ro_closed: t(['RO Closed', 'Closed', 'Close Date', 'Closed Date'], { type: 'date' }),
});
export const INVOICE_FIELDS = Object.freeze({
  invoice_number: t(['Invoice Number', 'Invoice', 'Invoice #', 'Inv No'], { required: true }),
  vendor: t(['Vendor', 'Supplier', 'Payee']),
  po_number: t(['PO Number', 'PO', 'PO #']),
  ro_number: t(['RO Number', 'RO #', 'RO', 'Repair Order']),
  amount: t(['Amount', 'Invoice Amount', 'Total'], { type: 'money', required: true }),
  invoice_date: t(['Invoice Date', 'Date'], { type: 'date' }),
});

export function matchSublet(lines, invoices, { asOf, tolerance = 1, closedDays = 7 } = {}) {
  const today = asOfDate(asOf);
  const ls = [...lines].filter((l) => normId(l.ro_number)).sort(by('ro_number', 'po_number')).map((l) => ({ ...l, inv: [] }));
  const items = []; const seenInv = new Map();
  // Lines indexed by PO and by RO, first line (in the fixed order above) wins, so matching is linear.
  const byPo = new Map(); const byRo = new Map();
  for (const l of ls) { const po = normId(l.po_number), ro = normId(l.ro_number); if (po && !byPo.has(po)) byPo.set(po, l); if (!byRo.has(ro)) byRo.set(ro, []); byRo.get(ro).push(l); }
  for (const i of [...invoices].filter((x) => normId(x.invoice_number)).sort(by('invoice_date', 'invoice_number', 'amount'))) {
    const sig = `${partyKey(i.vendor)}|${normId(i.invoice_number)}`;
    const match = (normId(i.po_number) && byPo.get(normId(i.po_number))) || (normId(i.ro_number) ? (byRo.get(normId(i.ro_number)) || []).find((l) => !str(i.vendor) || !str(l.vendor) || partyKey(i.vendor) === partyKey(l.vendor)) : null);
    if (seenInv.has(sig)) { items.push({ ro_number: match ? str(match.ro_number) : '', po_number: str(i.po_number), vendor: str(i.vendor), invoice_number: str(i.invoice_number), cost: null, sale: null, invoiced: num(i.amount), finding: 'duplicate_invoice', amount: num(i.amount) ?? 0, why: `Invoice ${str(i.invoice_number)} from ${str(i.vendor)} appears twice.` }); continue; }
    seenInv.set(sig, i);
    if (match) match.inv.push(i);
    else items.push({ ro_number: str(i.ro_number), po_number: str(i.po_number), vendor: str(i.vendor), invoice_number: str(i.invoice_number), cost: null, sale: null, invoiced: num(i.amount), finding: 'invoice_no_ro', amount: num(i.amount) ?? 0, why: 'No sublet line on a repair order matches this invoice by PO or RO number.' });
  }
  let cost = 0, sale = 0;
  for (const l of ls) {
    const c = num(l.sublet_cost) ?? 0, s = num(l.sublet_sale) ?? 0; cost += c; sale += s;
    const invoiced = l.inv.length ? round2(l.inv.reduce((x, i) => x + (num(i.amount) || 0), 0)) : null;
    const base = { ro_number: str(l.ro_number), po_number: str(l.po_number), vendor: str(l.vendor), invoice_number: l.inv.map((i) => str(i.invoice_number)).join(' / '), cost: c, sale: s, invoiced };
    const closed = isoDate(l.ro_closed);
    if (invoiced !== null && invoiced - c > tolerance) items.push({ ...base, finding: 'invoice_over_po', amount: round2(invoiced - c), why: `Invoiced ${invoiced} against a PO of ${c}.` });
    if (invoiced === null && closed && daysBetween(closed, today) > closedDays) items.push({ ...base, finding: 'closed_no_invoice', amount: c, why: `RO closed ${daysBetween(closed, today)} days ago with no sublet invoice; the ${c} cost is not booked, so the RO gross is overstated.` });
    const realCost = invoiced ?? c;
    if (s <= 0 && realCost > 0) items.push({ ...base, finding: 'not_billed', amount: realCost, why: 'Sublet cost with nothing billed to the customer.' });
    else if (s < realCost - tolerance) items.push({ ...base, finding: 'sold_below_cost', amount: round2(realCost - s), why: `Billed ${s} for sublet that cost ${realCost}.` });
  }
  items.sort(by('-amount', 'ro_number', 'finding'));
  const n = (f) => items.filter((i) => i.finding === f);
  return { as_of: today, sublet_lines: ls.length, cost: round2(cost), sale: round2(sale), gross: round2(sale - cost), invoice_over_po: n('invoice_over_po').length, over_amount: round2(n('invoice_over_po').reduce((x, i) => x + i.amount, 0)), closed_no_invoice: n('closed_no_invoice').length, unbooked_cost: round2(n('closed_no_invoice').reduce((x, i) => x + i.amount, 0)), sold_below_cost: n('sold_below_cost').length, not_billed: n('not_billed').length, duplicate_invoices: n('duplicate_invoice').length, invoices_no_ro: n('invoice_no_ro').length, items };
}

export const line = (r) => `${r.sublet_lines} sublet line(s): cost ${r.cost}, sold ${r.sale}. ${r.invoice_over_po} invoice(s) over the PO (${r.over_amount}), ${r.closed_no_invoice} closed RO(s) with no invoice (${r.unbooked_cost} not booked), ${r.sold_below_cost} sold below cost, ${r.not_billed} not billed, ${r.duplicate_invoices} duplicate invoice(s), ${r.invoices_no_ro} invoice(s) with no RO.`;
