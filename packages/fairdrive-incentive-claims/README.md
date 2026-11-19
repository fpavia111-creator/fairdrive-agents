<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Incentive Claims (`fairdrive-incentive-claims`)

Matches the manufacturer incentives, rebates, dealer cash and holdback you expect on each unit against the manufacturer statement by VIN and program, and lists claims not submitted (past your deadline or still due), submitted but unpaid, paid short, rejected or charged back, plus statement lines you did not expect. Drafts an inquiry to the incentive desk for a person to send. It never submits a claim.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-incentive-claims demo
npx -y fairdrive-incentive-claims mcp --root ./exports
```

## What it reads

- **Incentives expected** (`expected`)
- **Manufacturer incentive statement** (`statement`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `incentives_check`: One row per expected incentive that needs action, largest outstanding first: expected, paid, outstanding, findings (not_submitted_past_deadline, not_submitted, unpaid, paid_short, rejected, charged_back). Totals and paid lines not expected.
- `incentives_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `incentives_draft_inquiry`: Write drafts/inquiry-<date>.md: claims unpaid, paid short, rejected or charged back, with VIN, program and amounts. Marked DRAFT. Sending goes through incentives_request_send (one click).
- `incentives_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `oem_portal_submit_claim` is listed and refused: It never submits or resubmits an incentive claim.
- `gl_post_receivable` is listed and refused: It never posts to the factory receivable.

## What the AI model sees

- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `program`, `claim_number`, `status`); VINs (`vin`; pseudonymised with `--pii strict`); dates (`sale_date`, `claim_submitted`, `paid_date`); amounts and counts (`amount_expected`, `amount_paid`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `reason`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-incentive-claims demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Incentive Claims demo (fictional programs and statement, August to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  8 incentive line(s): 10580 expected, 3580 paid, 7000 outstanding. 1 not submitted past the deadline, 1 still to submit, 1 unpaid, 1 paid short, 1 rejected, 1 charged back; 1 paid line(s) not expected.
    RA659009 RET-2026-11  expected   2000  paid      0  not_submitted
    PA503360 RET-2026-09  expected   1500  paid      0  not_submitted_past_deadline
    TA359430 RET-2026-08  expected   1250  paid      0  charged_back
    SA184098 DLR-CASH     expected   1000  paid      0  unpaid
    NA412538 LOY-26       expected    750  paid      0  rejected
    MA734429 RET-2026-09  expected   1500  paid   1000  paid_short

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 8 incentive line(s): 10580 expected, 3580 paid, 7000 outstanding. 1 not submitted past the deadline, 1 still to submit, 1 unpaid, 1 paid short, 1 rejected, 1 charged back; 1 paid line(s) not expected.

▶ Draft the inquiry to the incentive desk
  status: executed  decision: allow  (auto)
  inquiry 2026-11-15 drafted for 3500 with 1 open marker(s) ([CHECK each program rule and deadline in the current program bulletin before sending]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  inquiry 2026-11-15 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries oem_portal_submit_claim itself
  status: blocked  decision: block
  reason: It never submits or resubmits an incentive claim.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `incentives_check` | One row per expected incentive that needs action, largest outstanding first: expected, paid, outstanding, findings (not_submitted_past_deadline, not_submitted, unpaid, paid_short, rejected, charged_back). | runs |
| `incentives_write_report` | Write incentive-claims.csv and incentive-claims.html (one row per finding, with the totals) into out_dir (default fairdrive-out/incentives). | runs |
| `incentives_draft_inquiry` | Write drafts/inquiry-<date>.md: claims unpaid, paid short, rejected or charged back, with VIN, program and amounts. | asks first (Auto can be opted in) |
| `incentives_request_send` | After one named human click (even in Auto), record that the reviewed inquiry draft is approved in inquiry-requests.csv. | one named click, even in Auto (`binding_send`) |
| `oem_portal_submit_claim` | It never submits or resubmits an incentive claim. | refused |
| `gl_post_receivable` | It never posts to the factory receivable. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Incentives expected (`expected`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `vin` (required) | text | VIN, Vehicle VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `sale_date` (required) | date | Sale Date, Delivery Date, RDR Date, Deal Date | - |
| `program` (required) | text | Program, Program Code, Incentive, Incentive Program | Programm, Programme, プログラム, 激励项目 |
| `amount_expected` (required) | amount | Amount Expected, Expected, Incentive Amount, Amount, Claim Amount | - |
| `claim_submitted` | date | Claim Submitted, Submitted, Submitted Date, Claim Date | - |
| `claim_number` | text | Claim Number, Claim #, Claim ID | Antragsnummer, N° de demande, 請求番号, 索赔号 |

### Manufacturer incentive statement (`statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vin` (required) | text | VIN, Serial Number, Vehicle | FIN, Numéro de série, 車台番号, 车架号 |
| `program` | text | Program, Program Code, Incentive | Programm, Programme, プログラム, 激励项目 |
| `amount_paid` (required) | amount | Amount Paid, Paid Amount, Credit Amount, Amount | - |
| `paid_date` | date | Paid Date, Statement Date, Date, Credit Date | Zahlungsdatum, Date de paiement, 支払日, 付款日期 |
| `status` | text | Status, Claim Status, Type | Status, Statut, ステータス, 状态 |
| `reason` | text | Reason, Rejection Reason, Comment, Debit Reason | Grund, Motif, 理由, 原因 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Manufacturer incentive statement (generic) | Incentive / dealer cash payment statement saved as CSV | VIN, Program Code, Amount Paid or Paid Amount or Credit Amount, Statement Date | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-incentive-claims inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-incentive-claims demo
npx -y fairdrive-incentive-claims mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-incentive-claims": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-incentive-claims",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-incentive-claims -- npx -y fairdrive-incentive-claims mcp --root .`, or install the `fairdrive-incentive-claims` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-incentive-claims approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-incentive-claims approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-incentive-claims kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-incentive-claims tools                 # every tool, its policy and arguments
fairdrive-incentive-claims sources               # the columns each input is read from
fairdrive-incentive-claims inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-incentive-claims call incentives_check '{"expected":"<expected>","statement":"<statement>"}'
fairdrive-incentive-claims eval                  # the private eval cases on the fictional fixtures
fairdrive-incentive-claims demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Program rules, amounts and deadlines are the ones in your file and settings; the current program bulletin decides.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Every figure comes from your files and settings. Check it before you act on it.
