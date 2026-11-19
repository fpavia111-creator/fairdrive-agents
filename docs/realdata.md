# Fairdrive on public real data

Written by `node scripts/realdata.mjs` on 2026-11-19 from files downloaded 2026-11-19 into `_realdata/` (git-ignored; `--download` fetches them again). Public data only.

## Sources

- **NY State DMV, Vehicle, Snowmobile, and Boat Registrations**: <https://data.ny.gov/Transportation/Vehicle-Snowmobile-and-Boat-Registrations/w4pv-hbkt>. Licence: NY State open data, data.ny.gov terms of use (the dataset metadata names no separate licence). Downloaded: `vin`, `model_year`, `make` only, 50000 passenger registrations (record type VEH, class PAS, model year 1981 or later).
- **NHTSA vPIC VIN decoder**: <https://vpic.nhtsa.dot.gov/api/>. Licence: US government work (public domain). 500 of the same VINs decoded, plus 3 fixture VINs.

## Results

- **Check digit** (`vinCheck`, used to flag mistyped VINs): 49980 distinct 17-character VINs; 49972 pass (99.98%). An independent implementation in the script gives 49972: **0 disagreements**. Against NHTSA's own decoder on 500 of them: 500 agree.
- **Model year from the VIN** (`vinYear`): same as the DMV's model year for 49911 of 49980 (99.86%); differences by years (VIN year minus DMV year): -1: 42, -2: 23, 1: 3, 3: 1. NHTSA's decoded year matches `vinYear` for 500 of 500. No agent uses `vinYear` for a finding today.
- **Last 6 characters shared by different vehicles:** 1878 of 49980 VINs share their last 6 with another (960 pairs). For a store with 300 units the chance that any two share a last-6 tail is about 3.39%; with 1,000 units about 31.88%. The core never matches an ambiguous tail: a tail that fits two units matches neither, and the line is reported for a person to check.
- **Last 8 characters shared by different vehicles:** 0 of 49980 VINs share their last 8 with another (0 pairs). For a store with 300 units the chance that any two share a last-8 tail is about 0.00%; with 1,000 units about 0.00%. The core never matches an ambiguous tail: a tail that fits two units matches neither, and the line is reported for a person to check.
- **fairdrive-floorplan-audit on 400 real VINs**, statement printing only the last 8 characters (balances equal): 0 finding(s). Expected 0.
- **fairdrive-contracts-in-transit on 300 real VINs**, lender statement printing only the last 6 characters and no deal number: 0 finding(s), 0 statement line(s) unmatched. Expected 0.
- **Fixture VINs named a real manufacturer (fixed in this pass):** the fixture VINs began with 7ZZ, which NHTSA decodes as Beall Manufacturing, Inc. They now begin with 0ZZ (scripts/fictional-vins.mjs). No manufacturer identifier starts with 0, the last 14 characters are kept, and the check digit is recomputed.
- **Fixture VINs are not real vehicles:** NHTSA decodes 3 fixture VINs (`0ZZ...`) with 3 reporting no registered manufacturer.

## What this does not show

- No dealer, DMS, shop-system, estimating, lender or manufacturer export was read: none is published. The deals, contracts, balances and dates in the two agent runs are fictional; only the VINs are real.
- Sales tax, DMV fees, warranty, incentives, parts and the other agents have no public file in their real format to test on.
