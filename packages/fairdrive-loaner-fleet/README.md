<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Loaner Fleet (`fairdrive-loaner-fleet`)

Checks service loaners and demonstrators against the day and mileage limits of your manufacturer or store program, and lists units past or near a limit, loaners out with no repair order on the agreement, and loan agreements open too long. Retailed units are left out. It never retails, defleets or changes a unit.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-loaner-fleet demo
npx -y fairdrive-loaner-fleet mcp --root ./exports
```

## What it reads

- **Loaner and demo units** (`fleet`)
- **Loan agreements** (`agreements`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `loaners_check`: One row per unit that needs action, longest in service first: use, days and miles in service, out now, findings (over_days, over_miles, near_limit, loaner_out_no_ro, agreement_open_long). Totals.
- `loaners_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_retail_unit` is listed and refused: It never moves a loaner or demo into retail inventory or changes a unit.
- `oem_portal_defleet` is listed and refused: It never files a loaner program claim or defleet request.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-loaner-fleet demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Loaner Fleet demo (fictional loaners, demos and agreements, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 loaner and demo unit(s), 2 out now. 1 past 180 days, 1 past 6000 miles, 1 near a limit; 1 out with no repair order, 1 out too long.
    L2    loaner  228 days   4080 mi  over_days
    L1    loaner  167 days   5190 mi  near_limit
    L3    demo     92 days   7385 mi  over_miles
    L5    loaner   66 days   2488 mi  agreement_open_long
    L6    loaner   56 days   1892 mi  loaner_out_no_ro

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 loaner and demo unit(s), 2 out now. 1 past 180 days, 1 past 6000 miles, 1 near a limit; 1 out with no repair order, 1 out too long.

▶ The agent tries dms_retail_unit itself
  status: blocked  decision: block
  reason: It never moves a loaner or demo into retail inventory or changes a unit.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `loaners_check` | One row per unit that needs action, longest in service first: use, days and miles in service, out now, findings (over_days, over_miles, near_limit, loaner_out_no_ro, agreement_open_long). | runs |
| `loaners_write_report` | Write loaner-fleet.csv and loaner-fleet.html (one row per finding, with the totals) into out_dir (default fairdrive-out/loaners). | runs |
| `dms_retail_unit` | It never moves a loaner or demo into retail inventory or changes a unit. | refused |
| `oem_portal_defleet` | It never files a loaner program claim or defleet request. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Loaner and demo units (`fleet`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Unit | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `vin` | text | VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `use` | text | Use, Type, Fleet Type, Program | - |
| `in_service_date` (required) | date | In Service Date, In Service, Put In Service, Loaner Date | - |
| `odometer` | number | Odometer, Current Miles, Mileage | - |
| `odometer_in_service` | number | Odometer In Service, Start Miles, Miles In Service | - |
| `status` | text | Status, Unit Status | Status, Statut, ステータス, 状态 |

### Loan agreements (`agreements`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Unit | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `out_date` (required) | date | Out Date, Date Out, Loaned, Start | - |
| `return_date` | date | Return Date, Date In, Returned, End | - |
| `ro_number` | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `customer` | text | Customer, Customer Name, Driver | Kunde, Client, 顧客, 客户 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-loaner-fleet inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-loaner-fleet demo
npx -y fairdrive-loaner-fleet mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-loaner-fleet": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-loaner-fleet",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-loaner-fleet -- npx -y fairdrive-loaner-fleet mcp --root .`, or install the `fairdrive-loaner-fleet` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-loaner-fleet approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-loaner-fleet approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-loaner-fleet kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-loaner-fleet tools                 # every tool, its policy and arguments
fairdrive-loaner-fleet sources               # the columns each input is read from
fairdrive-loaner-fleet inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-loaner-fleet call loaners_check '{"fleet":"<fleet>"}'
fairdrive-loaner-fleet eval                  # the private eval cases on the fictional fixtures
fairdrive-loaner-fleet demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Day and mileage limits are settings; take them from your manufacturer loaner or demo program.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
