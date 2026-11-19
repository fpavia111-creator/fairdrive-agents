# Fairdrive

[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

31 small MCP agents for franchise and independent auto dealers, repair shops and body shops. Each agent does **one job**: it reads a file your DMS (CDK, Reynolds and Reynolds, Dealertrack, DealerSocket, Tekion), shop system (Tekmetric, Shopmonkey), estimating system (CCC, Mitchell), floorplan lender or manufacturer already exports, and writes the list your office works from: what is missing, late, short or wrong.

MIT · Node 20 or newer · local files only · no credentials · fictional test data only

Fixed-price setup on your files: [Fairdrive](https://fair-agents.com/fairdrive.html). Built by Mythos Machines; the software is free, you pay for the setup.

## Try it

```bash
npm install
npm test
node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo
node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo
```

Every agent has a `demo` on fictional files, an `eval` with its own test cases and an MCP server (`<agent> mcp --root <folder>`). Sample reports are in [`sample-reports/`](sample-reports).

## The agents

### Deals and F&I

| Agent | What it does |
|---|---|
| [`fairdrive-deal-jackets`](packages/fairdrive-deal-jackets) | Every deal checked for the documents its type needs; missing and unsigned ones listed, oldest delivery first |
| [`fairdrive-contracts-in-transit`](packages/fairdrive-contracts-in-transit) | Financed deals not yet funded, by lender and days, with open stips, short funding and money funded but not posted |
| [`fairdrive-finance-reserve`](packages/fairdrive-finance-reserve) | Reserve each deal should earn from the buy and contract rates, against what the lender actually paid |
| [`fairdrive-product-cancellations`](packages/fairdrive-product-cancellations) | Dealer chargebacks on cancelled service contracts, GAP and other products recomputed pro rata, and refunds not sent |
| [`fairdrive-service-contract-remittances`](packages/fairdrive-service-contract-remittances) | Every contract sold matched to its remittance; late, short, double or missing remittances listed |
| [`fairdrive-ofac-red-flags`](packages/fairdrive-ofac-red-flags) | OFAC and identity check records on file for each buyer and co-buyer, dated before delivery; presence only |
| [`fairdrive-customer-deposits`](packages/fairdrive-customer-deposits) | Deposits not applied to delivered deals, due back on dead deals, or held with no deal |
| [`fairdrive-we-owes`](packages/fairdrive-we-owes) | Promises made on deals that are late, unscheduled, or done without the cost booked |
| [`fairdrive-sales-commissions`](packages/fairdrive-sales-commissions) | Commission per deal from your pay plans, splits and minimums, against what was paid |

### Vehicles and floorplan

| Agent | What it does |
|---|---|
| [`fairdrive-floorplan-audit`](packages/fairdrive-floorplan-audit) | Inventory against the lender statement: sold and not paid off, on the statement but not in stock, balances that differ |
| [`fairdrive-curtailments`](packages/fairdrive-curtailments) | Principal pay-downs owed under your floorplan schedule, overdue and by week ahead |
| [`fairdrive-used-vehicle-aging`](packages/fairdrive-used-vehicle-aging) | Days in stock, units past your wholesale line, priced above or well below market, below cost or stale |
| [`fairdrive-reconditioning`](packages/fairdrive-reconditioning) | Days and cost from acquisition to front line, units stuck with open orders or never started |
| [`fairdrive-loaner-fleet`](packages/fairdrive-loaner-fleet) | Loaners and demos past or near their day and mile limits, and loaners out with no repair order |
| [`fairdrive-trade-payoffs`](packages/fairdrive-trade-payoffs) | Lien payoffs not sent, sent late or short of the per diem, not cleared, or without a lien release |
| [`fairdrive-title-tracking`](packages/fairdrive-title-tracking) | Title applications, trade titles, registrations and temp tags against your state's days |
| [`fairdrive-incentive-claims`](packages/fairdrive-incentive-claims) | Rebates, dealer cash and holdback expected per unit against the manufacturer statement |

### Service, parts and collision

| Agent | What it does |
|---|---|
| [`fairdrive-warranty-claims`](packages/fairdrive-warranty-claims) | Claims unpaid by age, paid short, rejected with their resubmit-by date, or debited after payment |
| [`fairdrive-open-repair-orders`](packages/fairdrive-open-repair-orders) | Open orders by age and advisor; past promise, waiting on parts, warranty and internal orders open too long |
| [`fairdrive-repair-order-margins`](packages/fairdrive-repair-order-margins) | Labor and parts gross by pay type and advisor; orders under your floors and parts sold below cost |
| [`fairdrive-comebacks`](packages/fairdrive-comebacks) | The same vehicle back within your days and miles for the same work, by technician and operation |
| [`fairdrive-flat-rate-hours`](packages/fairdrive-flat-rate-hours) | Flagged hours against clocked and punched time per technician, with jobs flagged and never worked |
| [`fairdrive-policy-adjustments`](packages/fairdrive-policy-adjustments) | Goodwill with no approver, self-approved, over your review line, unexplained or repeated |
| [`fairdrive-sublet-invoices`](packages/fairdrive-sublet-invoices) | Sublet lines against vendor invoices: over the PO, never invoiced, billed below cost or twice |
| [`fairdrive-parts-obsolescence`](packages/fairdrive-parts-obsolescence) | Parts on hand by months since last sale, valued, with returnable stock first |
| [`fairdrive-parts-receiving`](packages/fairdrive-parts-receiving) | Parts received against invoices: billed not received, received not billed, overpriced, duplicated |
| [`fairdrive-estimate-vs-invoice`](packages/fairdrive-estimate-vs-invoice) | The latest estimate and supplements against the final invoice by labor, parts, materials and sublet |
| [`fairdrive-insurance-supplements`](packages/fairdrive-insurance-supplements) | Supplements waiting on insurers, approved short or denied, with days to answer by insurer |

### The accounting office

| Agent | What it does |
|---|---|
| [`fairdrive-gl-schedules`](packages/fairdrive-gl-schedules) | Each schedule tied to the ledger and aged by control number; old items, credits and zero controls listed |
| [`fairdrive-dmv-fees`](packages/fairdrive-dmv-fees) | Title and registration fees collected on each deal against what the DMV or tag agency charged |
| [`fairdrive-sales-tax`](packages/fairdrive-sales-tax) | Tax on each deal recomputed from your county rate table, trade credit and caps |

All of them share [`fairdrive-core`](packages/fairdrive-core): the policy engine, approvals, audit log, customer-data masking, the readers for CSV, Excel and JSON exports in nine languages, and the report pages.

## How they stay safe

- **Local files only.** No login to a DMS, lender portal, manufacturer portal, DMV, insurer or bank; no network calls, no telemetry.
- **Masked before the model sees it.** Customer names, phones, e-mails, addresses and ID numbers become stable pseudonyms (`CU-3f9a1c2e`) in every result an AI model reads. The files written on your machine keep the real values.
- **People act.** Paying, funding, titling, filing, sending and posting are refused by every agent. Payoff lists, commission sheets and letters are drafts that wait for one named person's click, even in Auto mode, tied to the sha256 of the reviewed draft.
- **Settings, not hard-coded rules.** Days, rates, pay plans, tax rates, curtailment schedules and program limits are arguments or files your store confirms.
- **No compliance verdicts.** The OFAC and Red Flags agent checks that records exist and are dated before delivery; it never reads or clears a check result.
- **Every call audited** in a hash-chained log under `.fairdrive/`, with arguments stored as a hash.

## Checked

811 tests and 559 eval cases pass on Windows with Node 24. Hostile data and broken-argument runs: 0 findings. Every eval file read again as a German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean export gives the same answers. Numbers, bugs fixed and what is not checked yet: [REVIEW-ver1.md](REVIEW-ver1.md).

## Scripts

| Command | What it runs |
|---|---|
| `npm test` | every package's tests |
| `npm run hostile` / `npm run hostile:args` | planted formulas, HTML, path tricks and AI-aimed text; broken arguments in every tool |
| `npm run intl` | every spreadsheet eval case in eight more languages and legacy encodings |
| `npm run bench` | every report tool at 1,000 and 10,000 rows |
| `npm run release:check:offline` | metadata, honest-copy scan, secret scan, one-click policy, `npm pack` |
| `npm run samples` | rewrites `sample-reports/` |

## Licence

MIT. Fictional data only: every store, customer, lender, insurer, vehicle make and person in the fixtures is made up.
