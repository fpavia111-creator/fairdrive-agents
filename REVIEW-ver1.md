# Fairdrive ver 1: review

18 Nov 2026 (final pass 19 Nov: see the last section for the final numbers). What was built, how it was checked, what was found and fixed, what is not checked yet,
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

## Final pass (19 Nov 2026)

Run on request from the main session, following `FINAL-PASS-REQUEST.md` and the brief's "Final pass" list. Everything
below was run on Windows 10, Node 24.20.0, from a **fresh clone** of this folder (`git clone`, `npm install --offline`),
unless it says otherwise. Fictional data only, apart from the public files under "Real data".

### The bar, from a fresh clone

| Check | Result |
|---|---|
| Fresh clone, `npm install --offline` | 32 packages linked, no network; the working tree stays clean (the lockfile was stale and is fixed, see below) |
| `try_it` | `node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo` runs all 6 steps offline with no setup |
| `npm test` (32 workspaces) | **816 tests, 816 pass** (812 at the build; masking, VIN and pseudonym-draft tests added) |
| `npm run evals` | **559/559** (restored: the script was missing) |
| `npm run accuracy` (new) | **185/185 planted found, 0 not planted, 205 clean rows with 0 findings, 63/63 mutations caught** |
| `npm run hostile` | 2,795 calls, 448 planted values, **0 findings** (72 results correctly flagged for instruction-like text) |
| `npm run hostile:args` (6 workers) | 31 agents, 9,749 calls, **0 findings** (run on the fresh clone of c8c3195; the later commit changed only the masker's speed, the lockfile and README text) |
| `npm run intl` | 31 agents, 361 cases × 8 languages: **every case that passes in English passes in every language** |
| `npm run bench` (1,000 and 10,000 rows) | 62 tools, **0 need attention**; median 0.46 s and slowest 2.8 s (comebacks) at 10,000 rows, peak 256 MB |
| `npm run release:check:offline` | **Ready to publish (dry run passed)**: git clean, secret scan 918 files clean, honest copy 97 files clean, one-click policy clean, 816 tests, 559/559 evals, hostile 0, pack 549 KB with no tests, state, output, keys or `.npmrc`; npm names skipped offline |
| `readme`, `plugin`, `policy:evals`, `intl:fixtures` `--check` | pass on the fresh Windows clone (they failed on CRLF before this pass) |
| Masking canaries (contract tests) | 102 fictional customer and staff names in 21 agents: **0 reached a result** |
| `npm view` for all 32 names (read-only) | **all 32 still free**, 19 Nov 2026 |
| `npm run realdata` | see "Real data" |

### The final-pass list

1. **Names.** Leftovers from the copied core were still in `fairdrive-core/README.md` (`iris-of-tests`, `acme-of-access`,
   `polaris-of-bills`, and "All 30 Fairdrive domain agents ... from `achernar-of-returns` to `vega-of-detention`", which
   was wrong) and in three script comments. Fixed. A search for the old horse-breed names and `<word>-of-<word>` names
   now finds nothing outside fixture data, REVIEW history and git history.
2. **Each agent read as a buyer.** Every README says what the agent reads, what it does, what it refuses (its two
   refused tools are listed by name), and shows a captured demo run. The "Customer data" paragraph was too general: it
   is now **"What the AI model sees"**, written from each agent's own columns (masked fields, fields sent as they are,
   free text). Sample reports regenerated.
3. **Honest copy.** No compliance, certification, savings, ROI or legal/tax advice claims in READMEs (9 languages),
   `sales/`, sample reports or `docs/`; the release check's honest-copy scan passes.
4. **Binding actions.** 10 agents draft something; each draft is approved only through a one-click request that waits
   for one named person even in Auto (7 `binding_send`, 3 `move_money`), tied to the draft's sha256. Every agent lists
   two refused tools (portal submits, payments, ledger posts, DMS changes) and blocks anything else by default. Checked
   by every agent's contract tests and the release check.
