# Fairdrive accuracy on fictional test data

Written by `npm run accuracy` (scripts/accuracy.mjs) on 2026-11-19. Fictional fixtures only; no real dealer data.

**Family:** 31 of 31 agents measured. Planted problems found: **185 of 185**; findings on the planted set that were not planted: **0**. Clean set: **205 rows, 0 findings** (false positives). One-fact mutations caught: **63 of 63**.

Planted: every problem written into the fixtures on purpose, listed in each agent's `fixtures/accuracy.json`. Clean: the same files with those rows dropped or the one wrong cell repaired; it must give no finding. Mutation: one fact changed in the clean set; exactly the named finding must appear.

| Agent | Planted found | Not planted | Clean rows | Clean findings | Mutations caught |
| --- | --- | --- | --- | --- | --- |
| fairdrive-comebacks | 3 / 3 | 0 | 9 | 0 | 2 / 2 |
| fairdrive-contracts-in-transit | 7 / 7 | 0 | 6 | 0 | 3 / 3 |
| fairdrive-curtailments | 5 / 5 | 0 | 2 | 0 | 2 / 2 |
| fairdrive-customer-deposits | 5 / 5 | 0 | 9 | 0 | 2 / 2 |
| fairdrive-deal-jackets | 21 / 21 | 0 | 43 | 0 | 2 / 2 |
| fairdrive-dmv-fees | 4 / 4 | 0 | 6 | 0 | 2 / 2 |
| fairdrive-estimate-vs-invoice | 4 / 4 | 0 | 5 | 0 | 2 / 2 |
| fairdrive-finance-reserve | 6 / 6 | 0 | 7 | 0 | 2 / 2 |
| fairdrive-flat-rate-hours | 4 / 4 | 0 | 20 | 0 | 3 / 3 |
| fairdrive-floorplan-audit | 5 / 5 | 0 | 5 | 0 | 2 / 2 |
| fairdrive-gl-schedules | 7 / 7 | 0 | 8 | 0 | 2 / 2 |
| fairdrive-incentive-claims | 7 / 7 | 0 | 4 | 0 | 2 / 2 |
| fairdrive-insurance-supplements | 4 / 4 | 0 | 2 | 0 | 2 / 2 |
| fairdrive-loaner-fleet | 5 / 5 | 0 | 3 | 0 | 2 / 2 |
| fairdrive-ofac-red-flags | 5 / 5 | 0 | 6 | 0 | 2 / 2 |
| fairdrive-open-repair-orders | 6 / 6 | 0 | 2 | 0 | 2 / 2 |
| fairdrive-parts-obsolescence | 4 / 4 | 0 | 4 | 0 | 1 / 1 |
| fairdrive-parts-receiving | 5 / 5 | 0 | 4 | 0 | 2 / 2 |
| fairdrive-policy-adjustments | 6 / 6 | 0 | 5 | 0 | 2 / 2 |
| fairdrive-product-cancellations | 7 / 7 | 0 | 4 | 0 | 2 / 2 |
| fairdrive-reconditioning | 7 / 7 | 0 | 3 | 0 | 2 / 2 |
| fairdrive-repair-order-margins | 5 / 5 | 0 | 3 | 0 | 2 / 2 |
| fairdrive-sales-commissions | 4 / 4 | 0 | 7 | 0 | 2 / 2 |
| fairdrive-sales-tax | 4 / 4 | 0 | 8 | 0 | 2 / 2 |
| fairdrive-service-contract-remittances | 6 / 6 | 0 | 7 | 0 | 2 / 2 |
| fairdrive-sublet-invoices | 6 / 6 | 0 | 7 | 0 | 2 / 2 |
| fairdrive-title-tracking | 7 / 7 | 0 | 3 | 0 | 2 / 2 |
| fairdrive-trade-payoffs | 6 / 6 | 0 | 2 | 0 | 2 / 2 |
| fairdrive-used-vehicle-aging | 8 / 8 | 0 | 4 | 0 | 2 / 2 |
| fairdrive-warranty-claims | 7 / 7 | 0 | 4 | 0 | 2 / 2 |
| fairdrive-we-owes | 5 / 5 | 0 | 3 | 0 | 2 / 2 |

No problems: every planted finding found, nothing else on the planted set, nothing on the clean set, every mutation caught.
