<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Trade Payoffs (`fairdrive-trade-payoffs`)

Lists every trade-in lien payoff not sent within your days (with the amount owed today, per diem included), sent after the quote expired, short of the quote plus per diem, sent but not cleared, or cleared with no lien release or title. Drafts a payoff batch for one named person to approve. It never sends money.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-trade-payoffs demo
npx -y fairdrive-trade-payoffs mcp --root ./exports
```

## What it reads

- **Trade-in payoff log** (`trades`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `payoffs_check`: One row per trade that needs action, oldest deal first: quote, good-through, sent date and amount, owed today, short amount, findings (payoff_not_sent, sent_after_quote_expired, short_paid, not_cleared, lien_release_missing). Totals.
- `payoffs_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `payoffs_draft_batch`: Write drafts/batch-<date>.md: every payoff not sent yet, with lienholder and amount owed today. Marked DRAFT. Approving goes through payoffs_request_pay (one named click, even in Auto); a person sends the money.
- `payoffs_request_pay`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `bank_send_wire` is listed and refused: It never sends a check, wire or ACH.
- `dms_update_deal` is listed and refused: It never changes a deal or the payoff log.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-trade-payoffs demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Trade Payoffs demo (fictional trade-ins, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 trade payoff(s): 2 not sent (about 28833 owed today), 1 paid short by 14.7, 1 sent after the quote expired, 1 not cleared, 1 without a lien release.
    D10005  Summit Credit Union   71 days  lien_release_missing
    D10003  Bluegate Bank         36 days  sent_after_quote_expired, short_paid
    D10004  Harbor Auto Finance   26 days  not_cleared
    D10007  Bluegate Bank         18 days  payoff_not_sent
    D10002  Summit Credit Union   14 days  payoff_not_sent

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 trade payoff(s): 2 not sent (about 28833 owed today), 1 paid short by 14.7, 1 sent after the quote expired, 1 not cleared, 1 without a lien release.

▶ Draft the payoff batch
  status: executed  decision: allow  (auto)
  batch 2026-11-15 drafted for 28833 with 1 open marker(s) ([CHECK each amount with a fresh payoff quote from the lienholder before paying]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: move_money stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  batch 2026-11-15 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries bank_send_wire itself
  status: blocked  decision: block
  reason: It never sends a check, wire or ACH.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `payoffs_check` | One row per trade that needs action, oldest deal first: quote, good-through, sent date and amount, owed today, short amount, findings (payoff_not_sent, sent_after_quote_expired, short_paid, not_cleared, lien_release_m… | runs |
| `payoffs_write_report` | Write trade-payoffs.csv and trade-payoffs.html (one row per finding, with the totals) into out_dir (default fairdrive-out/payoffs). | runs |
| `payoffs_draft_batch` | Write drafts/batch-<date>.md: every payoff not sent yet, with lienholder and amount owed today. | asks first (Auto can be opted in) |
| `payoffs_request_pay` | After one named human click (even in Auto), record that the reviewed batch draft is approved in batch-requests.csv. | one named click, even in Auto (`move_money`) |
| `bank_send_wire` | It never sends a check, wire or ACH. | refused |
| `dms_update_deal` | It never changes a deal or the payoff log. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Trade-in payoff log (`trades`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `trade_vin` | text | Trade VIN, Trade 1 VIN, VIN | - |
| `lienholder` (required) | text | Lienholder, Lien Holder, Payoff To, Trade Lender | Kreditgeber, Prêteur, 金融機関, 贷款机构 |
| `deal_date` (required) | date | Deal Date, Delivery Date, Sold Date, Contract Date | - |
| `payoff_quote` | amount | Payoff Quote, Payoff Amount, Quoted Payoff, Payoff | - |
| `quote_good_through` | date | Good Through, Quote Good Through, Payoff Good Through, Quote Expires | - |
| `per_diem` | amount | Per Diem, Per-Diem, Daily Interest | - |
| `payoff_sent` | date | Payoff Sent, Check Date, Payoff Date, Paid Date | - |
| `payoff_amount_sent` | amount | Amount Sent, Payoff Paid, Check Amount, Paid Amount | - |
| `payoff_cleared` | date | Cleared, Payoff Cleared, Cleared Date | - |
| `lien_release_received` | date | Lien Release, Lien Release Received, Title Received, Release Date | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-trade-payoffs inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-trade-payoffs demo
npx -y fairdrive-trade-payoffs mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-trade-payoffs": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-trade-payoffs",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-trade-payoffs -- npx -y fairdrive-trade-payoffs mcp --root .`, or install the `fairdrive-trade-payoffs` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-trade-payoffs approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-trade-payoffs approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-trade-payoffs kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-trade-payoffs tools                 # every tool, its policy and arguments
fairdrive-trade-payoffs sources               # the columns each input is read from
fairdrive-trade-payoffs inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-trade-payoffs call payoffs_check '{"trades":"<trades>"}'
fairdrive-trade-payoffs eval                  # the private eval cases on the fictional fixtures
fairdrive-trade-payoffs demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Owed today is the quote plus per diem for each day past good-through. The lienholder payoff quote on the day you pay decides.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