5. **Full bar from a clean install.** Table above. Two problems found and fixed on the way: `npm run evals` pointed at a
   script that did not exist (`scripts/run-all-evals.mjs` added), and a fresh Windows clone (CRLF) would have failed
   every `--check` script (they now ignore line endings, and `.gitattributes` keeps code LF and fixtures byte-exact).
6. **Fixtures fictional.** NHTSA's decoder showed the fixture VINs began with `7ZZ`, a world manufacturer code assigned
   to a real company (Beall Manufacturing, Inc.). All 46 fixture VINs now begin with `0ZZ`, which no manufacturer code
   can start with; the last 14 characters (and so every tail a fixture prints) are kept and the check digit recomputed
   (`scripts/fictional-vins.mjs`). NHTSA now reports no registered manufacturer for them. People, lenders, providers,
   insurers and vendors in the fixtures are invented. **Masking:** staff names are now masked too (see question 2).
7. **site.json and pricing page.** The 10 packages and prices match the pricing page line for line; the four groups list
   all 31 agents once. The partner package said "20 groups" (the dealer peer-group term), which read like a count: it
   now says "dealer peer groups" in both files. The masking line in `site.json` now includes staff names.
8. **Package contents.** `npm pack` of every package: no tests, state (`.fairdrive/`), output (`fairdrive-out/`), keys or
   `.npmrc`; the secret scan is clean. Downloaded real data lives in `_realdata/`, which is git-ignored.

Also fixed in this pass: incentive payments that match no expected claim showed the VIN tail and program code
normalised (`LA128652`, `RET202610`); they now show the statement's own values. `vinYear` now uses the 7th-character
rule (found with real data, below). **The masker was slow on big results:** the first bench after staff masking showed
sales commissions at 10.4 s for 10,000 deals (0.44 s with masking off); Node was turning the raw pseudonym key into a
key object on every HMAC. One key object and a token cache bring it to 1.1 s, with the same pseudonyms.
`package-lock.json` listed only the first 4 agents, so `npm install` in a fresh clone rewrote it; it is now complete.

### Kurt's five questions

