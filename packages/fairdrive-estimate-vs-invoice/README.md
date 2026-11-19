<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Estimate vs Invoice (`fairdrive-estimate-vs-invoice`)

Compares the latest estimate on each collision repair (the original estimate plus supplements, from CCC ONE, Mitchell or another estimating system) with the final invoice, by labor, parts, materials and sublet, and lists repairs invoiced over the estimate (the insurer pays the estimate), under it (items approved but not billed), invoices with no estimate and estimates not invoiced. It never contacts an insurer or changes an invoice.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-estimate-vs-invoice demo
npx -y fairdrive-estimate-vs-invoice mcp --root ./exports
```

## What it reads

- **Estimates and supplements** (`estimates`)
- **Final repair invoices** (`invoices`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `estimates_compare`: One row per repair that needs a look, largest first: claim, insurer, latest version, estimate and invoice totals, difference by category, finding (invoiced_over_estimate, invoiced_under_estimate, no_estimate, not_invoiced). Totals.
- `estimates_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `insurer_portal_submit` is listed and refused: It never sends an estimate, supplement or invoice to an insurer.
- `dms_change_invoice` is listed and refused: It never changes an invoice or repair order.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-estimate-vs-invoice demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Estimate vs Invoice demo (fictional collision repairs, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  6 repair(s): estimated 22320, invoiced 19600. 1 invoiced over the latest estimate (230), 1 under (350), 1 invoice(s) with no estimate, 1 estimate(s) not invoiced (3800).
    not_invoiced             B1005  estimate    3800  invoice       -  
    no_estimate              B1099  estimate       -  invoice    1200  
    invoiced_under_estimate  B1004  estimate    5650  invoice    5300  labor -200, parts -150
    invoiced_over_estimate   B1003  estimate    2920  invoice    3150  labor +100, parts +100, materials +30

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 6 repair(s): estimated 22320, invoiced 19600. 1 invoiced over the latest estimate (230), 1 under (350), 1 invoice(s) with no estimate, 1 estimate(s) not invoiced (3800).

▶ The agent tries insurer_portal_submit itself
  status: blocked  decision: block
  reason: It never sends an estimate, supplement or invoice to an insurer.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `estimates_compare` | One row per repair that needs a look, largest first: claim, insurer, latest version, estimate and invoice totals, difference by category, finding (invoiced_over_estimate, invoiced_under_estimate, no_estimate, not_invo… | runs |
| `estimates_write_report` | Write estimate-vs-invoice.csv and estimate-vs-invoice.html (one row per finding, with the totals) into out_dir (default fairdrive-out/estimates). | runs |
| `insurer_portal_submit` | It never sends an estimate, supplement or invoice to an insurer. | refused |
| `dms_change_invoice` | It never changes an invoice or repair order. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Estimates and supplements (`estimates`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, Repair Order, Work Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `claim_number` | text | Claim Number, Claim #, Claim | Antragsnummer, N° de demande, 請求番号, 索赔号 |
| `insurer` | text | Insurer, Insurance Company, Carrier, Payer | Versicherer, Assureur, 保険会社, 保险公司 |
| `version` | text | Version, Estimate Version, Supplement, Sup | - |
| `estimate_date` | date | Estimate Date, Date, Written Date | - |
| `labor` | amount | Labor, Labor Total, Body Labor | - |
| `parts` | amount | Parts, Parts Total | - |
| `materials` | amount | Materials, Paint Materials, Paint and Materials | - |
| `sublet` | amount | Sublet, Sublet Total | - |
| `total` (required) | amount | Total, Estimate Total, Gross Total, Grand Total | Betrag, Montant, 金額, 金额 |

### Final repair invoices (`invoices`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `ro_number` (required) | text | RO Number, RO #, Repair Order, Work Order | Auftragsnummer, N° d’OR, 修理オーダー番号, 维修工单号 |
| `invoice_date` | date | Invoice Date, Date, Closed Date | Rechnungsdatum, Date de facture, 請求日, 发票日期 |
| `customer` | text | Customer, Customer Name, Owner | Kunde, Client, 顧客, 客户 |
| `labor` | amount | Labor, Labor Total | - |
| `parts` | amount | Parts, Parts Total | - |
| `materials` | amount | Materials, Paint Materials | - |
| `sublet` | amount | Sublet, Sublet Total | - |
| `total` (required) | amount | Total, Invoice Total, Grand Total | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-estimate-vs-invoice inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-estimate-vs-invoice demo
npx -y fairdrive-estimate-vs-invoice mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-estimate-vs-invoice": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-estimate-vs-invoice",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-estimate-vs-invoice -- npx -y fairdrive-estimate-vs-invoice mcp --root .`, or install the `fairdrive-estimate-vs-invoice` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-estimate-vs-invoice approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-estimate-vs-invoice approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-estimate-vs-invoice kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-estimate-vs-invoice tools                 # every tool, its policy and arguments
fairdrive-estimate-vs-invoice sources               # the columns each input is read from
fairdrive-estimate-vs-invoice inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-estimate-vs-invoice call estimates_compare '{"estimates":"<estimates>","invoices":"<invoices>"}'
fairdrive-estimate-vs-invoice eval                  # the private eval cases on the fictional fixtures
fairdrive-estimate-vs-invoice demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The latest estimate is the highest version (E01, then S01, S02...); each supplement is read as the full revised estimate, as estimating systems print it.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
