<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive We Owes (`fairdrive-we-owes`)

Lists every we-owe (due bill) promised to a customer on a deal that is open past its promise date, open too long with no promise date, or not scheduled on a repair order, and completed ones whose cost was never booked (the deal gross is overstated), with the open estimated cost by age. It never contacts a customer or changes a deal.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-we-owes demo
npx -y fairdrive-we-owes mcp --root ./exports
```

## What it reads

- **We-owe log** (`we_owes`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `weowes_check`: One row per we-owe that needs action, oldest delivery first: item, promised date, estimated cost, RO, completed date, cost booked, findings (past_promise, not_scheduled, open_long, cost_not_booked). Totals and open cost by age.
- `weowes_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `sms_text_customer` is listed and refused: It never texts, calls or e-mails a customer.
- `dms_update_deal` is listed and refused: It never changes a deal or posts a cost.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `ro_number`); dates (`delivery_date`, `promised_date`, `completed_date`); amounts and counts (`estimated_cost`, `cost_booked`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `item`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-we-owes demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive We Owes demo (fictional due bills, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 we-owe(s), 4 open (610 estimated cost still owed). 1 past the promised date, 2 not scheduled, 1 open with no promise date too long, 1 done without cost booked (about 200).
    D18003  Floor mats                    61 days  open_long, not_scheduled
    D18001  Second key fob                44 days  past_promise, not_scheduled
    D18004  Tint front windows            26 days  cost_not_booked

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 we-owe(s), 4 open (610 estimated cost still owed). 1 past the promised date, 2 not scheduled, 1 open with no promise date too long, 1 done without cost booked (about 200).

▶ The agent tries sms_text_customer itself
  status: blocked  decision: block
  reason: It never texts, calls or e-mails a customer.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `weowes_check` | One row per we-owe that needs action, oldest delivery first: item, promised date, estimated cost, RO, completed date, cost booked, findings (past_promise, not_scheduled, open_long, cost_not_booked). | runs |
| `weowes_write_report` | Write we-owes.csv and we-owes.html (one row per finding, with the totals) into out_dir (default fairdrive-out/weowes). | runs |
| `sms_text_customer` | It never texts, calls or e-mails a customer. | refused |
| `dms_update_deal` | It never changes a deal or posts a cost. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### We-owe log (`we_owes`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `delivery_date` | date | Delivery Date, Delivered, Deal Date, Sold Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `item` (required) | text | Item, We Owe, Description, Due Bill Item, Promise | Artikel, Article, 品目, 物料 |
| `promised_date` | date | Promised Date, Promised, Due Date, Promise Date | - |
| `estimated_cost` | amount | Estimated Cost, Est Cost, Cost Estimate, Estimate | - |
| `ro_number` | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `completed_date` | date | Completed, Completed Date, Done Date, Closed | - |
| `cost_booked` | amount | Cost Booked, Actual Cost, Cost Posted, Cost | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-we-owes inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-we-owes demo
npx -y fairdrive-we-owes mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-we-owes": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-we-owes",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-we-owes -- npx -y fairdrive-we-owes mcp --root .`, or install the `fairdrive-we-owes` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-we-owes approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-we-owes approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-we-owes kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-we-owes tools                 # every tool, its policy and arguments
fairdrive-we-owes sources               # the columns each input is read from
fairdrive-we-owes inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-we-owes call weowes_check '{"we_owes":"<we_owes>"}'
fairdrive-we-owes eval                  # the private eval cases on the fictional fixtures
fairdrive-we-owes demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
