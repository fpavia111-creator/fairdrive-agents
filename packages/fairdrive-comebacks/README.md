<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Comebacks (`fairdrive-comebacks`)

Finds repair orders where the same vehicle (by VIN) came back within your days and miles for the same op code, or with two or more significant words of the same concern, and totals comebacks by the technician on the first visit and by operation, with the comeback rate. Internal orders are not counted as a first visit. It never charges a technician or changes a repair order.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-comebacks demo
npx -y fairdrive-comebacks mcp --root ./exports
```

## What it reads

- **Repair orders** (`repair_orders`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `comebacks_find`: One row per comeback: VIN, first and return RO, dates, days and miles between, technician on the first visit, op code, concern, how it was matched (same_op_code, same_concern). Totals by technician and by op code.
- `comebacks_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `payroll_charge_back_tech` is listed and refused: It never charges a technician for a comeback.
- `dms_change_ro` is listed and refused: It never changes a repair order.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-comebacks demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Comebacks demo (fictional repair orders, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  12 repair order(s), 3 comeback(s) within 30 days and 1000 miles (25%). Most: Ines Alvarez (2).
    80010 -> 80012   2 days     30 mi  Ines Alvarez  same_op_code
    80001 -> 80015  18 days    690 mi  Ines Alvarez  same_op_code
    80003 -> 80018  23 days    550 mi  Corin Brennan  same_concern

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 12 repair order(s), 3 comeback(s) within 30 days and 1000 miles (25%). Most: Ines Alvarez (2).

▶ The agent tries payroll_charge_back_tech itself
  status: blocked  decision: block
  reason: It never charges a technician for a comeback.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `comebacks_find` | One row per comeback: VIN, first and return RO, dates, days and miles between, technician on the first visit, op code, concern, how it was matched (same_op_code, same_concern). | runs |
| `comebacks_write_report` | Write comebacks.csv and comebacks.html (one row per finding, with the totals) into out_dir (default fairdrive-out/comebacks). | runs |
| `payroll_charge_back_tech` | It never charges a technician for a comeback. | refused |
| `dms_change_ro` | It never changes a repair order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Repair orders (`repair_orders`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order, Invoice | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `vin` (required) | text | VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `customer` | text | Customer, Customer Name, Name | Kunde, Client, 顧客, 客户 |
| `opened` (required) | date | Opened, Open Date, RO Date, Date In | - |
| `closed` | date | Closed, Close Date, Closed Date | - |
| `odometer` | number | Odometer, Mileage In, Miles In, Mileage | - |
| `technician` | text | Technician, Tech, Tech Name | Mechaniker, Technicien, 整備士, 技师 |
| `op_code` | text | Op Code, Operation, Labor Op, Op | Arbeitsposition, Code opération, 作業コード, 工时代码 |
| `concern` | text | Concern, Complaint, Customer Concern, Description | - |
| `labor_type` | text | Labor Type, Pay Type, Type | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-comebacks inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-comebacks demo
npx -y fairdrive-comebacks mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-comebacks": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-comebacks",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-comebacks -- npx -y fairdrive-comebacks mcp --root .`, or install the `fairdrive-comebacks` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-comebacks approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-comebacks approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-comebacks kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-comebacks tools                 # every tool, its policy and arguments
fairdrive-comebacks sources               # the columns each input is read from
fairdrive-comebacks inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-comebacks call comebacks_find '{"repair_orders":"<repair_orders>"}'
fairdrive-comebacks eval                  # the private eval cases on the fictional fixtures
fairdrive-comebacks demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- A comeback here is a return for the same op code or concern; it is not a finding of fault. A new failure of the same part can look the same.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
