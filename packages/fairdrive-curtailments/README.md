<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Curtailments (`fairdrive-curtailments`)

Works out the curtailment (principal pay-down) each floored unit owes under the schedule in your floorplan agreement, separately for new and used units, and lists what is overdue (including units past their last step, where the whole balance is due) and what falls due in the coming weeks, with totals by week for cash planning. It never pays a lender.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-curtailments demo
npx -y fairdrive-curtailments mcp --root ./exports
```

## What it reads

- **Floorplan statement** (`statement`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `curtailments_schedule`: One row per unit with a curtailment overdue or due within the horizon: age, amount paid down, amount required now, overdue, next due date and amount. Totals and a table by week.
- `curtailments_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `lender_portal_pay` is listed and refused: It never pays a curtailment or moves money to a lender.
- `dms_change_inventory` is listed and refused: It never changes a vehicle record in the DMS.

## What the AI model sees

- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.
- **Sent as they are:** ids, codes and names of businesses (`stock_number`, `new_used`); VINs (`vin`; pseudonymised with `--pii strict`); dates (`floor_date`); amounts and counts (`original_amount`, `balance`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-curtailments demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Curtailments demo (fictional floorplan statement, November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 floored unit(s), 185800 outstanding. 3 with curtailments overdue (17100); 2 coming due in the next 4 week(s) (4500).
    overdue   U6107  used age 189      9600  
    overdue   N6101  new  age  97      4000  
    overdue   N6103  new  age 198      3500  
    due_soon  U6105  used age 118      1500  2026-11-18
    due_soon  N6102  new  age  87      3000  2026-11-19

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 floored unit(s), 185800 outstanding. 3 with curtailments overdue (17100); 2 coming due in the next 4 week(s) (4500).

▶ The agent tries lender_portal_pay itself
  status: blocked  decision: block
  reason: It never pays a curtailment or moves money to a lender.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `curtailments_schedule` | One row per unit with a curtailment overdue or due within the horizon: age, amount paid down, amount required now, overdue, next due date and amount. | runs |
| `curtailments_write_report` | Write curtailments.csv and curtailments.html (one row per finding, with the totals) into out_dir (default fairdrive-out/curtailments). | runs |
| `lender_portal_pay` | It never pays a curtailment or moves money to a lender. | refused |
| `dms_change_inventory` | It never changes a vehicle record in the DMS. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Floorplan statement (`statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vin` (required) | text | VIN, Serial Number, Collateral | FIN, Numéro de série, 車台番号, 车架号 |
| `stock_number` | text | Stock No, Stock Number, Stock #, Dealer Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `floor_date` (required) | date | Floor Date, Floored Date, Funding Date, Date Floored | - |
| `original_amount` (required) | amount | Original Amount, Amount Floored, Original Principal, Advance | - |
| `balance` (required) | amount | Principal Balance, Current Balance, Balance, Outstanding | Saldo, Solde, 残高, 余额 |
| `new_used` | text | New/Used, N/U, Type, Collateral Type | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-curtailments inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-curtailments demo
npx -y fairdrive-curtailments mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-curtailments": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-curtailments",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-curtailments -- npx -y fairdrive-curtailments mcp --root .`, or install the `fairdrive-curtailments` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-curtailments approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-curtailments approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-curtailments kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-curtailments tools                 # every tool, its policy and arguments
fairdrive-curtailments sources               # the columns each input is read from
fairdrive-curtailments inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-curtailments call curtailments_schedule '{"statement":"<statement>"}'
fairdrive-curtailments eval                  # the private eval cases on the fictional fixtures
fairdrive-curtailments demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The default schedules are working examples, not any lender's terms. Pass the schedule from your floorplan agreement.
- Not lending advice. A person pays the lender.
- Every figure comes from your files and settings. Check it before you act on it.
