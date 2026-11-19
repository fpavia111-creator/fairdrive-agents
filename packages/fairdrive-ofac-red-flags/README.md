<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive OFAC Red Flags (`fairdrive-ofac-red-flags`)

Checks that every deal has an OFAC check record for the buyer and any co-buyer dated on or before delivery, a Red Flags (identity) check record when credit was involved, and that each record says its result was recorded. It checks that the records exist; it makes no compliance determination, never reads or judges a check result, and never clears a possible match.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-ofac-red-flags demo
npx -y fairdrive-ofac-red-flags mcp --root ./exports
```

## What it reads

- **Deals** (`deals`)
- **OFAC and Red Flags check log** (`checks`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `redflags_check`: One row per deal with a record gap: ofac_missing, ofac_after_delivery, co_buyer_not_checked, red_flags_missing, result_not_recorded, with the number of records found. Totals. Record presence only.
- `redflags_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `ofac_clear_match` is listed and refused: It never clears, overrides or marks a possible match.
- `dms_book_deal` is listed and refused: It never books, holds or changes a deal.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-ofac-red-flags demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive OFAC Red Flags demo (fictional deals and check log, October 2026). Record presence only.

▶ Run the check on the exported files
  status: executed  decision: allow
  6 deal(s), 4 with a record gap: 1 with no OFAC check record, 1 dated after delivery, 1 co-buyer(s) not checked, 1 with no Red Flags record, 1 with a result not recorded. Record presence only; not a compliance determination.
    D17002  Retail Finance  records 2  co_buyer_not_checked
    D17003  Cash            records 1  ofac_after_delivery
    D17004  Lease           records 1  ofac_missing, result_not_recorded
    D17005  Retail Finance  records 1  red_flags_missing

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 deal(s), 4 with a record gap: 1 with no OFAC check record, 1 dated after delivery, 1 co-buyer(s) not checked, 1 with no Red Flags record, 1 with a result not recorded. Record presence only; not a compliance determination.

▶ The agent tries ofac_clear_match itself
  status: blocked  decision: block
  reason: It never clears, overrides or marks a possible match.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `redflags_check` | One row per deal with a record gap: ofac_missing, ofac_after_delivery, co_buyer_not_checked, red_flags_missing, result_not_recorded, with the number of records found. | runs |
| `redflags_write_report` | Write ofac-red-flags.csv and ofac-red-flags.html (one row per finding, with the totals) into out_dir (default fairdrive-out/redflags). | runs |
| `ofac_clear_match` | It never clears, overrides or marks a possible match. | refused |
| `dms_book_deal` | It never books, holds or changes a deal. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Deals (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Buyer, Buyer Name, Customer Name | Kunde, Client, 顧客, 客户 |
| `co_buyer` | text | Co-Buyer, Co Buyer, Cobuyer, Co-Applicant | - |
| `delivery_date` (required) | date | Delivery Date, Delivered, Sold Date, Deal Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `deal_type` | text | Deal Type, Finance Type, Payment Type | - |
| `credit_pulled` | yes/no | Credit Pulled, Credit Report, Bureau Pulled | - |
| `status` | text | Status, Deal Status | Status, Statut, ステータス, 状态 |

### OFAC and Red Flags check log (`checks`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `check_type` (required) | text | Check Type, Check, Type, Form | - |
| `person` | text | Person, Party, Applicant, Checked | - |
| `check_date` | date | Check Date, Date, Run Date, Completed | - |
| `result_recorded` | yes/no | Result Recorded, Result On File, Documented, Recorded | - |
| `performed_by` | text | Performed By, Run By, User, F&I Manager | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-ofac-red-flags inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-ofac-red-flags demo
npx -y fairdrive-ofac-red-flags mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-ofac-red-flags": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-ofac-red-flags",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-ofac-red-flags -- npx -y fairdrive-ofac-red-flags mcp --root .`, or install the `fairdrive-ofac-red-flags` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-ofac-red-flags approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-ofac-red-flags approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-ofac-red-flags kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-ofac-red-flags tools                 # every tool, its policy and arguments
fairdrive-ofac-red-flags sources               # the columns each input is read from
fairdrive-ofac-red-flags inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-ofac-red-flags call redflags_check '{"deals":"<deals>","checks":"<checks>"}'
fairdrive-ofac-red-flags eval                  # the private eval cases on the fictional fixtures
fairdrive-ofac-red-flags demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- It checks that a record exists, its date and that its result was recorded. It does not run a check, read a result or decide whether a deal meets any law; that is for your compliance officer.
- Not legal advice.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
