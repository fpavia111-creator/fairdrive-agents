<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Deal Jackets (`fairdrive-deal-jackets`)

Checks every deal jacket against the documents a deal of its type should hold: buyer's order, odometer disclosure, title application, privacy notice, OFAC and Red Flags records, insurance and licence copies, the Buyers Guide on used cars, credit application and contract on financed deals, lease papers on leases, and trade-in title and power of attorney when there is a trade. Lists what is missing or unsigned, oldest delivery first. It reads files; it never books, changes, unwinds or sends a deal, and it does not decide whether a deal meets any law.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-deal-jackets demo
npx -y fairdrive-deal-jackets mcp --root ./exports
```

## What it reads

- **Deal list** (`deals`)
- **Deal jacket document index** (`documents`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `jackets_check_jackets`: One row per incomplete deal: documents missing and documents unsigned (by name), days since delivery, F&I manager. Totals by document and by F&I manager, scanned deal numbers that are not in the deal file, and document names it did not recognise.
- `jackets_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `dms_book_deal` is listed and refused: Fairdrive Deal Jackets never books, unwinds or changes a deal in the DMS.
- `esign_send_envelope` is listed and refused: Fairdrive Deal Jackets never sends documents to a customer for signature.

## What the AI model sees

- **Masked** (stable pseudonyms such as `CU-3f2a9c1d` and `ST-8cea1a2d`, or `[PHONE]`-style placeholders): customer name (`customer`), staff name (`fi_manager`). Where these values appear inside other text they are replaced too.
- **Sent as they are:** ids, codes and names of businesses (`deal_number`, `deal_type`, `sale_type`, `stock_number`, `status`, `signed`); VINs (`trade_vin`; pseudonymised with `--pii strict`); dates (`deal_date`, `delivery_date`, `received_date`).
- **Free text sent as written** (known names, phone numbers, e-mails and SSN-like numbers inside it are replaced; anything else typed there is not): `document`.
- Results go to whatever model your AI assistant uses. For data you may not share with that provider, use a local model or one covered by your agreements with it. The CSV and HTML files written on your machine keep the real values for the people working the list: keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-deal-jackets demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Deal Jackets demo (fictional deals at a fictional store, October and November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  9 deal(s) checked: 6 incomplete, 3 complete. 18 document(s) missing, 2 unsigned. Oldest incomplete jacket: 40 day(s) since delivery. 1 scanned deal number(s) not in the deal file.
    D1010     4 days  missing 11, unsigned 0: Buyer's order / bill of sale; Odometer disclosure; Title / registration application
    D1002    40 days  missing 2, unsigned 1: Buyers Guide (window form); Power of attorney; Credit score / risk-based pricing notice
    D1006    25 days  missing 2, unsigned 0: OFAC check record; Red Flags / identity check record
    D1009     6 days  missing 2, unsigned 0: Proof of insurance; Copy of driver's license
    D1003    36 days  missing 1, unsigned 0: Lease agreement
    D1004    31 days  missing 0, unsigned 1: Retail installment contract

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 9 deal(s) checked: 6 incomplete, 3 complete. 18 document(s) missing, 2 unsigned. Oldest incomplete jacket: 40 day(s) since delivery. 1 scanned deal number(s) not in the deal file.

▶ The agent tries dms_book_deal itself
  status: blocked  decision: block
  reason: Fairdrive Deal Jackets never books, unwinds or changes a deal in the DMS.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `jackets_check_jackets` | One row per incomplete deal: documents missing and documents unsigned (by name), days since delivery, F&I manager. | runs |
| `jackets_write_report` | Write deal-jackets.csv and deal-jackets.html (one row per finding, with the totals) into out_dir (default fairdrive-out/jackets). | runs |
| `dms_book_deal` | Fairdrive Deal Jackets never books, unwinds or changes a deal in the DMS. | refused |
| `esign_send_envelope` | Fairdrive Deal Jackets never sends documents to a customer for signature. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Deal list (`deals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal #, Deal ID, Deal | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `deal_date` | date | Deal Date, Contract Date, Sold Date, Sale Date | - |
| `delivery_date` | date | Delivery Date, Delivered, Delivered Date, Funded/Delivered | Auslieferungsdatum, Date de livraison, 納車日, 交车日期 |
| `customer` | text | Customer, Customer Name, Buyer, Buyer Name, Purchaser | Kunde, Client, 顧客, 客户 |
| `deal_type` | text | Deal Type, Finance Type, Payment Type, Sale Kind | - |
| `sale_type` | text | Sale Type, New/Used, N/U, Vehicle Type, Stock Type | - |
| `stock_number` | text | Stock No, Stock Number, Stock #, Stock | Bestandsnummer, N° de stock, 在庫番号, 库存编号 |
| `trade_vin` | text | Trade VIN, Trade 1 VIN, Trade-In VIN | - |
| `fi_manager` | text | F&I Manager, Finance Manager, Business Manager, F&I | - |
| `status` | text | Deal Status, Status, State | Status, Statut, ステータス, 状态 |

### Deal jacket document index (`documents`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal #, Deal ID, Deal | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `document` (required) | text | Document, Document Name, Form, Form Name, Doc Type, Description | - |
| `signed` | yes/no | Signed, Signed?, Executed, E-Signed | - |
| `received_date` | date | Received Date, Scanned, Scan Date, Uploaded, Date | Eingangsdatum, Date de réception, 受領日, 收到日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-deal-jackets inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-deal-jackets demo
npx -y fairdrive-deal-jackets mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-deal-jackets": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-deal-jackets",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-deal-jackets -- npx -y fairdrive-deal-jackets mcp --root .`, or install the `fairdrive-deal-jackets` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-deal-jackets approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-deal-jackets approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-deal-jackets kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-deal-jackets tools                 # every tool, its policy and arguments
fairdrive-deal-jackets sources               # the columns each input is read from
fairdrive-deal-jackets inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-deal-jackets call jackets_check_jackets '{"deals":"<deals>","documents":"<documents>"}'
fairdrive-deal-jackets eval                  # the private eval cases on the fictional fixtures
fairdrive-deal-jackets demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- The checklist is a working default by deal type; your state, lenders and store policy may need more or fewer documents. It checks that a document is in the jacket, not that it is filled in correctly.
- Not legal advice. Whether a deal meets a law or a lender's rules is for your compliance officer.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
