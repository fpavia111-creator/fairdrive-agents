<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Open Repair Orders (`fairdrive-open-repair-orders`)

Ages every open repair order and totals it by age, advisor and pay type, and lists orders past their promised date, waiting on parts, warranty orders open too long (the claim cannot be filed), internal orders open too long (their cost is not booked) and customer-pay orders open too long. It never closes or changes a repair order.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-open-repair-orders demo
npx -y fairdrive-open-repair-orders mcp --root ./exports
```

## What it reads

- **Open repair orders** (`open_ros`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `openros_age`: One row per open order that needs attention, oldest first: age, bucket, advisor, pay type, status, promised date, total, findings (past_promise, waiting_parts, warranty_open_long, internal_open_long, open_long). Totals by age, advisor and pay type.
- `openros_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_close_ro` is listed and refused: It never closes, reopens or changes a repair order.
- `sms_text_customer` is listed and refused: It never texts or calls a customer.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): staff name (`advisor`), customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`ro_number`, `labor_type`, `status`, `parts_on_order`); dates (`opened`, `promised_date`); amounts and counts (`total`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-open-repair-orders demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Open Repair Orders demo (fictional open RO report, 15 November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 open repair order(s) worth 4210, oldest 48 days. 2 past the promised date, 1 waiting on parts, 1 warranty and 1 internal open too long, 1 customer-pay open too long.
    90003   48 days  warranty      ST-c3a63027  warranty_open_long
    90006   41 days  customer_pay  ST-c3a63027  past_promise, open_long
    90004   26 days  internal      ST-ae639c70  internal_open_long
    90002   14 days  customer_pay  ST-c3a63027  waiting_parts
    90001    2 days  customer_pay  ST-ae639c70  past_promise

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 open repair order(s) worth 4210, oldest 48 days. 2 past the promised date, 1 waiting on parts, 1 warranty and 1 internal open too long, 1 customer-pay open too long.

▶ The agent tries dms_close_ro itself
  status: blocked  decision: block
  reason: It never closes, reopens or changes a repair order.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `openros_age` | One row per open order that needs attention, oldest first: age, bucket, advisor, pay type, status, promised date, total, findings (past_promise, waiting_parts, warranty_open_long, internal_open_long, open_long). | runs |
| `openros_write_report` | Write open-repair-orders.csv and open-repair-orders.html (one row per finding, with the totals) into out_dir (default fairdrive-out/openros). | runs |
| `dms_close_ro` | It never closes, reopens or changes a repair order. | refused |
| `sms_text_customer` | It never texts or calls a customer. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Open repair orders (`open_ros`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order, Order # | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `opened` (required) | date | Opened, Open Date, RO Date, Created | - |
| `advisor` | text | Advisor, Service Advisor, Writer, SA | Serviceberater, Conseiller service, サービスアドバイザー, 服务顾问 |
| `customer` | text | Customer, Customer Name, Name | Kunde, Client, 顧客, 客户 |
| `labor_type` | text | Labor Type, Pay Type, Type | - |
| `status` | text | Status, RO Status, Order Status, Workflow | Status, Statut, ステータス, 状态 |
| `promised_date` | date | Promised, Promise Date, Promised Date, Due | - |
| `total` | amount | Total, RO Total, Amount, Grand Total | Betrag, Montant, 金額, 金额 |
| `parts_on_order` | yes/no | Parts On Order, Parts Ordered, Waiting Parts | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| CDK Drive | Open RO report saved as CSV | RO Number, Open Date or RO Date, Advisor or Service Advisor | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-open-repair-orders inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-open-repair-orders demo
npx -y fairdrive-open-repair-orders mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-open-repair-orders": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-open-repair-orders",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-open-repair-orders -- npx -y fairdrive-open-repair-orders mcp --root .`, or install the `fairdrive-open-repair-orders` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-open-repair-orders approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-open-repair-orders approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-open-repair-orders kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-open-repair-orders tools                 # every tool, its policy and arguments
fairdrive-open-repair-orders sources               # the columns each input is read from
fairdrive-open-repair-orders inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-open-repair-orders call openros_age '{"open_ros":"<open_ros>"}'
fairdrive-open-repair-orders eval                  # the private eval cases on the fictional fixtures
fairdrive-open-repair-orders demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
