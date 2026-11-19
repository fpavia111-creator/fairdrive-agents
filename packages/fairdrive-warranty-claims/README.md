<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Warranty Claims (`fairdrive-warranty-claims`)

Matches warranty claims submitted against the manufacturer warranty statement and lists unpaid claims by age, claims paid short, rejections with the date they must be resubmitted by, and debits after payment, with totals by reason and statement lines with no claim on your schedule. Drafts a review request to the warranty representative for a person to send. It never resubmits or writes off a claim.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-warranty-claims demo
npx -y fairdrive-warranty-claims mcp --root ./exports
```

## What it reads

- **Warranty claims submitted** (`claims`)
- **Manufacturer warranty statement** (`statement`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `warranty_check`: One row per claim that needs action, largest outstanding first: claimed, paid, outstanding, age, resubmit-by date, reason, findings (unpaid, paid_short, rejected, rejected_past_deadline, debited_after_payment). Totals, unpaid by age, by reason, and statement lines not on the schedule.
- `warranty_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `warranty_draft_review`: Write drafts/review-<date>.md: claims rejected, paid short or debited, with amounts and the reason given. Marked DRAFT. Sending goes through warranty_request_send (one click).
- `warranty_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `oem_portal_resubmit` is listed and refused: It never submits or resubmits a warranty claim.
- `dms_write_off_claim` is listed and refused: It never writes off a claim or posts to the warranty receivable.

## What the AI model sees

- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.
- **Sent as they are:** ids, codes and names of businesses (`claim_number`, `ro_number`, `status`); VINs (`vin`; pseudonymised with `--pii strict`); dates (`submitted_date`, `paid_date`); amounts and counts (`labor_amount`, `parts_amount`, `total_claimed`, `amount_paid`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `reason`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-warranty-claims demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Warranty Claims demo (fictional claims and statement, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 claim(s): 7735 claimed, 2030 paid, 5705 outstanding. 2 unpaid (2710), 1 paid short (240), 2 rejected (1575; 1 past the resubmission date), 1 debited after payment (1180).
    C7005  claimed    2300  paid       0  unpaid
    C7007  claimed    1180  paid       0  debited_after_payment
    C7004  claimed     975  paid       0  rejected_past_deadline (resubmit by 2026-10-25)
    C7003  claimed     600  paid       0  rejected (resubmit by 2026-11-19)
    C7006  claimed     410  paid       0  unpaid
    C7002  claimed    1450  paid    1210  paid_short

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 claim(s): 7735 claimed, 2030 paid, 5705 outstanding. 2 unpaid (2710), 1 paid short (240), 2 rejected (1575; 1 past the resubmission date), 1 debited after payment (1180).

▶ Draft the review request
  status: executed  decision: allow  (auto)
  review 2026-11-15 drafted for 2995 with 2 open marker(s) ([ATTACH the repair order, technician notes and parts return for each claim], [CHECK the resubmission deadline in the warranty policy manual]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  review 2026-11-15 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries oem_portal_resubmit itself
  status: blocked  decision: block
  reason: It never submits or resubmits a warranty claim.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `warranty_check` | One row per claim that needs action, largest outstanding first: claimed, paid, outstanding, age, resubmit-by date, reason, findings (unpaid, paid_short, rejected, rejected_past_deadline, debited_after_payment). | runs |
| `warranty_write_report` | Write warranty-claims.csv and warranty-claims.html (one row per finding, with the totals) into out_dir (default fairdrive-out/warranty). | runs |
| `warranty_draft_review` | Write drafts/review-<date>.md: claims rejected, paid short or debited, with amounts and the reason given. | asks first (Auto can be opted in) |
| `warranty_request_send` | After one named human click (even in Auto), record that the reviewed review draft is approved in review-requests.csv. | one named click, even in Auto (`binding_send`) |
| `oem_portal_resubmit` | It never submits or resubmits a warranty claim. | refused |
| `dms_write_off_claim` | It never writes off a claim or posts to the warranty receivable. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Warranty claims submitted (`claims`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `claim_number` (required) | text | Claim Number, Claim #, Claim No, Claim | Antragsnummer, N° de demande, 請求番号, 索赔号 |
| `ro_number` | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `vin` | text | VIN, Serial Number | FIN, Numéro de série, 車台番号, 车架号 |
| `submitted_date` (required) | date | Submitted, Submitted Date, Claim Date, Date Submitted | - |
| `labor_amount` | amount | Labor, Labor Amount, Labor Claimed | - |
| `parts_amount` | amount | Parts, Parts Amount, Parts Claimed | - |
| `total_claimed` (required) | amount | Total Claimed, Claim Total, Amount Claimed, Total | - |

### Manufacturer warranty statement (`statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `claim_number` (required) | text | Claim Number, Claim #, Claim No, Claim | Antragsnummer, N° de demande, 請求番号, 索赔号 |
| `paid_date` | date | Paid Date, Statement Date, Date, Credit Date | Zahlungsdatum, Date de paiement, 支払日, 付款日期 |
| `amount_paid` (required) | amount | Amount Paid, Paid Amount, Credit, Amount | - |
| `status` | text | Claim Status, Status, Type | Status, Statut, ステータス, 状态 |
| `reason` | text | Reason, Debit Code, Rejection Reason, Comment, Explanation | Grund, Motif, 理由, 原因 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Manufacturer warranty statement (generic) | Warranty claim payment statement saved as CSV | Claim Number, Claim Status, Amount Paid or Paid Amount, Debit Code | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-warranty-claims inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-warranty-claims demo
npx -y fairdrive-warranty-claims mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-warranty-claims": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-warranty-claims",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-warranty-claims -- npx -y fairdrive-warranty-claims mcp --root .`, or install the `fairdrive-warranty-claims` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-warranty-claims approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-warranty-claims approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-warranty-claims kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-warranty-claims tools                 # every tool, its policy and arguments
fairdrive-warranty-claims sources               # the columns each input is read from
fairdrive-warranty-claims inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-warranty-claims call warranty_check '{"claims":"<claims>","statement":"<statement>"}'
fairdrive-warranty-claims eval                  # the private eval cases on the fictional fixtures
fairdrive-warranty-claims demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Resubmission dates use the days you set; the manufacturer warranty policy manual decides.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Every figure comes from your files and settings. Check it before you act on it.
