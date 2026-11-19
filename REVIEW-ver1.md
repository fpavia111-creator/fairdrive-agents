# Fairdrive ver 1: review

18 Nov 2026. What was built, how it was checked, what was found and fixed, what is not checked yet,
and every decision made without Kurt (he asked for the suite to be built today without his input).

## Scope

Fairdrive is the Fair Agents product for **franchise and independent auto dealers, repair shops and body
shops**. 31 agents plus `fairdrive-core`, version 0.1.0 of every package, nothing published.

| Area | Agents |
|---|---|
| Deals and F&I (9) | deal-jackets, contracts-in-transit, finance-reserve, product-cancellations, service-contract-remittances, ofac-red-flags, customer-deposits, we-owes, sales-commissions |
| Vehicles and floorplan (8) | floorplan-audit, curtailments, used-vehicle-aging, reconditioning, loaner-fleet, trade-payoffs, title-tracking, incentive-claims |
| Service, parts and collision (11) | warranty-claims, open-repair-orders, repair-order-margins, comebacks, flat-rate-hours, policy-adjustments, sublet-invoices, parts-obsolescence, parts-receiving, estimate-vs-invoice, insurance-supplements |
| Accounting office (3) | gl-schedules, dmv-fees, sales-tax |

Every package is `fairdrive-<job>`; tool prefixes are one job word (`jackets_check`, `payoffs_draft_batch`).
Each agent reads files a dealer or shop already exports (DMS deal, inventory, RO and schedule reports;
Tekmetric and Shopmonkey RO exports; CCC and Mitchell estimates; floorplan, lender, manufacturer, provider
and insurer statements) and writes a worklist as CSV and HTML. None logs in anywhere.

## Checks run, and results

All on this machine: Windows 10, Node 24.20.0.

