<!-- written by scripts/agent-readmes.mjs; delete this line to edit by hand -->

# Fairdrive Service Contract Remittances (`fairdrive-service-contract-remittances`)

Matches every service contract (and other remitted F&I product) sold with its remittance to the provider by contract number, or deal and provider, and lists contracts not remitted past your days (the contract may not be in force), due within a week, remitted short, over, twice or late, and remittances for no sale. It never pays a provider or registers a contract.

MIT · Node 20 or newer · local files only · built on [`fairdrive-core`](../fairdrive-core) · part of [Fairdrive](../../README.md)

```bash
npx -y fairdrive-service-contract-remittances demo
npx -y fairdrive-service-contract-remittances mcp --root ./exports
```

## What it reads

- **Service contracts sold** (`sold`)
- **Remittances to providers** (`remittances`)

Every file is one you already export (CSV, Excel, JSON). Column names are matched by the agent's own name, common English names, named exports and their names in eight other languages; `inspect` shows how a file would be read without returning any value.

## What it does

- `remittances_check`: One row per finding, largest first: deal, contract, provider, sale date, remit-by date, dealer cost, remitted, finding (not_remitted_overdue, due_soon, remitted_short, remitted_over, remitted_twice, remitted_late, remittance_no_sale), amount. Totals.
- `remittances_write_report`: writes the same as CSV (for people to work) and HTML (to read, in the report language you choose with `--lang`).
- `ap_pay_provider` is listed and refused: It never remits money to a provider.
- `provider_portal_register` is listed and refused: It never registers or cancels a contract with a provider.

## Customer data

Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers replaced with stable pseudonyms (`--pii mask`, the default). The CSV and HTML files written on your machine keep the real values for the people working the list. Keep them in a secure folder.

<!-- generated:start -->

## A demo run

`npx -y fairdrive-service-contract-remittances demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairdrive Service Contract Remittances demo (fictional contracts and remittances, September to November 2026)

▶ Run the check on the exported files
  status: executed  decision: allow
  7 service contract(s), dealer cost 8075, remitted 5525. 1 not remitted past the deadline (980), 1 due within a week, 1 short, 0 over, 1 remitted twice, 1 remitted late, 1 remittance(s) with no sale.
    due_soon               SC-9003  Larkfield Vehicle Protection    1320
    remitted_twice         SC-9006  Larkfield Vehicle Protection    1050
    not_remitted_overdue   SC-9002  Larkfield Vehicle Protection     980
    remitted_late          SC-9005  Orbit Warranty Company           875
    remittance_no_sale     SC-9099  Orbit Warranty Company           700
    remitted_short         SC-9004  Orbit Warranty Company           100

▶ Write the report (CSV and HTML)
  status: executed  decision: allow
  Report written. 7 service contract(s), dealer cost 8075, remitted 5525. 1 not remitted past the deadline (980), 1 due within a week, 1 short, 0 over, 1 remitted twice, 1 remitted late, 1 remittance(s) with no sale.

▶ The agent tries ap_pay_provider itself
  status: blocked  decision: block
  reason: It never remits money to a provider.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `remittances_check` | One row per finding, largest first: deal, contract, provider, sale date, remit-by date, dealer cost, remitted, finding (not_remitted_overdue, due_soon, remitted_short, remitted_over, remitted_twice, remitted_late, rem… | runs |
| `remittances_write_report` | Write service-contract-remittances.csv and service-contract-remittances.html (one row per finding, with the totals) into out_dir (default fairdrive-out/remittances). | runs |
| `ap_pay_provider` | It never remits money to a provider. | refused |
| `provider_portal_register` | It never registers or cancels a contract with a provider. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Service contracts sold (`sold`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deal_number` (required) | text | Deal No, Deal Number, Deal # | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `customer` | text | Customer, Customer Name, Contract Holder, Buyer | Kunde, Client, 顧客, 客户 |
| `contract_number` | text | Contract Number, Contract #, Certificate, Agreement Number | - |
| `provider` (required) | text | Provider, Administrator, Company, Obligor | Anbieter, Fournisseur du contrat, プロバイダー, 服务商 |
| `sale_date` (required) | date | Sale Date, Contract Date, Deal Date | - |
| `dealer_cost` (required) | amount | Dealer Cost, Remit Amount, Cost, Net Remit | - |

### Remittances to providers (`remittances`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `contract_number` | text | Contract Number, Contract #, Certificate, Agreement Number | - |
| `deal_number` | text | Deal No, Deal Number, Deal #, Reference | Vorgangsnummer, N° de vente, 取引番号, 交易号 |
| `provider` | text | Provider, Administrator, Payee, Vendor | Anbieter, Fournisseur du contrat, プロバイダー, 服务商 |
| `remit_date` | date | Remit Date, Paid Date, Check Date, Date | - |
| `amount` (required) | amount | Amount, Remitted, Amount Paid, Check Amount | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairdrive-service-contract-remittances inspect <file>` (names and shapes only, never values) and name them in `fairdrive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairdrive-service-contract-remittances demo
npx -y fairdrive-service-contract-remittances mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairdrive-service-contract-remittances": {
      "command": "npx",
      "args": [
        "-y",
        "fairdrive-service-contract-remittances",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairdrive-service-contract-remittances -- npx -y fairdrive-service-contract-remittances mcp --root .`, or install the `fairdrive-service-contract-remittances` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairdrive-service-contract-remittances approve <id> --as "Your Name"` (or on the local approvals page, `fairdrive-service-contract-remittances approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairdrive-service-contract-remittances kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairdrive-service-contract-remittances tools                 # every tool, its policy and arguments
fairdrive-service-contract-remittances sources               # the columns each input is read from
fairdrive-service-contract-remittances inspect <file>        # how a file would be read (names and shapes, never values)
fairdrive-service-contract-remittances call remittances_check '{"sold":"<sold>","remittances":"<remittances>"}'
fairdrive-service-contract-remittances eval                  # the private eval cases on the fictional fixtures
fairdrive-service-contract-remittances demo
```

## Audit log and data

Every call is written to `.fairdrive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you export and give it. It does not log in to a DMS, lender portal, manufacturer system, DMV or bank.
- Remittance deadlines and what happens to a late contract are in each provider agreement; the days are a setting.
- Not legal, tax, lending or accounting advice. A person decides what to claim, pay, fund, title, charge back or post.
- Results returned to the AI model have customer names, phones, e-mails, addresses and ID numbers masked. The files written here keep the real values: keep them in a secure folder.
- Every figure comes from your files and settings. Check it before you act on it.
