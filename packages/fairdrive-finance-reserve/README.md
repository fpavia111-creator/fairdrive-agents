<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Finance Reserve (`fairdrive-finance-reserve`)

Works out the finance reserve each deal should earn (the lender's share of the finance charge between buy rate and contract rate, or a flat fee) and compares it, and the expected F&I product income, with what lenders and providers paid. Lists reserve missing, short or over, product income missing or short, and payments with no deal, and drafts a reserve inquiry to one lender for a person to send. It never posts to the ledger.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-finance-reserve demo
npx -y fairdrive-finance-reserve mcp --root ./exports
```

## What it reads

- **Deal recap (financed deals)** (`deals`)
- **Reserve and product income received** (`payments`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `reserve_check`: One row per deal that needs attention: method (rate markup or flat), expected and received reserve, product income expected and received, findings (reserve_missing, reserve_short, reserve_over, product_income_missing, product_income_short, cannot_compute). Totals, a list by lender and payments with no deal.
- `reserve_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `reserve_draft_inquiry`: Write drafts/inquiry-<lender>.md: the deals where one lender paid no reserve or less than expected, with the rates. Marked DRAFT. Sending goes through reserve_request_send (one click).
- `reserve_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `gl_post_reserve` is listed and refused: It never posts reserve or product income to the ledger.
- `lender_portal_message` is listed and refused: It never writes to a lender portal.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-finance-reserve demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Finance Reserve demo (fictional deals and payments, August to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  8 deal(s): reserve expected 6965.91, received 3393.07. 1 with no reserve, 1 paid short, 0 paid over; 2317.72 short in total. Product income short 1700. 1 deal(s) lack the rates or term to compute.
    D4004  Bluegate Bank        expected  2217.72  received        0  reserve_missing, product_income_short
    D4002  Harbor Auto Finance  expected   927.42  received   827.42  reserve_short
    D4005  Summit Credit Union  expected   659.88  received   659.88  product_income_missing
    D4008  Bluegate Bank        expected     null  received        0  cannot_compute

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 8 deal(s): reserve expected 6965.91, received 3393.07. 1 with no reserve, 1 paid short, 0 paid over; 2317.72 short in total. Product income short 1700. 1 deal(s) lack the rates or term to compute.

▶ Draft the reserve inquiry to Harbor Auto Finance
  status: executed  decision: allow  (auto)
  inquiry Harbor Auto Finance drafted for 100 with 2 open marker(s) ([TO CONFIRM Harbor Auto Finance dealer support contact], [CHECK the reserve terms in your agreement with Harbor Auto Finance: the expected figures assume 75% of the rate markup, or the flat fee shown on the deal]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  inquiry Harbor-Auto-Finance approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries gl_post_reserve itself
  status: blocked  decision: block
  reason: It never posts reserve or product income to the ledger.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `reserve_check` | One row per deal that needs attention: method (rate markup or flat), expected and received reserve, product income expected and received, findings (reserve_missing, reserve_short, reserve_over, product_income_missing,… | runs |
| `reserve_write_report` | Write finance-reserve.csv and finance-reserve.html (one row per finding, with the totals) into out_dir (default fairdrive-out/reserve). | runs |
| `reserve_draft_inquiry` | Write drafts/inquiry-<lender>.md: the deals where one lender paid no reserve or less than expected, with the rates. | asks first (Auto can be opted in) |
| `reserve_request_send` | After one named human click (even in Auto), record that the reviewed inquiry draft is approved in inquiry-requests.csv. | one named click, even in Auto (`binding_send`) |
| `gl_post_reserve` | It never posts reserve or product income to the ledger. | refused |
| `lender_portal_message` | It never writes to a lender portal. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Deal recap (financed deals) (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal #, Deal ID | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `lender` (required) | text | Lender, Finance Source, Bank, Lienholder | Kreditgeber, Prêteur, 金融機関, 贷款机构 |
| `contract_date` | date | Contract Date, Deal Date, Sold Date | - |
| `amount_financed` (required) | amount | Amount Financed, Amt Financed, Financed Amount | - |
| `buy_rate` | number | Buy Rate, Buy APR, Lender Rate | - |
| `contract_rate` | number | Contract Rate, Sell Rate, APR, Customer Rate | - |
| `term_months` | number | Term, Term Months, Months | - |
| `flat_fee` | amount | Flat Fee, Flat Reserve, Flat | - |
| `product_income_expected` | amount | Product Income, Product Commission, Back End Products, Products Gross | - |

### Reserve and product income received (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Dealer Ref, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `lender` | text | Lender, Payer, Paid By, Source | Kreditgeber, Prêteur, 金融機関, 贷款机构 |
| `kind` | text | Kind, Type, Payment Type, Description | - |
| `amount` (required) | amount | Amount, Amount Paid, Paid | Betrag, Montant, 金額, 金额 |
| `paid_date` | date | Paid Date, Date, Payment Date | Zahlungsdatum, Date de paiement, 支払日, 付款日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-finance-reserve inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-finance-reserve demo
npx -y fairdrive-finance-reserve mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-finance-reserve": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-finance-reserve",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-finance-reserve -- npx -y fairdrive-finance-reserve mcp --root .`, or install the `fairdrive-finance-reserve` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-finance-reserve approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-finance-reserve approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-finance-reserve kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-finance-reserve tools                 # every tool, its policy and arguments
fairdrive-finance-reserve sources               # the columns each input is read from
fairdrive-finance-reserve inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-finance-reserve call reserve_check '{"deals":"<deals>","payments":"<payments>"}'
fairdrive-finance-reserve eval                  # the private eval cases on the fictional fixtures
fairdrive-finance-reserve demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Expected reserve assumes a simple-interest installment contract and the share you set. Lenders differ (caps, flat fees, rate limits, prepaid finance charges); your lender agreements decide.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
