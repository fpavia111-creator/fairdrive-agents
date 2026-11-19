<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Parts Receiving (`fairdrive-parts-receiving`)

Matches parts received against vendor and manufacturer invoice lines by purchase order and part number, and lists parts billed but not received, parts received but not billed after your days, prices above the order cost and invoice lines billed twice. Drafts a credit request to one vendor for a person to send. It never pays an invoice or changes the receiving log.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-parts-receiving demo
npx -y fairdrive-parts-receiving mcp --root ./exports
```

## What it reads

- **Parts receiving log** (`receipts`)
- **Vendor invoice lines** (`invoices`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `receiving_match`: One row per finding, largest first: PO, part, invoices, quantities received and billed, order cost and billed price, finding (billed_not_received, received_not_billed, price_above_cost, duplicate_invoice_line), amount. Totals.
- `receiving_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `receiving_draft_credit`: Write drafts/credit-<vendor>.md: lines from one vendor billed but not received, priced above the order or billed twice, with the credit asked for. Marked DRAFT. Sending goes through receiving_request_send (one click).
- `receiving_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `ap_pay_invoice` is listed and refused: It never pays or approves a vendor invoice.
- `dms_receive_parts` is listed and refused: It never receives parts or changes a purchase order.

## What the AI model sees

- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.
- **Sent as they are:** ids, codes and names of businesses (`po_number`, `part_number`, `invoice_number`, `vendor`); dates (`received_date`, `invoice_date`); amounts and counts (`qty_received`, `unit_cost`, `qty_billed`, `unit_price`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-parts-receiving demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Parts Receiving demo (fictional receiving log and invoices, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 PO line(s): billed 1958, received 1726 at cost. Overbilled 962: 2 billed but not received, 1 priced above the order, 1 duplicate invoice line(s). 1 received but not billed (120).
    duplicate_invoice_line PO-883  MOD-BCM-2290       610
    billed_not_received    PO-885  GSK-HD-3301        190
    billed_not_received    PO-882  SNS-O2-7781        142
    received_not_billed    PO-884  WPR-22IN           120
    price_above_cost       PO-881  FLT-OIL-1120        20

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 PO line(s): billed 1958, received 1726 at cost. Overbilled 962: 2 billed but not received, 1 priced above the order, 1 duplicate invoice line(s). 1 received but not billed (120).

▶ Draft the credit request to Northline Parts Distribution
  status: executed  decision: allow  (auto)
  credit Northline Parts Distribution drafted for 962 with 1 open marker(s) ([ATTACH packing slips and the receiving report]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  credit Northline-Parts-Distribution approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries ap_pay_invoice itself
  status: blocked  decision: block
  reason: It never pays or approves a vendor invoice.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `receiving_match` | One row per finding, largest first: PO, part, invoices, quantities received and billed, order cost and billed price, finding (billed_not_received, received_not_billed, price_above_cost, duplicate_invoice_line), amount. | runs |
| `receiving_write_report` | Write parts-receiving.csv and parts-receiving.html (one row per finding, with the totals) into out_dir (default fairdrive-out/receiving). | runs |
| `receiving_draft_credit` | Write drafts/credit-<vendor>.md: lines from one vendor billed but not received, priced above the order or billed twice, with the credit asked for. | asks first (Auto can be opted in) |
| `receiving_request_send` | After one named human click (even in Auto), record that the reviewed credit draft is approved in credit-requests.csv. | one named click, even in Auto (`binding_send`) |
| `ap_pay_invoice` | It never pays or approves a vendor invoice. | refused |
| `dms_receive_parts` | It never receives parts or changes a purchase order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Parts receiving log (`receipts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `po_number` (required) | text | PO Number, PO, PO #, Purchase Order, Order Number | Bestellnummer, Bon de commande, 発注番号, 采购订单号 |
| `part_number` (required) | text | Part Number, Part No, Part #, Part | Teilenummer, Référence pièce, 部品番号, 零件号 |
| `received_date` | date | Received Date, Received, Receipt Date, Date | Eingangsdatum, Date de réception, 受領日, 收到日期 |
| `qty_received` (required) | number | Qty Received, Received Qty, Quantity Received, Qty | Menge, Quantité, 数量, 数量 |
| `unit_cost` | amount | Unit Cost, PO Cost, Cost, Expected Cost | Stückkosten, Coût unitaire, 単価, 单位成本 |

### Vendor invoice lines (`invoices`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `invoice_number` (required) | text | Invoice Number, Invoice, Invoice #, Inv No | Rechnungsnummer, N° de facture, 請求書番号, 发票号 |
| `po_number` (required) | text | PO Number, PO, PO #, Purchase Order, Customer PO | Bestellnummer, Bon de commande, 発注番号, 采购订单号 |
| `part_number` (required) | text | Part Number, Part No, Part #, Part | Teilenummer, Référence pièce, 部品番号, 零件号 |
| `qty_billed` (required) | number | Qty Billed, Qty Shipped, Quantity, Qty | Menge, Quantité, 数量, 数量 |
| `unit_price` (required) | amount | Unit Price, Net Price, Price, Dealer Net | Einzelpreis, Prix unitaire, 単価, 单价 |
| `invoice_date` | date | Invoice Date, Date, Ship Date | Rechnungsdatum, Date de facture, 請求日, 发票日期 |
| `vendor` | text | Vendor, Supplier, Distributor, Sold By | Lieferant, Fournisseur, 仕入先, 供应商 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-parts-receiving inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-parts-receiving demo
npx -y fairdrive-parts-receiving mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-parts-receiving": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-parts-receiving",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-parts-receiving -- npx -y fairdrive-parts-receiving mcp --root .`, or install the `fairdrive-parts-receiving` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-parts-receiving approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-parts-receiving approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-parts-receiving kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-parts-receiving tools                 # every tool, its policy and arguments
fairdrive-parts-receiving sources               # the columns each input is read from
fairdrive-parts-receiving inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-parts-receiving call receiving_match '{"receipts":"<receipts>","invoices":"<invoices>"}'
fairdrive-parts-receiving eval                  # the private eval cases on the fictional fixtures
fairdrive-parts-receiving demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Back orders and partial shipments show as billed but not received until the parts arrive; check open back orders before asking for a credit.
- Every figure comes from your files and settings. Check it before you act on it.
