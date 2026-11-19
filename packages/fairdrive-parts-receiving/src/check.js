// Parts received against vendor invoices, by purchase order and part number. Pure functions.
import { str, num, round2, normId, isoDate, daysBetween, asOfDate, groupBy, partyIs, by } from 'fairdrive-core';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
export const RECEIPT_FIELDS = Object.freeze({
  po_number: t(['PO Number', 'PO', 'PO #', 'Purchase Order', 'Order Number'], { required: true }),
  part_number: t(['Part Number', 'Part No', 'Part #', 'Part'], { required: true }),
  received_date: t(['Received Date', 'Received', 'Receipt Date', 'Date'], { type: 'date' }),
  qty_received: t(['Qty Received', 'Received Qty', 'Quantity Received', 'Qty'], { type: 'number', required: true }),
  unit_cost: t(['Unit Cost', 'PO Cost', 'Cost', 'Expected Cost'], { type: 'money' }),
});
export const INVOICE_FIELDS = Object.freeze({
  invoice_number: t(['Invoice Number', 'Invoice', 'Invoice #', 'Inv No'], { required: true }),
  po_number: t(['PO Number', 'PO', 'PO #', 'Purchase Order', 'Customer PO'], { required: true }),
  part_number: t(['Part Number', 'Part No', 'Part #', 'Part'], { required: true }),
  qty_billed: t(['Qty Billed', 'Qty Shipped', 'Quantity', 'Qty'], { type: 'number', required: true }),
  unit_price: t(['Unit Price', 'Net Price', 'Price', 'Dealer Net'], { type: 'money', required: true }),
  invoice_date: t(['Invoice Date', 'Date', 'Ship Date'], { type: 'date' }),
  vendor: t(['Vendor', 'Supplier', 'Distributor', 'Sold By']),
});

export function matchReceiving(receipts, invoices, { asOf, pricePct = 1, notBilledDays = 30 } = {}) {
  const today = asOfDate(asOf);
  const key = (r) => `${normId(r.po_number)}|${normId(r.part_number)}`;
  const rec = groupBy(receipts.filter((r) => normId(r.po_number) && normId(r.part_number)), key);
  const lines = []; const dups = []; const seenLine = new Set();
  for (const i of [...invoices].filter((x) => normId(x.po_number) && normId(x.part_number)).sort(by('invoice_date', 'invoice_number', 'po_number', 'part_number'))) {
    const sig = `${normId(i.invoice_number)}|${key(i)}|${num(i.qty_billed)}|${num(i.unit_price)}`;
    if (seenLine.has(sig)) { dups.push(i); continue; } seenLine.add(sig); lines.push(i);
  }
  const inv = groupBy(lines, key);
  const items = []; let billed = 0, received = 0;
  for (const k of [...new Set([...rec.keys(), ...inv.keys()])].sort()) {
    const r = rec.get(k) || [], v = inv.get(k) || [];
    const qr = r.reduce((s, x) => s + (num(x.qty_received) || 0), 0), qb = v.reduce((s, x) => s + (num(x.qty_billed) || 0), 0);
    const cost = (r.map((x) => num(x.unit_cost)).find((x) => x !== null)) ?? null;
    const price = v.length ? round2(v.reduce((s, x) => s + (num(x.qty_billed) || 0) * (num(x.unit_price) || 0), 0) / (qb || 1)) : null;
    billed += round2(qb * (price || 0)); received += round2(qr * (cost ?? price ?? 0));
    const [po, part] = [str((r[0] || v[0]).po_number), str((r[0] || v[0]).part_number)];
    const base = { po_number: po, part_number: part, vendor: str((v[0] || {}).vendor), invoices: [...new Set(v.map((x) => str(x.invoice_number)))].sort(), qty_received: qr, qty_billed: qb, unit_cost: cost, unit_price: price };
    if (qb > qr) items.push({ ...base, finding: 'billed_not_received', amount: round2((qb - qr) * (price || 0)), why: `Billed ${qb}, received ${qr}.` });
    if (qr > qb) { const last = r.map((x) => isoDate(x.received_date)).filter(Boolean).sort().pop(); const age = last ? daysBetween(last, today) : null; if (age === null || age > notBilledDays) items.push({ ...base, finding: 'received_not_billed', amount: round2((qr - qb) * (cost ?? 0)), why: `Received ${qr}, billed ${qb}; ${age ?? '?'} days since receipt. Book the cost or ask for the invoice.` }); }
    if (cost !== null && price !== null && cost > 0 && ((price - cost) / cost) * 100 > pricePct) items.push({ ...base, finding: 'price_above_cost', amount: round2((price - cost) * Math.min(qb, qr || qb)), why: `Billed ${price} a unit against ${cost} on the order.` });
  }
  for (const d of dups) items.push({ po_number: str(d.po_number), part_number: str(d.part_number), vendor: str(d.vendor), invoices: [str(d.invoice_number)], qty_received: null, qty_billed: num(d.qty_billed), unit_cost: null, unit_price: num(d.unit_price), finding: 'duplicate_invoice_line', amount: round2((num(d.qty_billed) || 0) * (num(d.unit_price) || 0)), why: `Invoice ${str(d.invoice_number)} lists this line twice.` });
  items.sort(by('-amount', 'po_number', 'part_number', 'finding'));
  const over = items.filter((i) => i.finding !== 'received_not_billed');
  const n = (f) => items.filter((i) => i.finding === f);
  return { as_of: today, lines: new Set([...rec.keys(), ...inv.keys()]).size, billed: round2(billed), received_value: round2(received), overbilled: round2(over.reduce((s, i) => s + i.amount, 0)), billed_not_received: n('billed_not_received').length, received_not_billed: n('received_not_billed').length, received_not_billed_value: round2(n('received_not_billed').reduce((s, i) => s + i.amount, 0)), price_above_cost: n('price_above_cost').length, duplicate_invoice_lines: n('duplicate_invoice_line').length, items };
}

export const line = (r) => `${r.lines} PO line(s): billed ${r.billed}, received ${r.received_value} at cost. Overbilled ${r.overbilled}: ${r.billed_not_received} billed but not received, ${r.price_above_cost} priced above the order, ${r.duplicate_invoice_lines} duplicate invoice line(s). ${r.received_not_billed} received but not billed (${r.received_not_billed_value}).`;

export function creditText(items, { vendor, from, contact }) {
  const is = partyIs(items.map((i) => i.vendor), vendor);
  const list = items.filter((i) => i.finding !== 'received_not_billed' && is(i.vendor));
  const total = round2(list.reduce((s, i) => s + i.amount, 0));
  return { total, count: list.length, name: (list[0] || {}).vendor || vendor, text: [`# Credit request: ${(list[0] || {}).vendor || vendor}`, '', `**To:** ${contact || `[TO CONFIRM ${vendor} credit contact]`}`, `**From:** ${from || '[TO CONFIRM your name and store]'}`, '',
    `We were billed ${total} more than we received or ordered on the lines below. Please send a credit memo.`, '',
    '| Invoice | PO | Part | Billed | Received | Billed price | Order cost | Issue | Credit |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((i) => `| ${i.invoices.join(', ')} | ${i.po_number} | ${i.part_number} | ${i.qty_billed ?? ''} | ${i.qty_received ?? ''} | ${i.unit_price ?? ''} | ${i.unit_cost ?? ''} | ${i.finding} | ${i.amount} |`), '',
    '[ATTACH packing slips and the receiving report]'].join('\n') };
}