| Check | Result |
|---|---|
| `npm test` (32 workspaces) | **812 tests, 812 pass, 0 fail**: 133 in `fairdrive-core`, 21 to 26 per agent |
| Eval cases (`<agent> eval`, also run inside each agent's tests) | **559 cases, all pass**; 17 to 22 per agent (hand-written domain cases, generated policy cases, German and Japanese export cases) |
| `npm run hostile` (formulas, HTML, `../` ids and AI-aimed instructions planted in every fixture; every eval case) | **2,795 calls, 327 planted values, 0 findings**; 72 results correctly flagged for instruction-like text |
| `npm run hostile:args` (null, numbers, arrays, a 200,000-character string, NUL, `../` and absolute paths in every argument of every tool; data and export passes included) | **9,749 calls, 0 findings**, after the hang fix below (run as six parallel workers, a few agents each) |
| `npm run intl` (every spreadsheet eval case re-read as a German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean export, legacy encodings, comma decimals, local dates) | **31 agents, 361 cases × 8 languages, every case that passes in English passes in every language**; 189 of 355 columns found by a translated name (German count) |
| `npm run bench` (1,000 and 10,000 rows) | **62 tools in 31 agents, all run at 10,000 rows, 0 need attention** after the fixes below; median 2.4 s at 10,000 rows, slowest 5.8 s (contracts in transit), peak memory 245 MB. Timings were taken while other sessions ran heavy checks on the same machine |
| `npm run release:check:offline` | **passes**: 32 packages listed, metadata in order, git clean, no `.npmrc`, secret scan (869 files) clean, honest copy (97 files) clean, one-click policy clean, no paid tools, 812 tests, 559/559 evals, hostile 0 findings, `npm pack` of 32 packages (527 KB) with no tests, state, output or keys. npm names skipped offline (checked separately below) |
| Contract tests in every agent | every tool that runs has an eval; readable errors for missing or wrong arguments; files outside `--root` refused; Review mode and the kill switch hold; drafts tied to their sha256; same answer twice, with columns reordered, an extra column, BOM and CRLF, padded values, blank lines or rows in another order; a header-only file answered; report page in the report language with the CSV unchanged; the agent's own column names read as they are; **masking canaries** (3 to 5 fictional customer names per agent never reach a result; agents that read no customer column say why) |
| `npm view` for all 32 package names (read-only) | **all 32 free** on npm, 18 Nov 2026 |
| MCP Registry step (`node ..\add-mcp-registry.cjs fairdrive-agents fairdrive.html`) | `mcpName` and `server.json` added to all 31 agents |
| Plugin files, generated README parts, policy and intl eval cases | `--check` passes for each |

## Built on

- `fairdrive-core` is the Lodestar core (with the 18 Nov Windows fixes) with the freight modules removed and
  replaced by `dealer.js` (VIN check digit and tail matching, stock/deal/RO numbers, aging buckets, lender and
  vendor name grouping), plus `pii.js`, the customer-data masker ported from Remedy (with the Evergreen fix for
  values with leading punctuation), wired into every result, error and audit summary (`--pii mask|strict|off`).
- `checkAgent()` in `kit.js` wires one check into a manifest: a read tool, a report tool, an optional
  draft → one-click request pair, and refused tools a model can see. Each agent keeps its own logic, columns,
  settings, fixtures, evals and tests.
- Report titles, section headings and common column names in nine languages (`report-text.js`); dealer column
  names in eight more languages (`i18n/columns.js`).

## Found and fixed during the build

- **Core: `hostile:args` hung on Windows.** A report written to a 200,000-character `out_dir` reached a
  recursive `mkdir`, which never returns on Windows (one CPU at 100%, no output for 20 minutes). `safePath` now
  refuses paths over 1,024 characters or with a name over 255 before the file system sees them. Every family
  copied from the Lodestar core has the same code; a note for the other sessions is in the shared notes folder.
- **Bench: two agents were quadratic.** product-cancellations counted unique rows with `findIndex` inside
  `filter`, and sublet-invoices searched every sublet line for each invoice: about 79 s at 10,000 rows. Both are
  linear now (about 1.3 s). contracts-in-transit searched the whole lender statement per contract (10.7 s);
  statement lines are now indexed by deal number and VIN tail (about 5 s).
- **Core: one file given for two arguments** (for example the same CSV as `deals` and `checks`) was read twice
  with the first argument's column layout, so the second read silently found none of its columns. Each read now
  takes the next argument that names the file. Found by an OFAC eval; core test added.
- **Core: a header that matches a field only by letter case or punctuation** (`ID` for `id`, `Deal_Number` for
  `deal_number`) was treated as "already in the agent's names" and left unrenamed, so the agent read the column
  as blank. It is now renamed. Inherited from the Lodestar core; worth porting back. Core test added.
- **Japanese and Chinese sales-tax files** were decoded in the wrong text encoding because their only translated
  header was a one-character word (郡, 县), which the encoding guesser ignores. Two-character words (郡名, 县名) now
  come first; the intl check passes in all eight languages.
- **Named export layouts that matched the agent's own column names** (floorplan statement, manufacturer
  incentive and warranty statements): a file written in the agent's own names was taken for the vendor export.
  The vendor signatures now need a column the agent does not use, and the floorplan statement profile was dropped.
- **Release check on Windows** built `file://C:/...` URLs by hand; it now uses `pathToFileURL`.
- **Freight wording** left from the copy (plugin category and marketplace name, comments, core README) removed.
- **Nine eval expectations I wrote by hand were wrong**, not the agents: each was re-worked by hand and the agent
  was right (for example a wider chargeback window also clears D3001; a 90-day comeback window still excludes a
  repair 1,500 miles later). The corrected numbers are what the evals now hold.
- **Themed names**: the family was first built with horse-breed names; renamed to `fairdrive-<job>` under the
  brief's naming section, with tool prefixes, titles and READMEs, and all tests re-run.

## Not checked yet (say this out loud)

- **No real export has been read.** Column layouts for CDK, Reynolds and Reynolds, Dealertrack, DealerSocket,
  Tekion, Tekmetric, Shopmonkey, CCC, Mitchell and the floorplan, manufacturer, lender and provider statements
  were written from knowledge and are marked "recalled". The first setup confirms them with `inspect`.
