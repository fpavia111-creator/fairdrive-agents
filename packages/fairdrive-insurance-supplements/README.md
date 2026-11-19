<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Insurance Supplements (`fairdrive-insurance-supplements`)

Tracks every supplement a body shop sends to an insurer: lists those waiting past your follow-up days, approved short and denied, and totals requested, approved and waiting amounts and the average days to an answer by insurer. Drafts a follow-up to one insurer's adjuster for a person to send. It never submits anything to an insurer.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-insurance-supplements demo
npx -y fairdrive-insurance-supplements mcp --root ./exports
```

## What it reads

- **Supplement log** (`supplements`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `supplements_track`: One row per supplement that needs action, largest first: claim, RO, insurer, supplement number, sent date, days waiting, requested, approved, finding (pending_over, approved_short, denied). Totals and a table by insurer with average days to an answer.
- `supplements_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `supplements_draft_follow_up`: Write drafts/follow_up-<insurer>.md: supplements waiting past the follow-up days with one insurer, with claim, RO and amount. Marked DRAFT. Sending goes through supplements_request_send (one click).
- `supplements_request_send`: records that one named person approved the reviewed draft. It waits for that person even in Auto mode, is tied to the draft's sha256, and the agent never sends or pays anything itself.
- `insurer_portal_submit` is listed and refused: It never submits a supplement or message to an insurer portal.
- `dms_change_estimate` is listed and refused: It never changes an estimate or repair order.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`ro_number`, `claim_number`, `insurer`, `supplement_number`, `status`); dates (`submitted_date`, `response_date`); amounts and counts (`amount_requested`, `amount_approved`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-insurance-supplements demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Insurance Supplements demo (fictional supplement log, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 supplement(s): 4100 requested, 1270 approved, 2230 waiting. 2 waiting over 5 days, 1 approved short (80), 1 denied (520).
    pending_over    B1006  Heron Mutual                 1250
    pending_over    B1007  Granite Shield Insurance      680
    denied          B1009  Granite Shield Insurance      520
    approved_short  B1003  Heron Mutual                   80

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 supplement(s): 4100 requested, 1270 approved, 2230 waiting. 2 waiting over 5 days, 1 approved short (80), 1 denied (520).

▶ Draft the follow-up to Heron Mutual
  status: executed  decision: allow  (auto)
  follow up Heron Mutual drafted for 1250 with 1 open marker(s) ([ATTACH photos and the supplement estimate for each]). Nothing was sent.

▶ Approve it: waits for a named person, even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ The same call after the click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Jordan Reyes (fictional)
  follow up Heron-Mutual approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries insurer_portal_submit itself
  status: blocked  decision: block
  reason: It never submits a supplement or message to an insurer portal.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `supplements_track` | One row per supplement that needs action, largest first: claim, RO, insurer, supplement number, sent date, days waiting, requested, approved, finding (pending_over, approved_short, denied). | runs |
| `supplements_write_report` | Write insurance-supplements.csv and insurance-supplements.html (one row per finding, with the totals) into out_dir (default fairdrive-out/supplements). | runs |
| `supplements_draft_follow_up` | Write drafts/follow_up-<insurer>.md: supplements waiting past the follow-up days with one insurer, with claim, RO and amount. | asks first (Auto can be opted in) |
| `supplements_request_send` | After one named human click (even in Auto), record that the reviewed follow up draft is approved in follow_up-requests.csv. | one named click, even in Auto (`binding_send`) |
| `insurer_portal_submit` | It never submits a supplement or message to an insurer portal. | refused |
| `dms_change_estimate` | It never changes an estimate or repair order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Supplement log (`supplements`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, Repair Order, Work Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `claim_number` | text | Claim Number, Claim #, Claim | Antragsnummer, N° de demande, 請求番号, 索赔号 |
| `insurer` (required) | text | Insurer, Insurance Company, Carrier, Payer | Versicherer, Assureur, 保険会社, 保险公司 |
| `supplement_number` | text | Supplement, Supplement Number, Sup, Version | - |
| `submitted_date` (required) | date | Submitted, Submitted Date, Sent Date, Date Sent | - |
| `amount_requested` (required) | amount | Amount Requested, Requested, Supplement Amount, Amount | - |
| `status` | text | Status, Supplement Status, Response | Status, Statut, ステータス, 状态 |
| `response_date` | date | Response Date, Approved Date, Responded, Decision Date | - |
| `amount_approved` | amount | Amount Approved, Approved, Approved Amount | - |
| `customer` | text | Customer, Customer Name, Owner, Insured | Kunde, Client, 顧客, 客户 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-insurance-supplements inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-insurance-supplements demo
npx -y fairdrive-insurance-supplements mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-insurance-supplements": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-insurance-supplements",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-insurance-supplements -- npx -y fairdrive-insurance-supplements mcp --root .`, or install the `fairdrive-insurance-supplements` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-insurance-supplements approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-insurance-supplements approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-insurance-supplements kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-insurance-supplements tools                 # every tool, its policy and arguments
fairdrive-insurance-supplements sources               # the columns each input is read from
fairdrive-insurance-supplements inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-insurance-supplements call supplements_track '{"supplements":"<supplements>"}'
fairdrive-insurance-supplements eval                  # the private eval cases on the fictional fixtures
fairdrive-insurance-supplements demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
