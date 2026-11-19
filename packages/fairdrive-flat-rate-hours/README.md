<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Flat Rate Hours (`fairdrive-flat-rate-hours`)

Compares each technician's flagged (sold) hours with attendance hours clocked and the time punched on repair orders, works out proficiency, efficiency and productivity, and lists technicians under your proficiency floor, jobs flagged with no time punched, jobs flagged far above the time punched and days with flags but no clock-in. It never changes hours, flags or payroll.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-flat-rate-hours demo
npx -y fairdrive-flat-rate-hours mcp --root ./exports
```

## What it reads

- **Technician flag report** (`flags`)
- **Attendance clock** (`clock`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `flatrate_check`: Findings (flagged_no_time, flag_far_above_time, flags_without_clock, below_proficiency_floor) and one row per technician: hours clocked, flagged and punched, proficiency, efficiency, productivity.
- `flatrate_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `payroll_submit_hours` is listed and refused: It never submits hours or pay to payroll.
- `dms_edit_flag_hours` is listed and refused: It never changes flagged hours, punches or repair orders.

## Customer data

This agent reads no customer columns. Results still pass through the customer-data masker, which replaces anything that looks like a phone number, e-mail or SSN.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-flat-rate-hours demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Flat Rate Hours demo (fictional technicians, week of 9 November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  3 technician(s): 102.5 hours flagged, 112 clocked, 83.5 punched on jobs; shop proficiency 91.52%. 1 under the 85% floor; 1 job(s) flagged with no time, 1 flagged far above time, 1 day(s) flagged with no clock-in.
    Corin Brennan    clocked    32  flagged  22.5  proficiency 70.31%
    Ines Alvarez     clocked    40  flagged    41  proficiency 102.5%
    Mei Chu          clocked    40  flagged    39  proficiency 97.5%
    flagged_no_time: Corin Brennan R7
    flag_far_above_time: Mei Chu R13
    flags_without_clock: Corin Brennan R10
    below_proficiency_floor: Corin Brennan 

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 3 technician(s): 102.5 hours flagged, 112 clocked, 83.5 punched on jobs; shop proficiency 91.52%. 1 under the 85% floor; 1 job(s) flagged with no time, 1 flagged far above time, 1 day(s) flagged with no clock-in.

▶ The agent tries payroll_submit_hours itself
  status: blocked  decision: block
  reason: It never submits hours or pay to payroll.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `flatrate_check` | Findings (flagged_no_time, flag_far_above_time, flags_without_clock, below_proficiency_floor) and one row per technician: hours clocked, flagged and punched, proficiency, efficiency, productivity. | runs |
| `flatrate_write_report` | Write flat-rate-hours.csv and flat-rate-hours.html (one row per finding, with the totals) into out_dir (default fairdrive-out/flatrate). | runs |
| `payroll_submit_hours` | It never submits hours or pay to payroll. | refused |
| `dms_edit_flag_hours` | It never changes flagged hours, punches or repair orders. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Technician flag report (`flags`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `technician` (required) | text | Technician, Tech, Tech Name, Technician Name, Tech # | Mechaniker, Technicien, 整備士, 技师 |
| `ro_number` (required) | text | RO Number, RO #, RO, Repair Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `date` (required) | date | Date, Flag Date, Closed Date, Work Date | Datum, Date, 日付, 日期 |
| `labor_type` | text | Labor Type, Pay Type, Type, Labor Code | - |
| `flag_hours` (required) | number | Flag Hours, Flagged Hours, Sold Hours, Hours Flagged, Flagged | - |
| `actual_hours` | number | Actual Hours, Clocked On RO, Punch Hours, Time On Job, Actual | - |

### Attendance clock (`clock`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `technician` (required) | text | Technician, Tech, Employee, Name, Tech Name | Mechaniker, Technicien, 整備士, 技师 |
| `date` (required) | date | Date, Work Date, Shift Date | Datum, Date, 日付, 日期 |
| `clock_hours` (required) | number | Clock Hours, Hours Clocked, Attendance Hours, Hours, Total Hours | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-flat-rate-hours inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-flat-rate-hours demo
npx -y fairdrive-flat-rate-hours mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-flat-rate-hours": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-flat-rate-hours",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-flat-rate-hours -- npx -y fairdrive-flat-rate-hours mcp --root .`, or install the `fairdrive-flat-rate-hours` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-flat-rate-hours approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-flat-rate-hours approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-flat-rate-hours kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-flat-rate-hours tools                 # every tool, its policy and arguments
fairdrive-flat-rate-hours sources               # the columns each input is read from
fairdrive-flat-rate-hours inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-flat-rate-hours call flatrate_check '{"flags":"<flags>","clock":"<clock>"}'
fairdrive-flat-rate-hours eval                  # the private eval cases on the fictional fixtures
fairdrive-flat-rate-hours demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Proficiency is flagged over clocked hours; efficiency is flagged over time punched on jobs. Stores define these differently; the figures follow those definitions.
- It points at hours to look at. It does not judge a technician, and pay is decided by a person under your pay plan and the law.
- Every figure comes from your files and settings. Check it before you act on it.
