<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Repair Order Margins (`fairdrive-repair-order-margins`)

Works out labor and parts gross profit on every closed repair order, totals it by pay type (customer pay, warranty, internal) and by advisor, and lists customer-pay orders under your labor or parts floor, customer-pay labor given away, and parts sold below cost on any pay type. It never reprices or reopens a repair order.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-repair-order-margins demo
npx -y fairdrive-repair-order-margins mcp --root ./exports
```

## What it reads

- **Closed repair order lines** (`repair_orders`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `margins_check`: One row per repair order and pay type that needs a look: labor and parts sale, cost, gross and percent, findings (labor_gp_below_floor, parts_gp_below_floor, labor_given_away, parts_below_cost). Totals by pay type and by advisor (customer pay).
- `margins_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_reprice_ro` is listed and refused: It never reprices, reopens or changes a repair order.
- `payroll_adjust_advisor_pay` is listed and refused: It never changes advisor or technician pay.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-repair-order-margins demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Repair Order Margins demo (fictional closed repair orders, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 repair order(s). Customer-pay labor gross 61.92%, parts 39.24%. 2 under the 65% labor floor, 1 under the 30% parts floor, 1 with customer-pay labor given away, 1 with parts sold below cost.
    70002  customer_pay  labor     55%  parts      25%  labor_gp_below_floor, parts_gp_below_floor
    70004  customer_pay  labor   null%  parts   33.33%  labor_given_away
    70005  internal      labor     52%  parts  -22.22%  parts_below_cost
    70007  customer_pay  labor  64.44%  parts      40%  labor_gp_below_floor

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 repair order(s). Customer-pay labor gross 61.92%, parts 39.24%. 2 under the 65% labor floor, 1 under the 30% parts floor, 1 with customer-pay labor given away, 1 with parts sold below cost.

▶ The agent tries dms_reprice_ro itself
  status: blocked  decision: block
  reason: It never reprices, reopens or changes a repair order.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `margins_check` | One row per repair order and pay type that needs a look: labor and parts sale, cost, gross and percent, findings (labor_gp_below_floor, parts_gp_below_floor, labor_given_away, parts_below_cost). | runs |
| `margins_write_report` | Write repair-order-margins.csv and repair-order-margins.html (one row per finding, with the totals) into out_dir (default fairdrive-out/margins). | runs |
| `dms_reprice_ro` | It never reprices, reopens or changes a repair order. | refused |
| `payroll_adjust_advisor_pay` | It never changes advisor or technician pay. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Closed repair order lines (`repair_orders`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order, Invoice | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `closed_date` | date | Closed Date, Close Date, Closed, Invoice Date | - |
| `advisor` | text | Advisor, Service Advisor, Writer, SA | Serviceberater, Conseiller service, サービスアドバイザー, 服务顾问 |
| `customer` | text | Customer, Customer Name, Name | Kunde, Client, 顧客, 客户 |
| `labor_type` | text | Labor Type, Pay Type, Type, Payment Type | - |
| `labor_sale` | amount | Labor Sale, Labor Sales, Labor, Labor Amount | - |
| `labor_cost` | amount | Labor Cost, Tech Cost, Labor Cost Amount | - |
| `parts_sale` | amount | Parts Sale, Parts Sales, Parts, Parts Amount | - |
| `parts_cost` | amount | Parts Cost, Parts Cost Amount | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-repair-order-margins inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-repair-order-margins demo
npx -y fairdrive-repair-order-margins mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-repair-order-margins": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-repair-order-margins",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-repair-order-margins -- npx -y fairdrive-repair-order-margins mcp --root .`, or install the `fairdrive-repair-order-margins` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-repair-order-margins approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-repair-order-margins approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-repair-order-margins kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-repair-order-margins tools                 # every tool, its policy and arguments
fairdrive-repair-order-margins sources               # the columns each input is read from
fairdrive-repair-order-margins inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-repair-order-margins call margins_check '{"repair_orders":"<repair_orders>"}'
fairdrive-repair-order-margins eval                  # the private eval cases on the fictional fixtures
fairdrive-repair-order-margins demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Labor cost is the technician cost in your file; how it is loaded (flat rate, hourly, benefits) is your DMS setting.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
