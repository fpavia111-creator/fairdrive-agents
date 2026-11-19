<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Parts Obsolescence (`fairdrive-parts-obsolescence`)

Classes every part on hand by months since its last sale (or its last receipt when it never sold) as active, slow, obsolete candidate or obsolete, values each class at cost, and lists idle parts by value with the returnable ones marked, so the most valuable returns go back first. It never adjusts inventory, changes a bin or returns parts.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-parts-obsolescence demo
npx -y fairdrive-parts-obsolescence mcp --root ./exports
```

## What it reads

- **Parts inventory** (`parts`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `obsolescence_check`: One row per idle part number, highest value first: on hand, cost, value, months idle, class, returnable, never sold. Totals, value by class and the obsolete percent.
- `obsolescence_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_adjust_inventory` is listed and refused: It never adjusts quantities, costs or bins.
- `oem_parts_return_submit` is listed and refused: It never submits a parts return.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-parts-obsolescence demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Parts Obsolescence demo (fictional parts inventory, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 part number(s) on hand, 2346 at cost. Obsolete 478 (20.38%); 4 part number(s) idle past 6 months, 1226 of them returnable; 1 never sold.
    MOD-BCM-2290   obsolete_candidate   10.15 months  value     610  returnable
    SNS-O2-7781    slow                  6.87 months  value     426  returnable
    TRM-DOOR-55    obsolete             17.48 months  value     288
    GSK-HD-3301    obsolete             14.45 months  value     190  returnable

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 part number(s) on hand, 2346 at cost. Obsolete 478 (20.38%); 4 part number(s) idle past 6 months, 1226 of them returnable; 1 never sold.

▶ The agent tries dms_adjust_inventory itself
  status: blocked  decision: block
  reason: It never adjusts quantities, costs or bins.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `obsolescence_check` | One row per idle part number, highest value first: on hand, cost, value, months idle, class, returnable, never sold. | runs |
| `obsolescence_write_report` | Write parts-obsolescence.csv and parts-obsolescence.html (one row per finding, with the totals) into out_dir (default fairdrive-out/obsolescence). | runs |
| `dms_adjust_inventory` | It never adjusts quantities, costs or bins. | refused |
| `oem_parts_return_submit` | It never submits a parts return. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Parts inventory (`parts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `part_number` (required) | text | Part Number, Part No, Part #, Part | Teilenummer, Référence pièce, 部品番号, 零件号 |
| `description` | text | Description, Part Description, Desc | Beschreibung, Description, 摘要, 摘要 |
| `on_hand` (required) | number | On Hand, QOH, Qty On Hand, Quantity | Bestand, Stock, 在庫数, 库存数量 |
| `unit_cost` (required) | amount | Unit Cost, Cost, Dealer Cost, Avg Cost | Stückkosten, Coût unitaire, 単価, 单位成本 |
| `last_sale_date` | date | Last Sale, Last Sale Date, Last Sold, Date Last Sold | - |
| `last_receipt_date` | date | Last Receipt, Last Received, Date Last Received | - |
| `returnable` | yes/no | Returnable, Return Eligible, RIM Eligible | - |
| `source` | text | Source, Source Code, Supplier | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-parts-obsolescence inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-parts-obsolescence demo
npx -y fairdrive-parts-obsolescence mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-parts-obsolescence": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-parts-obsolescence",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-parts-obsolescence -- npx -y fairdrive-parts-obsolescence mcp --root .`, or install the `fairdrive-parts-obsolescence` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-parts-obsolescence approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-parts-obsolescence approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-parts-obsolescence kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-parts-obsolescence tools                 # every tool, its policy and arguments
fairdrive-parts-obsolescence sources               # the columns each input is read from
fairdrive-parts-obsolescence inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-parts-obsolescence call obsolescence_check '{"parts":"<parts>"}'
fairdrive-parts-obsolescence eval                  # the private eval cases on the fictional fixtures
fairdrive-parts-obsolescence demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Returnable is the flag in your file; the manufacturer return program decides what it takes back and when.
- Months are days divided by 30.44.
- Every figure comes from your files and settings. Check it before you act on it.
