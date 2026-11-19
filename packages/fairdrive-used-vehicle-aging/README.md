<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Used Vehicle Aging (`fairdrive-used-vehicle-aging`)

Ages the used-vehicle inventory by days in stock and totals cost by age, and flags units past your wholesale age, priced above market or well below it (with the market figure you supply), listed below cost, with a price unchanged for too long, or with no price. Sold, wholesaled and transferred units are left out. It never changes a price or lists a car at auction.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-used-vehicle-aging demo
npx -y fairdrive-used-vehicle-aging mcp --root ./exports
```

## What it reads

- **Used-vehicle inventory** (`inventory`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `aging_check`: One row per unit that needs a look: age and bucket, cost, list and market price, price-to-market percent, days since the last price change, findings (over_wholesale_age, priced_above_market, priced_well_below_market, price_below_cost, stale_price, no_price). Totals and cost by age.
- `aging_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_change_price` is listed and refused: It never changes a price in the DMS or on a website.
- `auction_list_vehicle` is listed and refused: It never lists a vehicle at auction.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-used-vehicle-aging demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Used Vehicle Aging demo (fictional used inventory, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 used unit(s) in stock, 122300 at cost, average age 48 days. 2 past 60 days (32300); 1 priced above market, 1 well below; 1 below cost; 2 with a stale price; 1 with no price.
    U7004  106 days  cost   9800  over_wholesale_age, priced_well_below_market
    U7002   75 days  cost  22500  over_wholesale_age, priced_above_market, stale_price
    U7003   45 days  cost  15000  price_below_cost
    U7006   36 days  cost  26000  stale_price
    U7005    5 days  cost  31000  no_price

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 used unit(s) in stock, 122300 at cost, average age 48 days. 2 past 60 days (32300); 1 priced above market, 1 well below; 1 below cost; 2 with a stale price; 1 with no price.

▶ The agent tries dms_change_price itself
  status: blocked  decision: block
  reason: It never changes a price in the DMS or on a website.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `aging_check` | One row per unit that needs a look: age and bucket, cost, list and market price, price-to-market percent, days since the last price change, findings (over_wholesale_age, priced_above_market, priced_well_below_market, … | runs |
| `aging_write_report` | Write used-vehicle-aging.csv and used-vehicle-aging.html (one row per finding, with the totals) into out_dir (default fairdrive-out/aging). | runs |
| `dms_change_price` | It never changes a price in the DMS or on a website. | refused |
| `auction_list_vehicle` | It never lists a vehicle at auction. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Used-vehicle inventory (`inventory`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `vin` | text | VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `year` | number | Year, Model Year, Yr | - |
| `description` | text | Description, Vehicle, Make/Model, Year Make Model, YMM | Beschreibung, Description, 摘要, 摘要 |
| `received_date` (required) | date | Received Date, Inventory Date, In Stock Date, Stock Date, Acquired | Eingangsdatum, Date de réception, 受領日, 收到日期 |
| `cost` (required) | amount | Cost, Total Cost, Inventory Cost, Book Value, Unit Cost | - |
| `list_price` | amount | List Price, Internet Price, Asking Price, Price, Sticker | - |
| `market_price` | amount | Market Price, Market Average, Market Value, Retail Market | - |
| `last_price_change` | date | Last Price Change, Price Changed, Last Reprice, Price Date | - |
| `odometer` | number | Odometer, Mileage, Miles | - |
| `status` | text | Status, Vehicle Status, Stock Status | Status, Statut, ステータス, 状态 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| DealerSocket | Inventory export (CSV) | Stock #, VIN, Days In Stock or Age | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-used-vehicle-aging inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-used-vehicle-aging demo
npx -y fairdrive-used-vehicle-aging mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-used-vehicle-aging": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-used-vehicle-aging",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-used-vehicle-aging -- npx -y fairdrive-used-vehicle-aging mcp --root .`, or install the `fairdrive-used-vehicle-aging` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-used-vehicle-aging approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-used-vehicle-aging approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-used-vehicle-aging kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-used-vehicle-aging tools                 # every tool, its policy and arguments
fairdrive-used-vehicle-aging sources               # the columns each input is read from
fairdrive-used-vehicle-aging inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-used-vehicle-aging call aging_check '{"inventory":"<inventory>"}'
fairdrive-used-vehicle-aging eval                  # the private eval cases on the fictional fixtures
fairdrive-used-vehicle-aging demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Market prices are the figures in your file (from your pricing tool); this agent does not look them up.
- It suggests where to look; a manager decides prices and wholesale.
- Every figure comes from your files and settings. Check it before you act on it.
