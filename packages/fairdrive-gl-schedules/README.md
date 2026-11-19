<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive GL Schedules (`fairdrive-gl-schedules`)

Ties each DMS schedule (contracts in transit, factory and warranty receivables, vehicle receivables and others) to its ledger balance, ages the open items by control number, and lists schedules out of balance, controls open over 90 days, credit balances on receivable schedules and controls that net to zero and can be cleared. It never posts to the ledger or purges a schedule.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-gl-schedules demo
npx -y fairdrive-gl-schedules mcp --root ./exports
```

## What it reads

- **Schedule detail** (`detail`)
- **Ledger balances by schedule** (`balances`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `schedules_age`: Findings (out_of_balance, no_gl_balance, over_90_days, credit_balance, zero_balance_control) by schedule and control number, and one row per schedule: ledger balance, detail total, difference, open controls and amounts by age.
- `schedules_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `gl_post_entry` is listed and refused: It never posts an entry to the ledger.
- `dms_purge_schedule` is listed and refused: It never clears or purges schedule items.

## What the AI model sees

- **Masked:** this agent reads no customer or staff column. Anything that looks like a phone number, e-mail or SSN is still replaced in every result.
- **Sent as they are:** ids, codes and names of businesses (`schedule`, `control_number`, `schedule_name`); dates (`date`); amounts and counts (`amount`, `gl_balance`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `description`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-gl-schedules demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive GL Schedules demo (fictional schedules at a fictional store, month-end 15 November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  3 schedule(s), 65210 in detail. 2 out of balance with the ledger; 2 control(s) open over 90 days (10300); 1 credit balance(s) on receivables; 2 control(s) netting to zero, ready to clear.
    205  Contracts in transit   ledger    59200  detail    59200  difference 0
    220  Factory receivable     ledger     4100  detail     3600  difference -500
    230  Warranty receivable    ledger     2750  detail     2410  difference -340
    out_of_balance: 220  -500
    out_of_balance: 230  -340
    over_90_days: 205 D2004 8200
    over_90_days: 220 H-1002 2100
    credit_balance: 230 C7099 -300
    zero_balance_control: 220 H-1003 0
    zero_balance_control: 230 C7007 0

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 3 schedule(s), 65210 in detail. 2 out of balance with the ledger; 2 control(s) open over 90 days (10300); 1 credit balance(s) on receivables; 2 control(s) netting to zero, ready to clear.

▶ The agent tries gl_post_entry itself
  status: blocked  decision: block
  reason: It never posts an entry to the ledger.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `schedules_age` | Findings (out_of_balance, no_gl_balance, over_90_days, credit_balance, zero_balance_control) by schedule and control number, and one row per schedule: ledger balance, detail total, difference, open controls and amount… | runs |
| `schedules_write_report` | Write gl-schedules.csv and gl-schedules.html (one row per finding, with the totals) into out_dir (default fairdrive-out/schedules). | runs |
| `gl_post_entry` | It never posts an entry to the ledger. | refused |
| `dms_purge_schedule` | It never clears or purges schedule items. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Schedule detail (`detail`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `schedule` (required) | text | Schedule, Schedule Number, Sched, Account | Kontennachweis, Détail de compte, 勘定明細, 明细表 |
| `control_number` (required) | text | Control Number, Control, Control #, Reference | Kontrollnummer, N° de contrôle, コントロール番号, 控制号 |
| `description` | text | Description, Desc, Memo, Name | Beschreibung, Description, 摘要, 摘要 |
| `date` | date | Date, Posting Date, Post Date, Doc Date | Datum, Date, 日付, 日期 |
| `amount` (required) | amount | Amount, Balance, Net Amount | Betrag, Montant, 金額, 金额 |

### Ledger balances by schedule (`balances`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `schedule` (required) | text | Schedule, Schedule Number, Account, GL Account | Kontennachweis, Détail de compte, 勘定明細, 明细表 |
| `schedule_name` | text | Schedule Name, Account Name, Description, Name | - |
| `gl_balance` (required) | amount | GL Balance, Balance, Ledger Balance, Ending Balance | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-gl-schedules inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-gl-schedules demo
npx -y fairdrive-gl-schedules mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-gl-schedules": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-gl-schedules",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-gl-schedules -- npx -y fairdrive-gl-schedules mcp --root .`, or install the `fairdrive-gl-schedules` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-gl-schedules approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-gl-schedules approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-gl-schedules kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-gl-schedules tools                 # every tool, its policy and arguments
fairdrive-gl-schedules sources               # the columns each input is read from
fairdrive-gl-schedules inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-gl-schedules call schedules_age '{"detail":"<detail>","balances":"<balances>"}'
fairdrive-gl-schedules eval                  # the private eval cases on the fictional fixtures
fairdrive-gl-schedules demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Receivable schedules are recognised by their names (receivable, in transit, warranty, factory, rebate, holdback). Credit balances on other schedules are not flagged.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Every figure comes from your files and settings. Check it before you act on it.
