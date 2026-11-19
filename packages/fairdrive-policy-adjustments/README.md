<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Policy Adjustments (`fairdrive-policy-adjustments`)

Lists policy and goodwill adjustments with no approver, approved by the advisor who wrote them, over your review line, with no reason, or repeated on the same vehicle, and totals adjustments by advisor and by reason. It never posts, changes or reverses an adjustment.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-policy-adjustments demo
npx -y fairdrive-policy-adjustments mcp --root ./exports
```

## What it reads

- **Policy adjustments** (`adjustments`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `policy_check`: One row per adjustment that needs a look, largest first: RO, advisor, amount, reason, approver, findings (no_approver, self_approved, large_adjustment, no_reason, repeat_vehicle). Totals by advisor and by reason.
- `policy_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_post_policy` is listed and refused: It never posts, changes or reverses a policy adjustment.
- `gl_post_entry` is listed and refused: It never posts to the ledger.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-policy-adjustments demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Policy Adjustments demo (fictional adjustments, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 policy adjustment(s) totalling 1265. 1 with no approver, 1 self-approved, 2 over 250, 1 with no reason, 1 repeated on the same vehicle.
    92002  Marco Ilic      420  self_approved, large_adjustment
    92006  Marco Ilic      300  large_adjustment
    92005  Lena Moreau     210  repeat_vehicle
    92003  Lena Moreau      95  no_approver
    92004  Marco Ilic       60  no_reason

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 policy adjustment(s) totalling 1265. 1 with no approver, 1 self-approved, 2 over 250, 1 with no reason, 1 repeated on the same vehicle.

▶ The agent tries dms_post_policy itself
  status: blocked  decision: block
  reason: It never posts, changes or reverses a policy adjustment.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `policy_check` | One row per adjustment that needs a look, largest first: RO, advisor, amount, reason, approver, findings (no_approver, self_approved, large_adjustment, no_reason, repeat_vehicle). | runs |
| `policy_write_report` | Write policy-adjustments.csv and policy-adjustments.html (one row per finding, with the totals) into out_dir (default fairdrive-out/policy). | runs |
| `dms_post_policy` | It never posts, changes or reverses a policy adjustment. | refused |
| `gl_post_entry` | It never posts to the ledger. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Policy adjustments (`adjustments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `date` (required) | date | Date, Adjustment Date, Closed Date, Posted | Datum, Date, 日付, 日期 |
| `advisor` (required) | text | Advisor, Service Advisor, Writer, Requested By | Serviceberater, Conseiller service, サービスアドバイザー, 服务顾问 |
| `customer` | text | Customer, Customer Name, Name | Kunde, Client, 顧客, 客户 |
| `vin` | text | VIN, Vehicle VIN | FIN, Numéro de série, 車台番号, 车架号 |
| `amount` (required) | amount | Amount, Policy Amount, Adjustment, Goodwill Amount | Betrag, Montant, 金額, 金额 |
| `reason` | text | Reason, Explanation, Comment, Policy Reason | Grund, Motif, 理由, 原因 |
| `approved_by` | text | Approved By, Approver, Manager, Authorized By | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-policy-adjustments inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-policy-adjustments demo
npx -y fairdrive-policy-adjustments mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-policy-adjustments": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-policy-adjustments",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-policy-adjustments -- npx -y fairdrive-policy-adjustments mcp --root .`, or install the `fairdrive-policy-adjustments` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-policy-adjustments approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-policy-adjustments approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-policy-adjustments kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-policy-adjustments tools                 # every tool, its policy and arguments
fairdrive-policy-adjustments sources               # the columns each input is read from
fairdrive-policy-adjustments inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-policy-adjustments call policy_check '{"adjustments":"<adjustments>"}'
fairdrive-policy-adjustments eval                  # the private eval cases on the fictional fixtures
fairdrive-policy-adjustments demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- It reads the approver as written; it cannot tell whether that person had authority.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