**1. Accuracy** (`npm run accuracy`, `docs/accuracy.md`, each agent's `fixtures/accuracy.json`). On fictional test data:

- **Planted problems found: 185 of 185** (all 31 agents), and **0 findings on the planted files that were not planted**.
- **Clean set: 205 rows, 0 findings** (false positives). The clean set is the same files with the planted rows dropped
  or the one wrong cell repaired; contracts in transit within the alert days are listed as information, not counted.
- **One-fact mutations: 63 of 63 caught** (2 or 3 per agent, 1 for parts obsolescence), each giving exactly the named
  finding and nothing else.
- Honest limits: the planted list was written by me after the build and checked against the fixture rows by hand; the
  fixture files are small (5 to 43 rows each); this measures the rules on known layouts, not on a real store's exports.
  Recall and false positives on real dealer files are **not measured yet**.

| Agent | Planted found | Clean rows / findings | Mutations |
|---|---|---|---|
| comebacks | 3 / 3 | 9 / 0 | 2 / 2 |
| contracts-in-transit | 7 / 7 | 6 / 0 | 3 / 3 |
| curtailments | 5 / 5 | 2 / 0 | 2 / 2 |
| customer-deposits | 5 / 5 | 9 / 0 | 2 / 2 |
| deal-jackets | 21 / 21 | 43 / 0 | 2 / 2 |
| dmv-fees | 4 / 4 | 6 / 0 | 2 / 2 |
| estimate-vs-invoice | 4 / 4 | 5 / 0 | 2 / 2 |
| finance-reserve | 6 / 6 | 7 / 0 | 2 / 2 |
| flat-rate-hours | 4 / 4 | 20 / 0 | 3 / 3 |
| floorplan-audit | 5 / 5 | 5 / 0 | 2 / 2 |
| gl-schedules | 7 / 7 | 8 / 0 | 2 / 2 |
| incentive-claims | 7 / 7 | 4 / 0 | 2 / 2 |
| insurance-supplements | 4 / 4 | 2 / 0 | 2 / 2 |
| loaner-fleet | 5 / 5 | 3 / 0 | 2 / 2 |
| ofac-red-flags | 5 / 5 | 6 / 0 | 2 / 2 |
| open-repair-orders | 6 / 6 | 2 / 0 | 2 / 2 |
| parts-obsolescence | 4 / 4 | 4 / 0 | 1 / 1 |
| parts-receiving | 5 / 5 | 4 / 0 | 2 / 2 |
| policy-adjustments | 6 / 6 | 5 / 0 | 2 / 2 |
| product-cancellations | 7 / 7 | 4 / 0 | 2 / 2 |
| reconditioning | 7 / 7 | 3 / 0 | 2 / 2 |
| repair-order-margins | 5 / 5 | 3 / 0 | 2 / 2 |
| sales-commissions | 4 / 4 | 7 / 0 | 2 / 2 |
| sales-tax | 4 / 4 | 8 / 0 | 2 / 2 |
| service-contract-remittances | 6 / 6 | 7 / 0 | 2 / 2 |
| sublet-invoices | 6 / 6 | 7 / 0 | 2 / 2 |
| title-tracking | 7 / 7 | 3 / 0 | 2 / 2 |
| trade-payoffs | 6 / 6 | 2 / 0 | 2 / 2 |
| used-vehicle-aging | 8 / 8 | 4 / 0 | 2 / 2 |
| warranty-claims | 7 / 7 | 4 / 0 | 2 / 2 |
| we-owes | 5 / 5 | 3 / 0 | 2 / 2 |
| **Family (31 agents)** | **185 / 185** | **205 / 0** | **63 / 63** |

**2. Security: what reaches the model** (`npm run model-view`, `docs/model-view.md`, and each README's "What the AI
model sees").

- **Masked** in every result (stable `CU-`/`ST-` pseudonyms or placeholders): customer names, co-buyers, owners,
  insureds; phones, e-mails, addresses, SSN-like numbers, licence, account and customer numbers; and, new in this pass,
  **staff names** (salespeople, split partners, technicians, advisors, F&I managers, people who ran a check, adjustment
  approvers). A masked value is also replaced inside any other text. The checks run on the real values before
  masking, and the CSV/HTML files written on the user's computer keep the real values. A salesperson's commission
  sheet can be drafted from the `ST-` pseudonym the model saw (test added).
- **Sent as they are:** deal, stock, RO, claim, PO, invoice and contract numbers; VINs (pseudonymised with
  `--pii strict`); dates; amounts; business names (lenders, providers, vendors, insurers, agencies, counties).
- **Free text** (descriptions, cancellation and adjustment reasons, stips, concerns, we-owe items, documents) is sent
  as written, with known names and phone/e-mail/SSN patterns replaced. Anything else a person typed there reaches the
  model.
- **Canaries:** 102 fictional customer and staff names across 21 agents, each proven by a contract test never to
  reach any result of any eval case (the 10 other agents read no customer or staff column and say so);
  **0 reached a result**. Hostile passes: see the table above.
- Results go to whatever model the user's AI assistant uses. For data that may not be shared with that provider, use a
  local model or one covered by the user's agreements. No claim of compliance with any law or standard is made.

**3. Compatibility.** 14 named export layouts (CDK deal list, inventory and open RO; Reynolds deal recap; Tekion deals;
Dealertrack funding; DealerSocket inventory; Tekmetric repair orders; Shopmonkey orders; CCC ONE and Mitchell estimates;
floorplan statement; manufacturer warranty and incentive statements) plus the column aliases in every agent. **Tested
against a real export: 0. Checked against vendor documentation: 0. Written from knowledge of the export: all 14.** VIN
columns and VIN matching were tested on public real data (below). The first setup with a store confirms its files
with `inspect`.

**4. Commercial traction.** No paying customers; no checkout is live (the main session answers this for the suite).

**5. Support: rules that are dated settings** (`npm run settings`, `docs/settings.md`). 67 settings in 31 agents, each
with its default, for example the contracts-in-transit alert (10 days), full chargeback window (90 days), reserve share
(75%), floorplan payoff days (5), curtailment schedules (new 10% at 91/181/271 days, used 10% at 61/121), incentive and
warranty deadlines (30 days), title days (30 to file, 45 for registration), proficiency floor (85%), margin floors
(65%/30%), loaner limits (180 days / 6,000 miles). None is a law or any lender's, manufacturer's or state's terms: all
are working examples written for 0.1.0 on 18 Nov 2026, not yet reviewed by a dealer, controller or lawyer. **Where:**
the default is in each agent's `src/check.js`; each is a named argument of its check tool. Tax rates, pay plans and
extra deal-jacket documents come from the store's own files. **How a store updates one:** pass it when the tool runs;
every result lists the settings it used. **Who maintains them:** Mythos Machines, in releases with a CHANGELOG line; the
support plan covers settings updates when a store's lender, manufacturer or state rules change.

### Real data

`npm run realdata:download` fetches; `npm run realdata` runs offline; results in `docs/realdata.md` and
`docs/realdata.json`. Downloaded files stay in `_realdata/` (git-ignored, not committed).

| Source | Date | Licence | What ran and what it found |
|---|---|---|---|
| NY State DMV, Vehicle, Snowmobile, and Boat Registrations, <https://data.ny.gov/Transportation/Vehicle-Snowmobile-and-Boat-Registrations/w4pv-hbkt> (only `vin`, `model_year`, `make`; 49,980 passenger registrations, model year 1981+) | 19 Nov 2026 | NY State open data, data.ny.gov terms of use (no separate licence in the metadata) | **Check digit:** 49,972 of 49,980 pass; an independent implementation agrees on every VIN (0 disagreements). **Model year** from the VIN matched the DMV's for 49,903 (99.85%); 9 were 30 years off (1980s vehicles read as 2010s). Fixed with the 7th-character rule: now 49,911 (99.86%) and no 30-year errors; the rest are 1-2 years apart, which NHTSA's decoder shows are the DMV's recorded year, not a decoding error. **Tails:** no two of the 49,980 VINs share their last 8 characters; 1,878 share their last 6 (about a 3% chance for a 300-unit store, 32% for 1,000 units). The core never matches an ambiguous tail. **Agents:** floorplan audit of 400 real VINs against a statement printing only the last 8: 0 findings (0 false); contracts in transit, 300 real VINs against a statement printing only the last 6 and no deal numbers: 0 findings, 0 unmatched lines. (Only the VINs are real in these two runs; deals, balances and dates are fictional.) |
| NHTSA vPIC VIN decoder, <https://vpic.nhtsa.dot.gov/api/> | 19 Nov 2026 | US government work (public domain) | 500 of the same VINs: check digit and model year agree with Fairdrive on **500 of 500**. Decoding the fixture VINs showed they used a real manufacturer's code (fixed, see point 6); the new ones decode to no registered manufacturer. |

**Nothing public fits** the other agents: no DMS, shop-system, estimating, lender, floorplan, manufacturer or provider
export is published, and the deal, RO, tax, fee, warranty, incentive and parts agents need those files. OFAC data is
public, but the OFAC agent only checks that a record of the check exists; it never matches names, so the SDN list does
not apply.

### Decide (Kurt)

1. **Format labels on the site:** all 14 vendor layouts are "written from knowledge of the export, not yet checked
   against documentation or a real export". That is not one of the three labels the site plan expects; it is the
   honest one. Keep it, or say "not yet tested on a real export".
2. **First real exports:** one de-identified export per DMS (CDK, Reynolds, Tekion, Dealertrack) and per shop system
   (Tekmetric, Shopmonkey, CCC, Mitchell), with a store's written permission, would turn "written from knowledge" into
   "tested" and give real accuracy numbers.
3. **Rules review:** the 67 defaults should be read once by a dealership controller (and the deal-jacket checklist by
   someone who knows F&I law) before a store relies on them.
4. **Staff names are now masked** in what the model sees. If a sales or service manager wants names in the assistant's
   answers, there is no staff-only switch yet (`--pii off` removes all masking, customers included). Default stays masked.
