<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Sales Tax (`fairdrive-sales-tax`)

Recomputes the sales tax on each deal from the county rate table you supply (rate, whether the trade-in reduces the taxable amount, whether the doc fee is taxable, a maximum tax) and lists deals taxed over or under, and deals in a county with no rate, with totals by county. The rate table is your settings, not a tax service. It never files a return or posts to the ledger.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-sales-tax demo
npx -y fairdrive-sales-tax mcp --root ./exports
```

## What it reads

- **Deals** (`deals`)
- **County rate table (settings)** (`rates`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `salestax_check`: One row per deal taxed over or under, or with no rate, largest difference first: county, rate, taxable amount, expected and charged tax, difference. Totals by county.
- `salestax_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `tax_portal_file_return` is listed and refused: It never files or amends a tax return.
- `gl_post_entry` is listed and refused: It never posts an adjustment to the ledger.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-sales-tax demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Sales Tax demo (fictional deals and a fictional county rate table)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 deal(s): tax charged 6853.14, 5403.14 by your rate table. 2 over (509.38), 1 under (184.38), 1 in a county with no rate.
    D13003  Kessler   expected     1500  charged     2000  overcharged
    D13004  Harrow    expected  1384.38  charged     1200  undercharged
    D13002  Bellmead  expected     1250  charged  1259.38  overcharged
    D13005  Dunmore   expected        -  charged     1125  no_rate

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 deal(s): tax charged 6853.14, 5403.14 by your rate table. 2 over (509.38), 1 under (184.38), 1 in a county with no rate.

▶ The agent tries tax_portal_file_return itself
  status: blocked  decision: block
  reason: It never files or amends a tax return.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `salestax_check` | One row per deal taxed over or under, or with no rate, largest difference first: county, rate, taxable amount, expected and charged tax, difference. | runs |
| `salestax_write_report` | Write sales-tax.csv and sales-tax.html (one row per finding, with the totals) into out_dir (default fairdrive-out/salestax). | runs |
| `tax_portal_file_return` | It never files or amends a tax return. | refused |
| `gl_post_entry` | It never posts an adjustment to the ledger. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Deals (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `delivery_date` | date | Delivery Date, Deal Date, Sold Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `state` | text | State, Tax State | - |
| `county` (required) | text | County, Tax County, Taxing Jurisdiction, Jurisdiction | Landkreis, Comté, 郡名, 县名 |
| `sale_price` (required) | amount | Sale Price, Selling Price, Cash Price, Price | - |
| `trade_allowance` | amount | Trade Allowance, Trade, Trade-In Allowance, Trade Value | - |
| `doc_fee` | amount | Doc Fee, Documentary Fee, Dealer Fee, Doc Fees | - |
| `tax_charged` (required) | amount | Tax Charged, Sales Tax, Tax, Tax Amount | - |

### County rate table (settings) (`rates`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `state` | text | State | - |
| `county` (required) | text | County, Jurisdiction, Taxing Jurisdiction | Landkreis, Comté, 郡名, 县名 |
| `rate_pct` (required) | number | Rate, Rate %, Tax Rate, Combined Rate | - |
| `trade_credit` | yes/no | Trade Credit, Trade Reduces Tax, Trade-In Credit | - |
| `doc_fee_taxable` | yes/no | Doc Fee Taxable, Fees Taxable | - |
| `max_tax` | amount | Max Tax, Tax Cap, Cap | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-sales-tax inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-sales-tax demo
npx -y fairdrive-sales-tax mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-sales-tax": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-sales-tax",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-sales-tax -- npx -y fairdrive-sales-tax mcp --root .`, or install the `fairdrive-sales-tax` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-sales-tax approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-sales-tax approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-sales-tax kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-sales-tax tools                 # every tool, its policy and arguments
fairdrive-sales-tax sources               # the columns each input is read from
fairdrive-sales-tax inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-sales-tax call salestax_check '{"deals":"<deals>","rates":"<rates>"}'
fairdrive-sales-tax eval                  # the private eval cases on the fictional fixtures
fairdrive-sales-tax demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The rates, trade credit, doc fee and caps come from your table. Tax rules differ by state and change; keep the table current and have it checked.
- Not tax advice.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
