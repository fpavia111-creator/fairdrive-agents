<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Reconditioning (`fairdrive-reconditioning`)

Follows every used unit from acquisition to front-line ready: days in recon against your target, reconditioning cost from the internal repair orders against budget, units stuck with orders still open, units with no recon order at all, and units on the line with orders still open. Lists recon orders for stock numbers not in the unit file. It never closes or changes a repair order.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-reconditioning demo
npx -y fairdrive-reconditioning mcp --root ./exports
```

## What it reads

- **Used units** (`units`)
- **Recon repair orders** (`repair_orders`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `recon_check`: One row per unit that needs attention: days, budget, recon cost, repair orders and how many are open, findings (over_budget, slow, stuck, waiting_no_ro, open_ro_after_frontline). Totals and recon orders with no unit.
- `recon_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_close_ro` is listed and refused: It never opens, closes or changes a repair order.
- `dms_change_inventory` is listed and refused: It never changes a vehicle record or its cost.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-reconditioning demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Reconditioning demo (fictional used units and recon repair orders, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 unit(s): 4 front-line ready (average 7.5 days, target 7), 3 in recon. Recon cost 6350. 2 over budget, 1 slow, 1 stuck with open repair orders, 1 waiting with no repair order, 1 on the line with orders still open.
    R8002   15 days  cost    1850  over_budget, slow
    R8003   14 days  cost     400  stuck
    R8007    6 days  cost    1100  open_ro_after_frontline
    R8004    5 days  cost       0  waiting_no_ro
    R8006    4 days  cost    2100  over_budget

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 unit(s): 4 front-line ready (average 7.5 days, target 7), 3 in recon. Recon cost 6350. 2 over budget, 1 slow, 1 stuck with open repair orders, 1 waiting with no repair order, 1 on the line with orders still open.

▶ The agent tries dms_close_ro itself
  status: blocked  decision: block
  reason: It never opens, closes or changes a repair order.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `recon_check` | One row per unit that needs attention: days, budget, recon cost, repair orders and how many are open, findings (over_budget, slow, stuck, waiting_no_ro, open_ro_after_frontline). | runs |
| `recon_write_report` | Write reconditioning.csv and reconditioning.html (one row per finding, with the totals) into out_dir (default fairdrive-out/recon). | runs |
| `dms_close_ro` | It never opens, closes or changes a repair order. | refused |
| `dms_change_inventory` | It never changes a vehicle record or its cost. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Used units (`units`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `vin` | text | VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `acquired_date` (required) | date | Acquired, Acquired Date, Inventory Date, Received Date, Purchase Date | - |
| `frontline_date` | date | Frontline Date, Front Line Ready, Ready Date, Lot Ready, Retail Ready | - |
| `recon_budget` | amount | Recon Budget, Budget, Reconditioning Budget | - |
| `status` | text | Status, Vehicle Status, Stock Status | Status, Statut, ステータス, 状态 |

### Recon repair orders (`repair_orders`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Stock, Internal Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `opened` | date | Open Date, Opened, RO Date, Created | - |
| `closed` | date | Close Date, Closed, Closed Date, Invoice Date | - |
| `total` (required) | amount | Total, RO Total, Internal Total, Amount, Cost | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-reconditioning inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-reconditioning demo
npx -y fairdrive-reconditioning mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-reconditioning": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-reconditioning",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-reconditioning -- npx -y fairdrive-reconditioning mcp --root .`, or install the `fairdrive-reconditioning` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-reconditioning approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-reconditioning approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-reconditioning kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-reconditioning tools                 # every tool, its policy and arguments
fairdrive-reconditioning sources               # the columns each input is read from
fairdrive-reconditioning inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-reconditioning call recon_check '{"units":"<units>","repair_orders":"<repair_orders>"}'
fairdrive-reconditioning eval                  # the private eval cases on the fictional fixtures
fairdrive-reconditioning demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Recon cost is the total of the internal repair orders in your file, at the cost the DMS shows on them.
- Every figure comes from your files and settings. Check it before you act on it.
