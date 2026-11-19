<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Floorplan Audit (`fairdrive-floorplan-audit`)

Matches the DMS vehicle inventory against the floorplan lender statement by VIN (full or last 8) and lists units sold but not paid off past your payoff days, payoffs falling due, units on the statement the DMS does not have, balance differences between the DMS and the lender, and units in stock that are not floored. Drafts a payoff list for one named person to approve. It never pays a lender or changes inventory.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-floorplan-audit demo
npx -y fairdrive-floorplan-audit mcp --root ./exports
```

## What it reads

- **DMS vehicle inventory** (`inventory`)
- **Floorplan lender statement** (`statement`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `floorplan_audit`: One row per finding: sold_not_paid_off (with days since sale), payoff_due, on_statement_not_in_inventory, balance_differs (DMS less lender), not_floored. Totals by finding.
- `floorplan_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `floorplan_draft_payoffs`: Write drafts/payoffs-<date>.md: every sold unit still floored, with its statement balance and total. Marked DRAFT. Approving goes through floorplan_request_pay (one named click, even in Auto); a person pays the lender.
- `floorplan_request_pay`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `lender_portal_payoff` is listed and refused: It never pays off a unit or moves money to a lender.
- `dms_change_inventory` is listed and refused: It never changes a vehicle record in the DMS.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-floorplan-audit demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Floorplan Audit demo (fictional inventory and lender statement, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 unit(s) in inventory, 6 on the floorplan statement (195750). 1 sold and not paid off (33800); 1 payoff(s) due within 5 days (28950); 1 on the statement but not in inventory (29400); 1 balance difference(s); 1 in stock but not floored.
    sold_not_paid_off              S5002  7ZZPNMXP6RA120301  33800
    on_statement_not_in_inventory  -      7ZZMESC69NA408327  29400
    balance_differs                S5004  7ZZ2XTPH7TA110178  1000
    payoff_due                     S5003  7ZZ1R4FZ9SA576862  28950
    not_floored                    S5005  7ZZLUK947KA636195  

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 unit(s) in inventory, 6 on the floorplan statement (195750). 1 sold and not paid off (33800); 1 payoff(s) due within 5 days (28950); 1 on the statement but not in inventory (29400); 1 balance difference(s); 1 in stock but not floored.

▶ Draft the payoff list
  status: executed  decision: allow  (auto)
  payoffs 2026-11-15 drafted for 62750 with 1 open marker(s) ([CHECK each amount against the lender payoff quote, which adds interest and fees to date]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: move_money stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  payoffs 2026-11-15 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries lender_portal_payoff itself
  status: blocked  decision: block
  reason: It never pays off a unit or moves money to a lender.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `floorplan_audit` | One row per finding: sold_not_paid_off (with days since sale), payoff_due, on_statement_not_in_inventory, balance_differs (DMS less lender), not_floored. | runs |
| `floorplan_write_report` | Write floorplan-audit.csv and floorplan-audit.html (one row per finding, with the totals) into out_dir (default fairdrive-out/floorplan). | runs |
| `floorplan_draft_payoffs` | Write drafts/payoffs-<date>.md: every sold unit still floored, with its statement balance and total. | asks first (Auto can be opted in) |
| `floorplan_request_pay` | After one named human click (even in Auto), record that the reviewed payoffs draft is approved in payoffs-requests.csv. | one named click, even in Auto (`move_money`) |
| `lender_portal_payoff` | It never pays off a unit or moves money to a lender. | refused |
| `dms_change_inventory` | It never changes a vehicle record in the DMS. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### DMS vehicle inventory (`inventory`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `stock_number` (required) | text | Stock No, Stock Number, Stock #, Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `vin` (required) | text | VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `status` | text | Status, Vehicle Status, Inventory Status, Stock Status | Status, Statut, ステータス, 状态 |
| `sold_date` | date | Sold Date, Date Sold, Delivery Date, Deal Date | - |
| `new_used` | text | New/Used, N/U, Type, Stock Type | - |
| `floorplan_balance` | amount | Floorplan Balance, Floor Plan Liability, Flooring Balance, FP Balance | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| CDK Drive | Vehicle inventory list saved as CSV | Stock No, VIN, Inventory Date or In Stock Date | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Floorplan lender statement (`statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vin` (required) | text | VIN, Serial Number, Collateral, Vehicle ID | FIN, Numéro de série, 車台番号, 车架号 |
| `floor_date` | date | Floor Date, Floored Date, Funding Date, Date Floored | - |
| `balance` (required) | amount | Principal Balance, Current Balance, Balance, Outstanding, Amount Due | Saldo, Solde, 残高, 余额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-floorplan-audit inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-floorplan-audit demo
npx -y fairdrive-floorplan-audit mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-floorplan-audit": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-floorplan-audit",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-floorplan-audit -- npx -y fairdrive-floorplan-audit mcp --root .`, or install the `fairdrive-floorplan-audit` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-floorplan-audit approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-floorplan-audit approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-floorplan-audit kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-floorplan-audit tools                 # every tool, its policy and arguments
fairdrive-floorplan-audit sources               # the columns each input is read from
fairdrive-floorplan-audit inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-floorplan-audit call floorplan_audit '{"inventory":"<inventory>","statement":"<statement>"}'
fairdrive-floorplan-audit eval                  # the private eval cases on the fictional fixtures
fairdrive-floorplan-audit demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Statement balances are principal only; the lender payoff adds interest and fees to date.
- Not legal or lending advice. Your floorplan agreement sets the payoff terms.
- Every figure comes from your files and settings. Check it before you act on it.
