<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Title Tracking (`fairdrive-title-tracking`)

Tracks title applications, trade-in titles, registrations and temporary tags for every delivered deal against the days you set for your state, and lists applications late or due within a week, trade titles not received, temporary tags expired or about to expire with no registration, and registrations pending too long. It never files with the DMV or changes a deal.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-title-tracking demo
npx -y fairdrive-title-tracking mcp --root ./exports
```

## What it reads

- **Delivered deals (title log)** (`deals`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `titles_track`: One row per deal that needs action, oldest delivery first: days since delivery, dates sent and issued, temporary tag expiry, trade title, findings (application_late, application_due_soon, trade_title_missing, temp_tag_expired, temp_tag_expiring, registration_pending). Totals by finding.
- `titles_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dmv_submit_application` is listed and refused: It never files a title or registration application.
- `dms_update_deal` is listed and refused: It never changes a deal or its title log.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): customer name (`customer`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `state`); VINs (`vin`, `trade_vin`; pseudonymised with `--pii strict`); dates (`delivery_date`, `trade_title_received`, `title_application_sent`, `registration_issued`, `temp_tag_expires`).
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-title-tracking demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Title Tracking demo (fictional delivered deals, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 delivered deal(s), 4 needing action: 1 title application(s) late, 1 due within a week, 1 trade title(s) missing, 2 temporary tag(s) expired and 1 expiring, 1 registration(s) pending too long.
    D9005   75 days  temp_tag_expired, registration_pending
    D9002   45 days  application_late, temp_tag_expired
    D9003   26 days  application_due_soon, temp_tag_expiring
    D9004   21 days  trade_title_missing

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 delivered deal(s), 4 needing action: 1 title application(s) late, 1 due within a week, 1 trade title(s) missing, 2 temporary tag(s) expired and 1 expiring, 1 registration(s) pending too long.

▶ The agent tries dmv_submit_application itself
  status: blocked  decision: block
  reason: It never files a title or registration application.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `titles_track` | One row per deal that needs action, oldest delivery first: days since delivery, dates sent and issued, temporary tag expiry, trade title, findings (application_late, application_due_soon, trade_title_missing, temp_tag… | runs |
| `titles_write_report` | Write title-tracking.csv and title-tracking.html (one row per finding, with the totals) into out_dir (default fairdrive-out/titles). | runs |
| `dmv_submit_application` | It never files a title or registration application. | refused |
| `dms_update_deal` | It never changes a deal or its title log. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Delivered deals (title log) (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal #, Deal ID | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Buyer | Kunde, Client, 顧客, 客户 |
| `vin` | text | VIN, Vehicle VIN | FIN, Numéro de série, 車台番号, 车架号 |
| `delivery_date` (required) | date | Delivery Date, Delivered, Sold Date, Deal Date | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `state` | text | State, Registration State, Title State | - |
| `trade_vin` | text | Trade VIN, Trade 1 VIN, Trade-In VIN | - |
| `trade_title_received` | date | Trade Title Received, Title In, Trade Title Date | - |
| `title_application_sent` | date | Title Application Sent, Title App Sent, Sent to DMV, Submitted to Tag Agency | - |
| `registration_issued` | date | Registration Issued, Plates Issued, Registration Date, Title Issued | - |
| `temp_tag_expires` | date | Temp Tag Expires, Temporary Tag Expiration, Temp Tag Exp | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-title-tracking inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-title-tracking demo
npx -y fairdrive-title-tracking mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-title-tracking": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-title-tracking",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-title-tracking -- npx -y fairdrive-title-tracking mcp --root .`, or install the `fairdrive-title-tracking` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-title-tracking approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-title-tracking approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-title-tracking kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-title-tracking tools                 # every tool, its policy and arguments
fairdrive-title-tracking sources               # the columns each input is read from
fairdrive-title-tracking inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-title-tracking call titles_track '{"deals":"<deals>"}'
fairdrive-title-tracking eval                  # the private eval cases on the fictional fixtures
fairdrive-title-tracking demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The day limits are settings. State deadlines differ and change; set them from your state rules. This is not legal advice.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
