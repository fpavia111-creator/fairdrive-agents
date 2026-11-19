# What reaches the AI model (Fairdrive)

Written by `npm run model-view` from each agent's own source fields and the core masker in its default mode (`--pii mask`). Every tool result passes through the masker before it leaves the agent.

- **Masked:** customer names, co-buyers, owners and insureds (`CU-` pseudonyms); staff names: salespeople, technicians, advisors, F&I managers and approvers (`ST-` pseudonyms); phones, e-mails, addresses and SSN-like numbers (placeholders); account, customer and licence numbers. A masked value is also replaced wherever it appears inside other text.
- **Sent as they are:** deal, stock, RO, claim, PO and contract numbers; VINs (pseudonymised with `--pii strict`); dates; amounts; business names (lenders, providers, vendors, insurers, agencies).
- **Free text** (descriptions, reasons, stips, concerns) is sent as written, with known names and phone, e-mail and SSN patterns replaced. Anything else a person typed there reaches the model.
- Results go to whatever model the user's AI assistant uses. For data that may not be shared with that provider, use a local model or one covered by the user's agreements. No claim of compliance with any law or standard is made.

Masking canaries: 102 fictional customer names across the agents, each proven by a contract test never to reach a result; 10 agents read no customer column and say so.

| Agent | Masked | Ids, codes, VINs and business names sent | Dates, amounts | Free text sent | Canaries |
| --- | --- | --- | --- | --- | --- |
| comebacks | customer (customer name), technician (staff name) | ro_number, op_code, labor_type, vin | 2 dates, 1 amounts | concern | 7 |
| contracts-in-transit | customer (customer name) | deal_number, lender, status, vin | 2 dates, 3 amounts | stips | 5 |
| curtailments | none read | stock_number, new_used, vin | 1 dates, 2 amounts | none | no customer column |
| customer-deposits | customer (customer name) | receipt_number, deal_number, status | 3 dates, 1 amounts | none | 4 |
| deal-jackets | customer (customer name), fi_manager (staff name) | deal_number, deal_type, sale_type, stock_number, status, signed, trade_vin | 3 dates, 0 amounts | document | 7 |
| dmv-fees | customer (customer name) | deal_number, state, agency, vin | 2 dates, 2 amounts | none | 4 |
| estimate-vs-invoice | customer (customer name) | ro_number, claim_number, insurer, version | 2 dates, 5 amounts | none | 4 |
| finance-reserve | customer (customer name) | deal_number, lender, kind | 2 dates, 7 amounts | none | 5 |
| flat-rate-hours | technician (staff name) | ro_number, labor_type | 1 dates, 3 amounts | none | 3 |
| floorplan-audit | none read | stock_number, status, new_used, vin | 2 dates, 2 amounts | none | no customer column |
| gl-schedules | none read | schedule, control_number, schedule_name | 1 dates, 2 amounts | description | no customer column |
| incentive-claims | none read | deal_number, program, claim_number, status, vin | 3 dates, 2 amounts | reason | no customer column |
| insurance-supplements | customer (customer name) | ro_number, claim_number, insurer, supplement_number, status | 2 dates, 2 amounts | none | 4 |
| loaner-fleet | customer (customer name) | stock_number, use, status, ro_number, vin | 3 dates, 2 amounts | none | 3 |
| ofac-red-flags | customer (customer name), co_buyer (customer name), performed_by (staff name) | deal_number, deal_type, credit_pulled, status, check_type, person, result_recorded | 2 dates, 0 amounts | none | 6 |
| open-repair-orders | advisor (staff name), customer (customer name) | ro_number, labor_type, status, parts_on_order | 2 dates, 1 amounts | none | 6 |
| parts-obsolescence | none read | part_number, returnable, source | 2 dates, 2 amounts | description | no customer column |
| parts-receiving | none read | po_number, part_number, invoice_number, vendor | 2 dates, 4 amounts | none | no customer column |
| policy-adjustments | advisor (staff name), customer (customer name), approved_by (staff name) | ro_number, vin | 1 dates, 1 amounts | reason | 7 |
| product-cancellations | customer (customer name) | deal_number, product, provider, contract_number | 3 dates, 5 amounts | reason | 4 |
| reconditioning | none read | stock_number, status, ro_number, vin | 4 dates, 2 amounts | none | no customer column |
| repair-order-margins | advisor (staff name), customer (customer name) | ro_number, labor_type | 1 dates, 4 amounts | none | 6 |
| sales-commissions | salesperson (staff name), split_with (staff name), customer (customer name) | deal_number, sale_type | 1 dates, 6 amounts | none | 7 |
| sales-tax | customer (customer name) | deal_number, state, county, trade_credit, doc_fee_taxable | 1 dates, 6 amounts | none | 4 |
| service-contract-remittances | customer (customer name) | deal_number, contract_number, provider | 2 dates, 2 amounts | none | 4 |
| sublet-invoices | none read | ro_number, po_number, vendor, invoice_number | 2 dates, 3 amounts | description | no customer column |
| title-tracking | customer (customer name) | deal_number, state, vin, trade_vin | 5 dates, 0 amounts | none | 4 |
| trade-payoffs | customer (customer name) | deal_number, lienholder, trade_vin | 5 dates, 3 amounts | none | 4 |
| used-vehicle-aging | none read | stock_number, status, vin | 2 dates, 5 amounts | description | no customer column |
| warranty-claims | none read | claim_number, ro_number, status, vin | 2 dates, 4 amounts | reason | no customer column |
| we-owes | customer (customer name) | deal_number, ro_number | 3 dates, 2 amounts | item | 4 |