- **Rules and defaults are working examples**, not anyone's terms: the deal-jacket checklist, 90-day full
  chargeback and pro-rata method, 75% reserve share on a simple-interest contract, 5-day floorplan payoff,
  curtailment schedules, 60-day wholesale line, title and temp-tag days, 30-day incentive and remittance
  deadlines, 85% proficiency floor, 65%/30% margin floors, loaner 180 days / 6,000 miles. Every agent takes
  them as settings; a dealership controller should read the defaults before a store relies on them.
- **Units:** odometers and mileage limits are read as written (miles). A store that exports kilometres sets its
  limits in kilometres; there is no conversion.
- **Node 20 and 22, Linux and macOS** were not run here (only Windows, Node 24). The CI workflow covers them.
- **MCP conformance with the official SDK client** (`npm run mcp:check`) was not run: it needs the SDK installed
  from the network. The built-in stdio test in every agent passes.
- **Translations** (report pages, column names, eight READMEs) are by Claude; no native-speaker review yet.
- **Sample reports** show raw numbers (no thousands separators or currency symbol).
- No dealer, controller, F&I, fixed-ops, collision, lawyer or accountant has reviewed the agents yet.

## Decisions made without Kurt

1. **31 agents**, all 28 jobs named in the task plus three more the office needs every month: GL schedules,
   we-owes and loaner/demo fleet. Grouped in four areas for the site.
2. **Names**: `fairdrive-<job>`, display titles "Fairdrive Deal Jackets" etc., acronyms kept (DMV, OFAC, GL).
3. **Customer data masked; staff names masked too since the final pass.** Buyers, co-buyers, owners and insureds
   are masked. The build left salespeople, technicians and advisors in clear, on the wrong reasoning that the checks
   needed them: the checks run on the real values before masking, so the final pass masks them as well (see
   "Final pass"). VINs are masked only in `--pii strict`, since most checks match on them.
4. **Drafts that wait for one named click** in 10 agents: lender funding follow-up, chargeback review, reserve
   inquiry, incentive inquiry, warranty review, parts credit request, supplement follow-up (`binding_send`), and
   floorplan payoff list, trade payoff batch, commission sheet (`move_money`). Every other agent only reports.
   Every agent lists 2 refused tools a model can see (portal submits, payments, ledger posts, DMS changes).
5. **OFAC and Red Flags**: presence, date and "result recorded" only. It never runs a check, reads a result,
   says a deal is compliant or clears a match, and every result says so.
6. **Sales tax**: the county rate table is the store's own settings file (rate, trade credit, doc fee taxable,
   cap); there is no built-in tax table.
7. **Commissions**: percent of front and back gross (negative gross counts as zero), the greater of that and the
   mini, split equally; spiffs, draws, packs and chargebacks are left out of ver 1 and the report says so.
8. **Hand-written evals live in `evals/own.json`**; `scripts/policy-evals.mjs` adds the safety cases and
   `scripts/make-intl-fixtures.mjs` the German and Japanese cases into `evals/cases.json`.
9. **Prices** (`sales/pricing-page-ver1.md`, `sales/site.json`): seven packs from 1,500 to 3,000, whole store
   7,500, dealer group (2 to 4 rooftops) 11,000, partner rollout (up to 15 stores) 15,000; support 250 a month
   per pack, 600 whole store, 300 per rooftop. In line with Fairpractice and Fairstay.
10. **Site page**: `fairdrive.html` (used for `websiteUrl` in every `server.json`).

## Ideas for ver 2

Read one real export per DMS and shop system to confirm columns; money formatting in reports; kilometre
support for odometers; a "month-end pack" that runs schedules, contracts in transit, floorplan, payoffs and
warranty in one go; spiffs, draws and packs in commissions; rule-of-78s and cancel fees per provider; porting
the two core fixes back to the Lodestar family.
