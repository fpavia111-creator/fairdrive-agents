<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Customer Deposits (`fairdrive-customer-deposits`)

Matches customer deposits with deals and lists deposits not applied to a delivered deal, deposits on dead or lost deals that are due back to the customer (overdue after your days), deposits held with no deal, and deposits pointing to a deal that is not in the file, with the amount still held. It never issues a refund or applies a deposit.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-customer-deposits demo
npx -y fairdrive-customer-deposits mcp --root ./exports
```

## What it reads

- **Customer deposits** (`deposits`)
- **Deals** (`deals`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `deposits_match`: One row per deposit that needs action, largest first: receipt, date, age, customer, amount, deal and its status, finding (not_applied, refund_overdue, refund_due, held_no_deal, applied_to_missing_deal). Totals.
- `deposits_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `ap_issue_refund` is listed and refused: It never refunds a deposit.
- `dms_apply_deposit` is listed and refused: It never applies or moves a deposit in the DMS.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-customer-deposits demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Customer Deposits demo (fictional deposits and deals, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  9 deposit(s), 7 still held (5950). 1 not applied to a delivered deal (1000); 1 refund(s) overdue and 1 due on dead deals (2300); 1 held with no deal; 1 pointing to a deal not in the file.
    refund_overdue           R-504    2000  D15004
    not_applied              R-501    1000  D15001
    held_no_deal             R-502     500  -
    applied_to_missing_deal  R-507     400  D15099
    refund_due               R-505     300  D15005

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 9 deposit(s), 7 still held (5950). 1 not applied to a delivered deal (1000); 1 refund(s) overdue and 1 due on dead deals (2300); 1 held with no deal; 1 pointing to a deal not in the file.

▶ The agent tries ap_issue_refund itself
  status: blocked  decision: block
  reason: It never refunds a deposit.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `deposits_match` | One row per deposit that needs action, largest first: receipt, date, age, customer, amount, deal and its status, finding (not_applied, refund_overdue, refund_due, held_no_deal, applied_to_missing_deal). | runs |
| `deposits_write_report` | Write customer-deposits.csv and customer-deposits.html (one row per finding, with the totals) into out_dir (default fairdrive-out/deposits). | runs |
| `ap_issue_refund` | It never refunds a deposit. | refused |
| `dms_apply_deposit` | It never applies or moves a deposit in the DMS. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Customer deposits (`deposits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `receipt_number` (required) | text | Receipt Number, Receipt, Receipt #, Control Number | - |
| `date` (required) | date | Date, Receipt Date, Deposit Date | Datum, Date, 日付, 日期 |
| `customer` | text | Customer, Customer Name, Received From, Name | Kunde, Client, 顧客, 客户 |
| `amount` (required) | amount | Amount, Deposit Amount, Deposit | Betrag, Montant, 金額, 金额 |
| `deal_number` | text | Deal No, Deal Number, Deal #, Applied To | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `status` | text | Status, Deposit Status | Status, Statut, ステータス, 状态 |
| `refunded_date` | date | Refunded, Refund Date, Refunded Date | - |

### Deals (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `status` (required) | text | Deal Status, Status | Status, Statut, ステータス, 状态 |
| `delivery_date` | date | Delivery Date, Delivered, Sold Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-customer-deposits inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-customer-deposits demo
npx -y fairdrive-customer-deposits mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-customer-deposits": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-customer-deposits",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-customer-deposits -- npx -y fairdrive-customer-deposits mcp --root .`, or install the `fairdrive-customer-deposits` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-customer-deposits approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-customer-deposits approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-customer-deposits kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-customer-deposits tools                 # every tool, its policy and arguments
fairdrive-customer-deposits sources               # the columns each input is read from
fairdrive-customer-deposits inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-customer-deposits call deposits_match '{"deposits":"<deposits>","deals":"<deals>"}'
fairdrive-customer-deposits eval                  # the private eval cases on the fictional fixtures
fairdrive-customer-deposits demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Refund timing on a dead deal is set by your policy and state law; the days are a setting.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
