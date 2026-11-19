<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Sales Commissions (`fairdrive-sales-commissions`)

Works out each salesperson's commission on every deal from your pay plans (front and back percentages, a minimum per deal, split deals shared equally), totals it by salesperson, and, with a paid file, lists commissions underpaid, overpaid, unpaid or paid on no deal, and deals for salespeople with no plan. Drafts one salesperson's commission sheet for one named person to approve. It never runs payroll.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-sales-commissions demo
npx -y fairdrive-sales-commissions mcp --root ./exports
```

## What it reads

- **Delivered deals** (`deals`)
- **Pay plans (settings)** (`plans`)
- **Commissions paid** (`paid`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `commissions_compute`: Findings (underpaid, overpaid, unpaid, no_plan, paid_without_deal) with the commission computed and paid, every deal line under lines, and a summary by salesperson: units, front and back gross, commission, paid, difference.
- `commissions_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `commissions_draft_sheet`: Write drafts/sheet-<salesperson>.md: that salesperson's deals, shares, gross and commission, with the total. Marked DRAFT. Approving goes through commissions_request_pay (one named click, even in Auto); payroll is run by a person.
- `commissions_request_pay`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `payroll_submit` is listed and refused: It never submits commissions or pay to payroll.
- `dms_change_deal_gross` is listed and refused: It never changes a deal or its gross.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): staff name (`salesperson`), staff name (`split_with`), customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `sale_type`); dates (`delivery_date`); amounts and counts (`front_gross`, `back_gross`, `front_pct`, `back_pct`, `mini`, `amount_paid`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-sales-commissions demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Sales Commissions demo (fictional salespeople, pay plans and deals, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  5 deal(s), 3 salesperson(s): 1955 commission by the pay plans. 1485 paid; 1 underpaid (110), 0 overpaid, 1 unpaid (360), 1 paid with no deal. 1 deal line(s) with no pay plan.
    ST-e896ae94    units  1.5  commission    1055  paid    1055
    ST-9b83e7a1    units  2.5  commission     900  paid     430
    ST-c0e9d756    units    1  commission       -  paid       0
    underpaid: ST-9b83e7a1 D14003
    unpaid: ST-9b83e7a1 D14004
    no_plan: ST-c0e9d756 D14005
    paid_without_deal: ST-e896ae94 D14099

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 5 deal(s), 3 salesperson(s): 1955 commission by the pay plans. 1485 paid; 1 underpaid (110), 0 overpaid, 1 unpaid (360), 1 paid with no deal. 1 deal line(s) with no pay plan.

▶ Draft the commission sheet for Bianca Sol
  status: executed  decision: allow  (auto)
  sheet ST-9b83e7a1 drafted for 900 with 1 open marker(s) ([CHECK the pay plan, spiffs, draws and chargebacks before this goes to payroll]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: move_money stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  sheet ST-9b83e7a1 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries payroll_submit itself
  status: blocked  decision: block
  reason: It never submits commissions or pay to payroll.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `commissions_compute` | Findings (underpaid, overpaid, unpaid, no_plan, paid_without_deal) with the commission computed and paid, every deal line under lines, and a summary by salesperson: units, front and back gross, commission, paid, diffe… | runs |
| `commissions_write_report` | Write sales-commissions.csv and sales-commissions.html (one row per finding, with the totals) into out_dir (default fairdrive-out/commissions). | runs |
| `commissions_draft_sheet` | Write drafts/sheet-<salesperson>.md: that salesperson's deals, shares, gross and commission, with the total. | asks first (Auto can be opted in) |
| `commissions_request_pay` | After one named human click (even in Auto), record that the reviewed sheet draft is approved in sheet-requests.csv. | one named click, even in Auto (`move_money`) |
| `payroll_submit` | It never submits commissions or pay to payroll. | refused |
| `dms_change_deal_gross` | It never changes a deal or its gross. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Delivered deals (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `delivery_date` | date | Delivery Date, Deal Date, Sold Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `salesperson` (required) | text | Salesperson, Sales Person, Salesperson 1, Sales Rep | Verkäufer, Vendeur, 営業担当, 销售顾问 |
| `split_with` | text | Split With, Salesperson 2, Second Salesperson, Split | - |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `sale_type` | text | Sale Type, New/Used, N/U | - |
| `front_gross` | amount | Front Gross, Front End Gross, Front | - |
| `back_gross` | amount | Back Gross, Back End Gross, F&I Gross, Back | - |

### Pay plans (settings) (`plans`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `salesperson` (required) | text | Salesperson, Sales Person, Name, Employee | Verkäufer, Vendeur, 営業担当, 销售顾问 |
| `front_pct` (required) | number | Front %, Front Pct, Front Percent, Commission % | - |
| `back_pct` | number | Back %, Back Pct, Back Percent | - |
| `mini` | amount | Mini, Minimum, Flat Minimum, Mini Deal | - |

### Commissions paid (`paid`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `salesperson` (required) | text | Salesperson, Sales Person, Name, Employee | Verkäufer, Vendeur, 営業担当, 销售顾问 |
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `amount_paid` (required) | amount | Amount Paid, Paid, Commission Paid, Amount | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-sales-commissions inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-sales-commissions demo
npx -y fairdrive-sales-commissions mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-sales-commissions": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-sales-commissions",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-sales-commissions -- npx -y fairdrive-sales-commissions mcp --root .`, or install the `fairdrive-sales-commissions` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-sales-commissions approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-sales-commissions approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-sales-commissions kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-sales-commissions tools                 # every tool, its policy and arguments
fairdrive-sales-commissions sources               # the columns each input is read from
fairdrive-sales-commissions inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-sales-commissions call commissions_compute '{"deals":"<deals>","plans":"<plans>"}'
fairdrive-sales-commissions eval                  # the private eval cases on the fictional fixtures
fairdrive-sales-commissions demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Commission follows the plan file: percent of front and back gross (negative gross counts as zero), the greater of that and the mini, split equally on split deals. Spiffs, draws, packs and chargebacks are not in ver 1.
- Pay is decided by a person under your pay plans and wage law.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
