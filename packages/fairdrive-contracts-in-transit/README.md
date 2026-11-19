<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Contracts In Transit (`fairdrive-contracts-in-transit`)

Ages every financed contract that has not funded yet (contracts in transit) by lender and by days, with the stipulations still open and the contracts a lender returned. With a lender statement it also catches money the lender sent that the DMS still shows as unfunded, contracts marked funded that are not on the statement, and contracts funded short. Drafts a follow-up to one lender for a person to send. It never submits to a lender portal and never posts to the ledger.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-contracts-in-transit demo
npx -y fairdrive-contracts-in-transit mcp --root ./exports
```

## What it reads

- **Contracts in transit (DMS)** (`contracts`)
- **Lender funding statement** (`lender_statement`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `funding_age_contracts`: One row per contract that needs attention: in transit (days, age bucket, open stips), returned by the lender, funded by the lender but still open in the DMS, funded short or over, marked funded but not on the lender statement. Totals by lender and by age, and statement lines that match no contract.
- `funding_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `funding_draft_follow_up`: Write drafts/follow_up-<lender>.md: the contracts in transit with one lender, oldest first, with their open stips, asking what is still needed. Marked DRAFT. Sending goes through funding_request_send (one click).
- `funding_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `lender_portal_submit` is listed and refused: Fairdrive Contracts In Transit never uploads stips or submits a contract to a lender portal.
- `gl_post_funding` is listed and refused: Fairdrive Contracts In Transit never posts funding to the ledger or clears the contracts-in-transit schedule.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `lender`, `status`); VINs (`vin`; pseudonymised with `--pii strict`); dates (`contract_date`, `funded_date`); amounts and counts (`amount_financed`, `expected_funding`, `funded_amount`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `stips`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-contracts-in-transit demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Contracts In Transit demo (fictional contracts and lender statement, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  10 contract(s): 5 in transit for 127300 (3 over 10 days, oldest 48 days, 1 returned by the lender). 1 funded by the lender but still open in the DMS. Funded short by 500 in total. 1 marked funded but not on the lender statement; 1 statement line(s) match no contract.
    returned_by_lender       D2004  Bluegate Bank         48 days  42000
    in_transit               D2002  Harbor Auto Finance   26 days  31200
    in_transit               D2010  Harbor Auto Finance   19 days  19800
    in_transit               D2003  Summit Credit Union    5 days  18900
    in_transit               D2008  Summit Credit Union    2 days  15400
    funded_not_posted        D2006  Harbor Auto Finance    7 days  35600
    funded_short             D2005  Summit Credit Union    7 days  22750
    not_on_lender_statement  D2007  Bluegate Bank          7 days  26300

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 10 contract(s): 5 in transit for 127300 (3 over 10 days, oldest 48 days, 1 returned by the lender). 1 funded by the lender but still open in the DMS. Funded short by 500 in total. 1 marked funded but not on the lender statement; 1 statement line(s) match no contract.

▶ Draft the follow-up to Harbor Auto Finance
  status: executed  decision: allow  (auto)
  follow up Harbor Auto Finance drafted for 51000 with 1 open marker(s) ([ATTACH any stips you are sending with this follow-up]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  follow up Harbor-Auto-Finance approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries lender_portal_submit itself
  status: blocked  decision: block
  reason: Fairdrive Contracts In Transit never uploads stips or submits a contract to a lender portal.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `funding_age_contracts` | One row per contract that needs attention: in transit (days, age bucket, open stips), returned by the lender, funded by the lender but still open in the DMS, funded short or over, marked funded but not on the lender s… | runs |
| `funding_write_report` | Write contracts-in-transit.csv and contracts-in-transit.html (one row per finding, with the totals) into out_dir (default fairdrive-out/funding). | runs |
| `funding_draft_follow_up` | Write drafts/follow_up-<lender>.md: the contracts in transit with one lender, oldest first, with their open stips, asking what is still needed. | asks first (Auto can be opted in) |
| `funding_request_send` | After one named human click (even in Auto), record that the reviewed follow up draft is approved in follow_up-requests.csv. | one named click, even in Auto (`binding_send`) |
| `lender_portal_submit` | Fairdrive Contracts In Transit never uploads stips or submits a contract to a lender portal. | refused |
| `gl_post_funding` | Fairdrive Contracts In Transit never posts funding to the ledger or clears the contracts-in-transit schedule. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Contracts in transit (DMS) (`contracts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal #, Deal ID | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer, Buyer Name | Kunde, Client, 顧客, 客户 |
| `vin` | text | VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `lender` (required) | text | Lender, Lienholder, Finance Source, Bank, Finance Company | Kreditgeber, Prêteur, 金融機関, 贷款机构 |
| `contract_date` (required) | date | Contract Date, Deal Date, Sold Date, Date Contracted | - |
| `amount_financed` | amount | Amount Financed, Amt Financed, Financed Amount | - |
| `expected_funding` | amount | Expected Funding, Net Proceeds, Proceeds, Net to Dealer, Funding Due | - |
| `funded_date` | date | Funded Date, Date Funded, Funding Date | - |
| `funded_amount` | amount | Funded Amount, Amount Funded, Funds Received | - |
| `status` | text | Funding Status, CIT Status, Status, Contract Status | Status, Statut, ステータス, 状态 |
| `stips` | text | Stips, Stipulations, Open Stips, Conditions, Missing Items | - |

### Lender funding statement (`lender_statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `lender` | text | Lender, Finance Source, Bank | Kreditgeber, Prêteur, 金融機関, 贷款机构 |
| `deal_number` | text | Deal No, Deal Number, Dealer Reference, Dealer Ref, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `vin` | text | VIN, Collateral VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `customer` | text | Customer, Borrower, Buyer, Customer Name | Kunde, Client, 顧客, 客户 |
| `funded_date` (required) | date | Funded Date, Funding Date, Disbursement Date, Date | - |
| `funded_amount` (required) | amount | Funded Amount, Amount, Disbursed, Net Funded, Dealer Proceeds | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-contracts-in-transit inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-contracts-in-transit demo
npx -y fairdrive-contracts-in-transit mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-contracts-in-transit": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-contracts-in-transit",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-contracts-in-transit -- npx -y fairdrive-contracts-in-transit mcp --root .`, or install the `fairdrive-contracts-in-transit` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-contracts-in-transit approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-contracts-in-transit approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-contracts-in-transit kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-contracts-in-transit tools                 # every tool, its policy and arguments
fairdrive-contracts-in-transit sources               # the columns each input is read from
fairdrive-contracts-in-transit inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-contracts-in-transit call funding_age_contracts '{"contracts":"<contracts>"}'
fairdrive-contracts-in-transit eval                  # the private eval cases on the fictional fixtures
fairdrive-contracts-in-transit demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Funded means the DMS shows a funded date or status, or the lender statement shows the money. It does not read a bank account.
- Not lending advice. A person decides what to send a lender and when to post funding.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
