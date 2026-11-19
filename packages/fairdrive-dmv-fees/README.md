<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive DMV Fees (`fairdrive-dmv-fees`)

Compares the title, registration and plate fees collected on each deal with what the DMV or tag agency charged (matched by deal number, then VIN), and lists fees over-collected (money that may belong to the customer), under-collected (fees the store paid), collected but not paid yet, and charges that match no deal. It never issues a refund or pays the DMV.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-dmv-fees demo
npx -y fairdrive-dmv-fees mcp --root ./exports
```

## What it reads

- **Delivered deals with fees collected** (`deals`)
- **DMV or tag agency charges** (`charges`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `dmvfees_reconcile`: One row per finding, largest first: deal, customer, VIN, collected, charged, finding (overcollected, undercollected, not_paid_yet, charge_without_deal), amount. Totals.
- `dmvfees_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `ap_issue_refund` is listed and refused: It never issues a customer refund.
- `dmv_submit_payment` is listed and refused: It never pays the DMV or a tag agency.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-dmv-fees demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive DMV Fees demo (fictional deals and tag agency charges, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 deal(s): fees collected 1957.5, charged 1340.25. 1 over-collected (50), 1 under-collected (35.75), 1 not paid yet (298), 1 charge(s) with no deal (199).
    not_paid_yet         D12004  collected     298  charged          298
    charge_without_deal  D12099  collected          charged     199  199
    overcollected        D12002  collected     412  charged     362  50
    undercollected       D12003  collected     280  charged  315.75  35.75

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 deal(s): fees collected 1957.5, charged 1340.25. 1 over-collected (50), 1 under-collected (35.75), 1 not paid yet (298), 1 charge(s) with no deal (199).

▶ The agent tries ap_issue_refund itself
  status: blocked  decision: block
  reason: It never issues a customer refund.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `dmvfees_reconcile` | One row per finding, largest first: deal, customer, VIN, collected, charged, finding (overcollected, undercollected, not_paid_yet, charge_without_deal), amount. | runs |
| `dmvfees_write_report` | Write dmv-fees.csv and dmv-fees.html (one row per finding, with the totals) into out_dir (default fairdrive-out/dmvfees). | runs |
| `ap_issue_refund` | It never issues a customer refund. | refused |
| `dmv_submit_payment` | It never pays the DMV or a tag agency. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Delivered deals with fees collected (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `vin` | text | VIN, Vehicle VIN | FIN, Numéro de série, 車台番号, 车架号 |
| `delivery_date` (required) | date | Delivery Date, Delivered, Sold Date, Deal Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `state` | text | State, Title State, Registration State | - |
| `fees_collected` (required) | amount | Fees Collected, DMV Fees, Title and Registration, Tag Fees, Government Fees | - |

### DMV or tag agency charges (`charges`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` | text | Deal No, Deal Number, Deal #, Reference | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `vin` | text | VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `charge_date` | date | Charge Date, Date, Transaction Date, Posted | - |
| `amount` (required) | amount | Amount, Fee Amount, Total Fees, Charged | Betrag, Montant, 金額, 金额 |
| `agency` | text | Agency, Tag Agency, Office, County Office | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-dmv-fees inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-dmv-fees demo
npx -y fairdrive-dmv-fees mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-dmv-fees": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-dmv-fees",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-dmv-fees -- npx -y fairdrive-dmv-fees mcp --root .`, or install the `fairdrive-dmv-fees` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-dmv-fees approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-dmv-fees approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-dmv-fees kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-dmv-fees tools                 # every tool, its policy and arguments
fairdrive-dmv-fees sources               # the columns each input is read from
fairdrive-dmv-fees inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-dmv-fees call dmvfees_reconcile '{"deals":"<deals>","charges":"<charges>"}'
fairdrive-dmv-fees eval                  # the private eval cases on the fictional fixtures
fairdrive-dmv-fees demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Whether an over-collected fee is refunded is a decision for a person under your state rules; this report does not decide it.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
