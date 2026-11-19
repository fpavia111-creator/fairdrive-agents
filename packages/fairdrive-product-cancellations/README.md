<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Product Cancellations (`fairdrive-product-cancellations`)

Recomputes the dealer chargeback on every cancelled F&I product (service contract, GAP, maintenance, appearance) as the product's profit times the unused share of its term, flags chargebacks above that figure or above the profit earned, chargebacks below it (a second one may follow) and refunds not yet sent, and drafts a review request to the provider for a person to send. It never cancels a product, issues a refund or posts to the ledger.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-product-cancellations demo
npx -y fairdrive-product-cancellations mcp --root ./exports
```

## What it reads

- **Cancelled F&I products** (`cancellations`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `cancellations_check`: One row per cancellation that needs attention: profit, days used, unused share, expected and charged chargeback, difference, refund waiting days, findings (chargeback_above_expected, chargeback_below_expected, chargeback_above_profit, refund_not_sent, cannot_compute). Totals and a list by provider.
- `cancellations_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `cancellations_draft_dispute`: Write drafts/dispute-<provider>.md: every chargeback from one provider above the pro-rata figure, with the arithmetic, asking for a review. Marked DRAFT. Sending goes through cancellations_request_send (one click).
- `cancellations_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `provider_portal_cancel` is listed and refused: It never submits a cancellation to a provider.
- `ap_issue_refund` is listed and refused: It never issues a customer or lender refund.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-product-cancellations demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Product Cancellations demo (fictional cancellations, 2025 to 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 cancellation(s), 4691.67 charged back. 3 chargeback(s) above the pro-rata figure by 542.09 in total; 1 above the profit earned; 2 refund(s) not sent.
    D3005  Appearance Package expected   539.55  charged      900  chargeback_above_expected, chargeback_above_profit
    D3001  Service Contract   expected  1051.33  charged     1200  chargeback_above_expected
    D3003  Service Contract   expected  1067.03  charged     1100  chargeback_above_expected, refund_not_sent
    D3004  Maintenance Plan   expected   526.56  charged      350  chargeback_below_expected
    D3007  Service Contract   expected  1137.17  charged     null  refund_not_sent

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 cancellation(s), 4691.67 charged back. 3 chargeback(s) above the pro-rata figure by 542.09 in total; 1 above the profit earned; 2 refund(s) not sent.

▶ Draft the review request to Larkfield Vehicle Protection
  status: executed  decision: allow  (auto)
  dispute Larkfield Vehicle Protection drafted for 181.64 with 1 open marker(s) ([CHECK the cancellation method in your agreement with the provider (pro rata, rule of 78s, cancel fee) before sending]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  dispute Larkfield-Vehicle-Protection approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries ap_issue_refund itself
  status: blocked  decision: block
  reason: It never issues a customer or lender refund.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `cancellations_check` | One row per cancellation that needs attention: profit, days used, unused share, expected and charged chargeback, difference, refund waiting days, findings (chargeback_above_expected, chargeback_below_expected, chargeb… | runs |
| `cancellations_write_report` | Write product-cancellations.csv and product-cancellations.html (one row per finding, with the totals) into out_dir (default fairdrive-out/cancellations). | runs |
| `cancellations_draft_dispute` | Write drafts/dispute-<provider>.md: every chargeback from one provider above the pro-rata figure, with the arithmetic, asking for a review. | asks first (Auto can be opted in) |
| `cancellations_request_send` | After one named human click (even in Auto), record that the reviewed dispute draft is approved in dispute-requests.csv. | one named click, even in Auto (`binding_send`) |
| `provider_portal_cancel` | It never submits a cancellation to a provider. | refused |
| `ap_issue_refund` | It never issues a customer or lender refund. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Cancelled F&I products (`cancellations`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer, Contract Holder | Kunde, Client, 顧客, 客户 |
| `product` (required) | text | Product, Product Type, Product Name, Coverage | - |
| `provider` | text | Provider, Administrator, Product Provider, Company | Anbieter, Fournisseur du contrat, プロバイダー, 服务商 |
| `contract_number` | text | Contract Number, Contract #, Policy Number, Certificate | - |
| `sale_date` (required) | date | Sale Date, Contract Date, Deal Date, Effective Date | - |
| `cancel_date` (required) | date | Cancel Date, Cancellation Date, Cancelled, Cancel Effective | - |
| `term_months` | number | Term Months, Term, Term (Months), Months | - |
| `product_price` | amount | Product Price, Price, Customer Price, Sale Price, Retail | - |
| `product_cost` | amount | Product Cost, Cost, Dealer Cost, Remit | - |
| `chargeback` | amount | Chargeback, Chargeback Amount, Dealer Chargeback, Charged Back, Commission Chargeback | - |
| `refund_amount` | amount | Refund, Refund Amount, Customer Refund | - |
| `refund_sent` | date | Refund Sent, Refund Date, Refund Issued, Refund Paid | - |
| `reason` | text | Reason, Cancel Reason, Cancellation Reason | Grund, Motif, 理由, 原因 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-product-cancellations inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-product-cancellations demo
npx -y fairdrive-product-cancellations mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-product-cancellations": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-product-cancellations",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-product-cancellations -- npx -y fairdrive-product-cancellations mcp --root .`, or install the `fairdrive-product-cancellations` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-product-cancellations approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-product-cancellations approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-product-cancellations kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-product-cancellations tools                 # every tool, its policy and arguments
fairdrive-product-cancellations sources               # the columns each input is read from
fairdrive-product-cancellations inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-product-cancellations call cancellations_check '{"cancellations":"<cancellations>"}'
fairdrive-product-cancellations eval                  # the private eval cases on the fictional fixtures
fairdrive-product-cancellations demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The expected chargeback is pro rata by days on the profit (price less dealer cost), with a full chargeback inside the window you set. Providers may use rule of 78s, cancel fees or other methods; your agreement decides.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
