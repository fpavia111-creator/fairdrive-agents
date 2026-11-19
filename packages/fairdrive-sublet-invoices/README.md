<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Sublet Invoices (`fairdrive-sublet-invoices`)

Matches sublet lines on repair orders (glass, alignment, towing, upholstery and other outside work) against vendor invoices by PO, or by RO and vendor, and lists invoices above the PO, closed repair orders with no sublet invoice (cost not booked, gross overstated), sublet billed below cost or not billed at all, duplicate invoices and invoices with no repair order. It never pays an invoice or closes a repair order.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-sublet-invoices demo
npx -y fairdrive-sublet-invoices mcp --root ./exports
```

## What it reads

- **Sublet lines on repair orders** (`sublet_lines`)
- **Sublet vendor invoices** (`invoices`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `sublet_match`: One row per finding, largest first: RO, PO, vendor, invoice, cost, sale, amount invoiced, finding (invoice_over_po, closed_no_invoice, sold_below_cost, not_billed, duplicate_invoice, invoice_no_ro), amount. Totals.
- `sublet_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `ap_pay_invoice` is listed and refused: It never pays or approves a vendor invoice.
- `dms_close_ro` is listed and refused: It never closes or changes a repair order.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-sublet-invoices demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Sublet Invoices demo (fictional sublet lines and vendor invoices, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 sublet line(s): cost 1330, sold 1540. 1 invoice(s) over the PO (30), 1 closed RO(s) with no invoice (410 not booked), 1 sold below cost, 1 not billed, 1 duplicate invoice(s), 1 invoice(s) with no RO.
    closed_no_invoice  RO 91004  Ridgeway Glass            410
    invoice_no_ro      RO 91099  Metro Tow                 180
    duplicate_invoice  RO 91005  Apex Alignment             95
    not_billed         RO 91005  Apex Alignment             95
    invoice_over_po    RO 91002  Apex Alignment             30
    sold_below_cost    RO 91003  Coastline Upholstery       20

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 sublet line(s): cost 1330, sold 1540. 1 invoice(s) over the PO (30), 1 closed RO(s) with no invoice (410 not booked), 1 sold below cost, 1 not billed, 1 duplicate invoice(s), 1 invoice(s) with no RO.

▶ The agent tries ap_pay_invoice itself
  status: blocked  decision: block
  reason: It never pays or approves a vendor invoice.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `sublet_match` | One row per finding, largest first: RO, PO, vendor, invoice, cost, sale, amount invoiced, finding (invoice_over_po, closed_no_invoice, sold_below_cost, not_billed, duplicate_invoice, invoice_no_ro), amount. | runs |
| `sublet_write_report` | Write sublet-invoices.csv and sublet-invoices.html (one row per finding, with the totals) into out_dir (default fairdrive-out/sublet). | runs |
| `ap_pay_invoice` | It never pays or approves a vendor invoice. | refused |
| `dms_close_ro` | It never closes or changes a repair order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Sublet lines on repair orders (`sublet_lines`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `po_number` | text | PO Number, PO, PO #, Sublet PO | Bestellnummer, Bon de commande, 発注番号, 采购订单号 |
| `vendor` | text | Vendor, Sublet Vendor, Supplier | Lieferant, Fournisseur, 仕入先, 供应商 |
| `description` | text | Description, Sublet Description, Work | Beschreibung, Description, 摘要, 摘要 |
| `sublet_cost` (required) | amount | Sublet Cost, PO Amount, Cost, Expected Cost | - |
| `sublet_sale` | amount | Sublet Sale, Sale, Billed To Customer, Sublet Sold | - |
| `ro_closed` | date | RO Closed, Closed, Close Date, Closed Date | - |

### Sublet vendor invoices (`invoices`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `invoice_number` (required) | text | Invoice Number, Invoice, Invoice #, Inv No | Rechnungsnummer, N° de facture, 請求書番号, 发票号 |
| `vendor` | text | Vendor, Supplier, Payee | Lieferant, Fournisseur, 仕入先, 供应商 |
| `po_number` | text | PO Number, PO, PO # | Bestellnummer, Bon de commande, 発注番号, 采购订单号 |
| `ro_number` | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `amount` (required) | amount | Amount, Invoice Amount, Total | Betrag, Montant, 金額, 金额 |
| `invoice_date` | date | Invoice Date, Date | Rechnungsdatum, Date de facture, 請求日, 发票日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-sublet-invoices inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-sublet-invoices demo
npx -y fairdrive-sublet-invoices mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-sublet-invoices": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-sublet-invoices",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-sublet-invoices -- npx -y fairdrive-sublet-invoices mcp --root .`, or install the `fairdrive-sublet-invoices` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-sublet-invoices approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-sublet-invoices approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-sublet-invoices kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-sublet-invoices tools                 # every tool, its policy and arguments
fairdrive-sublet-invoices sources               # the columns each input is read from
fairdrive-sublet-invoices inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-sublet-invoices call sublet_match '{"sublet_lines":"<sublet_lines>","invoices":"<invoices>"}'
fairdrive-sublet-invoices eval                  # the private eval cases on the fictional fixtures
fairdrive-sublet-invoices demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Invoices are matched by PO number first, then by RO number and vendor.
- Every figure comes from your files and settings. Check it before you act on it.
