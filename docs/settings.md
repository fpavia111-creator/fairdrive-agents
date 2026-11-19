# Rules and settings (Fairdrive)

Written by `npm run settings` from the agents themselves. Every day count, rate, percentage and limit below is a **working example**, not a law, a standard, or the terms of any lender, manufacturer, provider or state. They were written for version 0.1.0 (18 Nov 2026) from general knowledge of dealership practice and have not been reviewed by a dealer, controller or lawyer yet.

- **Where they live:** the default is in each agent's `src/check.js`; each one is a named argument of the agent's check tool. Tax rates, pay plans and the deal-jacket checklist additions come from the store's own files and arguments; there is no built-in tax table or pay plan.
- **How a store changes one:** pass the argument when the assistant calls the tool (or ask the assistant to always use it). Every result lists the settings it used. Defaults change only in a new release, with a CHANGELOG line.
- **Who maintains them:** Mythos Machines (Kurt Francisco Pavia) in releases; the support plan includes settings updates when a store's lender, manufacturer or state rules change.

67 settings in 31 agents.

| Agent | Setting | Default | What it is |
| --- | --- | --- | --- |
| comebacks | `days` | 30 | A return within this many days of the first visit can be a comeback |
| comebacks | `miles` | 1000; ignored when an odometer is missing | A return within this many miles of the first visit can be a comeback |
| contracts-in-transit | `alert_days` | 10 | Contracts in transit longer than this many days are flagged |
| contracts-in-transit | `tolerance` | 1.00 | A funded amount this close to the expected funding is not a difference |
| curtailments | `schedule` | 10% at 91, 181 and 271 days, payoff at 361 | Curtailment schedule for new units from your floorplan agreement |
| curtailments | `used_schedule` | 10% at 61 and 121 days, payoff at 181 | Curtailment schedule for used units |
| curtailments | `weeks` | 4 | How many weeks ahead to list curtailments coming due |
| customer-deposits | `held_days` | 14 | A deposit with no deal held longer than this is listed |
| customer-deposits | `refund_days` | 10 | A deposit on a dead deal held longer than this is a refund overdue |
| deal-jackets | `extra_documents` | none | Document codes your store also requires on every deal (for example drivers_license is already required; add buyers_guide to require it on new cars too) |
| deal-jackets | `not_required` | none | Document codes your store does not keep in the jacket (dropped from every checklist) |
| dmv-fees | `tolerance` | 1.00 | Differences this small are ignored |
| dmv-fees | `paid_days` | 30 | A deal with fees collected and no charge after this many days is flagged |
| estimate-vs-invoice | `tolerance` | 10 | Differences this small are ignored |
| estimate-vs-invoice | `invoice_days` | 30 | An estimate older than this with no invoice is listed |
| finance-reserve | `share_pct` | 75 | Share of the rate markup the lender pays the dealer, in percent |
| finance-reserve | `cap` | none | Largest reserve a lender pays on one deal, if your agreements cap it |
| finance-reserve | `tolerance` | 5.00 | Differences this small are ignored |
| finance-reserve | `grace_days` | 30 | A deal younger than this is not yet expected to have paid |
| flat-rate-hours | `floor_pct` | 85 | Proficiency (flagged over clocked) below this percent is flagged |
| flat-rate-hours | `ratio` | 3 | A job flagged at this many times the time punched or more is flagged |
| floorplan-audit | `payoff_days` | 5 | Days after a sale within which your floorplan agreement wants the unit paid off |
| floorplan-audit | `tolerance` | 1.00 | Balance differences this small are ignored |
| gl-schedules | `tolerance` | 1.00 | Differences this small are ignored |
| incentive-claims | `deadline_days` | 30; set from the program bulletin | Days after the sale within which a claim must be submitted |
| incentive-claims | `unpaid_days` | 45 | A submitted claim not on the statement after this many days is flagged |
| insurance-supplements | `follow_up_days` | 5 | A supplement with no answer after this many days is listed for follow-up |
| loaner-fleet | `max_days` | 180 | Days in service allowed by your loaner or demo program |
| loaner-fleet | `max_miles` | 6000 | Miles in service allowed by your program |
| loaner-fleet | `open_days` | 14 | A loan agreement open longer than this is listed |
| open-repair-orders | `long_days` | 30 | A customer-pay order open longer than this is flagged |
| open-repair-orders | `warranty_days` | 30 | A warranty order open longer than this is flagged |
| open-repair-orders | `internal_days` | 14 | An internal order open longer than this is flagged |
| parts-obsolescence | `month_edges` | 6, 9, 12 | Month limits for slow, obsolete candidate and obsolete |
| parts-receiving | `price_pct` | 1 | A billed price more than this percent above the order cost is flagged |
| parts-receiving | `not_billed_days` | 30 | Parts received this many days ago and still not billed are listed |
| policy-adjustments | `approval_limit` | 250 | Adjustments above this amount are listed for a manager review |
| policy-adjustments | `repeat_days` | 90 | A second adjustment on the same vehicle within this many days is listed |
| product-cancellations | `full_chargeback_days` | 90; check your provider agreement | Cancelled within this many days of the sale, the whole profit is charged back |
| product-cancellations | `tolerance` | 5.00 | A chargeback this close to the expected figure is not a difference |
| product-cancellations | `refund_days` | 30 | A cancellation older than this with no refund date is flagged |
| reconditioning | `target_days` | 7 | Target days from acquisition to front-line ready |
| reconditioning | `default_budget` | 1500 | Recon budget for a unit with none in the file |
| reconditioning | `no_ro_days` | 3 | A unit with no recon repair order after this many days is flagged |
| repair-order-margins | `labor_floor` | 65 | Customer-pay labor gross profit percent below which a repair order is flagged |
| repair-order-margins | `parts_floor` | 30 | Customer-pay parts gross profit percent below which a repair order is flagged |
| sales-commissions | `tolerance` | 1.00 | Differences this small are ignored |
| sales-commissions | `plans` (file) | the store's own file | Pay plans (settings you keep): salesperson, front percent, back percent, mini (minimum per deal) |
| sales-tax | `tolerance` | 1.00 | Differences this small are ignored |
| sales-tax | `rates` (file) | the store's own file | Your rate table (settings you keep): state, county, rate percent, trade credit yes/no, doc fee taxable yes/no, maximum tax if capped |
| service-contract-remittances | `remit_days` | 30; set from each provider agreement | Days after the sale within which a contract must be remitted |
| sublet-invoices | `tolerance` | 1.00 | Differences this small are ignored |
| sublet-invoices | `closed_days` | 7 | A closed RO still without a sublet invoice after this many days is flagged |
| title-tracking | `submit_days` | 30; set your state rule | Days after delivery within which the title application must be sent |
| title-tracking | `trade_title_days` | 15 | Days after delivery by which the trade-in title should be in hand |
| title-tracking | `tag_warning_days` | 7 | Warn this many days before a temporary tag expires |
| title-tracking | `registration_days` | 45 | Days after the application after which a missing registration is flagged |
| trade-payoffs | `payoff_days` | 7 | Days after the deal within which the payoff should be sent |
| trade-payoffs | `clear_days` | 10 | A payoff sent this many days ago and not cleared is flagged |
| trade-payoffs | `release_days` | 30 | A cleared payoff with no lien release after this many days is flagged |
| used-vehicle-aging | `wholesale_days` | 60 | Days in stock after which a unit is a wholesale candidate |
| used-vehicle-aging | `above_market_pct` | 103 | List price above this percent of market is flagged |
| used-vehicle-aging | `below_market_pct` | 90 | List price below this percent of market is flagged |
| used-vehicle-aging | `stale_days` | 14 | A unit over 30 days old whose price has not changed for this many days is flagged |
| warranty-claims | `resubmit_days` | 30; set from the warranty policy manual | Days after a rejection within which a claim can be resubmitted |
| we-owes | `open_days` | 30 | An open we-owe with no promise date older than this is flagged |
| we-owes | `schedule_days` | 7 | An open we-owe with no repair order this many days after delivery is flagged |
