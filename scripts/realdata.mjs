#!/usr/bin/env node
// Real-data checks on public files (final pass, 19 Nov 2026). Public, lawful data only; never a
// dealer's or anyone's private data. Downloads go to _realdata/ (git-ignored, never committed);
// the results go to docs/realdata.md and docs/realdata.json.
//
//   node scripts/realdata.mjs --download   fetch the public files (network; about 3 MB, 11 small NHTSA calls)
//   node scripts/realdata.mjs              run the checks on the files already in _realdata/ (no network)
//
// What runs:
//   1. NY State DMV "Vehicle, Snowmobile, and Boat Registrations" (data.ny.gov, w4pv-hbkt): a sample of
//      real passenger-vehicle VINs with the model year the DMV recorded (only vin, model_year and make
//      are downloaded; no city, ZIP or other columns). On them:
//      - fairdrive-core vinCheck (check digit) against an independent re-implementation in this script;
//      - fairdrive-core vinYear against the DMV model year;
//      - how often a VIN tail (last 6 or 8 characters, which lenders and manufacturers print) is shared
//        by two different real vehicles, and what that means for an inventory of a store's size;
//      - fairdrive-floorplan-audit run on 400 of these VINs as a DMS inventory against a lender statement
//        that prints only the last 8 characters, and fairdrive-contracts-in-transit on 300 contracts
//        against a statement with only the last 6 (the files are built from the real VINs; deals,
//        amounts and dates are fictional).
//   2. NHTSA vPIC VIN decoder (public US government API): 500 of the same VINs decoded in batches, as an
//      independent oracle for the check digit and the model year; and the fixture VINs, to show they
//      are not real vehicles.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); const PK = join(ROOT, 'packages'); const RD = join(ROOT, '_realdata');
const core = await import(pathToFileURL(join(PK, 'fairdrive-core', 'src', 'index.js')).href);
const { parseCsv, toCsv, AgentRuntime, normVin, vinCheck, vinYear } = core;
const TODAY = new Date().toISOString().slice(0, 10);

const NY = {
  name: 'NY State DMV, Vehicle, Snowmobile, and Boat Registrations',
  page: 'https://data.ny.gov/Transportation/Vehicle-Snowmobile-and-Boat-Registrations/w4pv-hbkt',
  url: 'https://data.ny.gov/resource/w4pv-hbkt.csv?' + new URLSearchParams({ $select: 'vin,model_year,make', $where: "record_type='VEH' AND registration_class='PAS' AND model_year >= '1981'", $limit: '50000' }).toString(),
  licence: 'NY State open data, data.ny.gov terms of use (the dataset metadata names no separate licence)',
  file: 'ny-dmv-registrations-sample.csv',
};
const VPIC = { name: 'NHTSA vPIC VIN decoder', page: 'https://vpic.nhtsa.dot.gov/api/', licence: 'US government work (public domain)', file: 'nhtsa-vpic-decodes.json', fixtures: 'nhtsa-vpic-fixture-vins.json' };

async function download() {
  mkdirSync(RD, { recursive: true });
  const r = await fetch(NY.url); if (!r.ok) throw new Error(`NY DMV: HTTP ${r.status}`);
  writeFileSync(join(RD, NY.file), await r.text());
  writeFileSync(join(RD, 'sources.json'), JSON.stringify({ downloaded: new Date().toISOString(), ny: { url: NY.url, page: NY.page, licence: NY.licence }, vpic: { page: VPIC.page, licence: VPIC.licence } }, null, 2));
  const rows = parseCsv(readFileSync(join(RD, NY.file), 'utf8')).filter((x) => normVin(x.vin).length === 17);
  // 500 VINs, every 50th distinct one, decoded 50 at a time (DecodeVINValuesBatch).
  const pick = [...new Map(rows.map((x) => [normVin(x.vin), x])).values()].filter((_, i) => i % 50 === 0).slice(0, 500);
  const out = [];
  for (let i = 0; i < pick.length; i += 50) {
    const body = new URLSearchParams({ format: 'json', DATA: pick.slice(i, i + 50).map((x) => normVin(x.vin)).join(';') });
    const d = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/', { method: 'POST', body });
    if (!d.ok) throw new Error(`vPIC: HTTP ${d.status}`);
    for (const x of (await d.json()).Results) out.push({ vin: x.VIN, model_year: x.ModelYear, make: x.Make, error_code: x.ErrorCode, error_text: x.ErrorText });
  }
  writeFileSync(join(RD, VPIC.file), JSON.stringify(out, null, 1));
  const fx = ['0ZZ8A87X9RA659009', '0ZZ0TCCU5PA503360', '0ZZ5R6E04LA192725'];
  const fr = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/', { method: 'POST', body: new URLSearchParams({ format: 'json', DATA: fx.join(';') }) });
  writeFileSync(join(RD, VPIC.fixtures), JSON.stringify((await fr.json()).Results.map((x) => ({ vin: x.VIN, make: x.Make, manufacturer: x.Manufacturer, error_code: x.ErrorCode, error_text: x.ErrorText })), null, 1));
  console.log(`downloaded ${rows.length} NY VINs, ${out.length} vPIC decodes, ${fx.length} fixture VIN decodes into _realdata/`);
}

// Independent check-digit implementation (ISO 3779 / 49 CFR 565 weights), not shared with the core.
const TR = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const WT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function checkDigitOk(v) { if (v.length !== 17 || /[IOQ]/.test(v)) return false; let s = 0; for (let i = 0; i < 17; i++) { const c = v[i]; const n = c >= '0' && c <= '9' ? +c : TR[c]; if (n === undefined) return false; s += n * WT[i]; } const r = s % 11; return v[8] === (r === 10 ? 'X' : String(r)); }

async function runAgent(name, tool, files, args) {
  const parent = mkdtempSync(join(tmpdir(), 'realdata-')); const root = join(parent, 'root'); mkdirSync(root, { recursive: true });
  try {
    for (const [f, rows] of Object.entries(files)) writeFileSync(join(root, f), toCsv(rows, Object.keys(rows[0]), { raw: true }));
    const { manifest } = await import(pathToFileURL(join(PK, name, 'src', 'index.js')).href);
    const r = await new AgentRuntime(manifest, { root, stateDir: null, audit: false, pii: 'off' }).call(tool, args);
    if (r.status !== 'executed') throw new Error(`${name}: ${r.status} ${r.reason || ''}`);
    return r.result;
  } finally { rmSync(parent, { recursive: true, force: true }); }
}

async function analyse() {
  if (!existsSync(join(RD, NY.file))) { console.log('No real data yet: run  node scripts/realdata.mjs --download  first.'); process.exitCode = 1; return; }
  const src = existsSync(join(RD, 'sources.json')) ? JSON.parse(readFileSync(join(RD, 'sources.json'), 'utf8')) : {};
  const raw = parseCsv(readFileSync(join(RD, NY.file), 'utf8'));
  const all = raw.map((x) => ({ vin: normVin(x.vin), year: Number(x.model_year), make: String(x.make || '') }));
  const v17 = all.filter((x) => x.vin.length === 17);
  const uniq = [...new Map(v17.map((x) => [x.vin, x])).values()];
  // 1. Check digit: core vs independent; disagreements are bugs.
  let coreOk = 0, indOk = 0, disagree = 0;
  for (const x of uniq) { const a = vinCheck(x.vin) === true, b = checkDigitOk(x.vin); coreOk += a; indOk += b; disagree += a !== b; }
  // Model year from the 10th character vs the DMV's model year.
  let yrSame = 0, yrKnown = 0; const yrOff = {};
  for (const x of uniq) { if (!x.year) continue; const y = vinYear(x.vin, 2026); if (y === null) continue; yrKnown++; if (y === x.year) yrSame++; else { const d = y - x.year; yrOff[d] = (yrOff[d] || 0) + 1; } }
  // 2. Tails shared by different vehicles.
  const tailStats = (n) => { const g = new Map(); for (const x of uniq) { const t = x.vin.slice(-n); g.set(t, (g.get(t) || 0) + 1); } let shared = 0, pairs = 0; for (const k of g.values()) if (k > 1) { shared += k; pairs += (k * (k - 1)) / 2; } const N = uniq.length; const p = pairs / ((N * (N - 1)) / 2); const store = (m) => 1 - Math.pow(1 - p, (m * (m - 1)) / 2); return { tail: n, vins_sharing_a_tail: shared, pairs, pair_probability: p, store_300_chance_of_any_shared_tail: store(300), store_1000: store(1000) }; };
  const tails = [tailStats(6), tailStats(8)];
  // 3. Agents on real VINs: floorplan (statement prints last 8) and contracts in transit (statement prints last 6).
  const sample = uniq.filter((_, i) => i % 97 === 0).slice(0, 400);
  const inv = sample.map((x, i) => ({ stock_number: `S${100000 + i}`, vin: x.vin, status: 'In stock', sold_date: '', new_used: x.year >= 2025 ? 'New' : 'Used', floorplan_balance: (20000 + (i % 37) * 500).toFixed(2) }));
  const stmt = sample.map((x, i) => ({ vin: x.vin.slice(-8), floor_date: '2026-10-01', balance: (20000 + (i % 37) * 500).toFixed(2) }));
  const fp = await runAgent('fairdrive-floorplan-audit', 'floorplan_audit', { 'inventory.csv': inv, 'statement.csv': stmt }, { inventory: 'inventory.csv', statement: 'statement.csv', as_of: '2026-11-15' });
  const cSample = uniq.filter((_, i) => i % 131 === 3).slice(0, 300);
  const contracts = cSample.map((x, i) => ({ deal_number: `D${500000 + i}`, customer: 'Fictional Buyer', vin: x.vin, lender: 'Fictional Bank', contract_date: '2026-10-20', amount_financed: (15000 + (i % 41) * 300).toFixed(2), expected_funding: '', funded_date: '2026-10-27', funded_amount: (15000 + (i % 41) * 300).toFixed(2), status: 'Funded', stips: '' }));
  const lstmt = cSample.map((x, i) => ({ lender: 'Fictional Bank', deal_number: '', vin: x.vin.slice(-6), customer: '', funded_date: '2026-10-27', funded_amount: (15000 + (i % 41) * 300).toFixed(2) }));
  const cit = await runAgent('fairdrive-contracts-in-transit', 'funding_age_contracts', { 'contracts.csv': contracts, 'statement.csv': lstmt }, { contracts: 'contracts.csv', lender_statement: 'statement.csv', as_of: '2026-11-15' });
  // 4. NHTSA vPIC as an independent oracle on 500 of the VINs.
  let vp = null;
  if (existsSync(join(RD, VPIC.file))) {
    const d = JSON.parse(readFileSync(join(RD, VPIC.file), 'utf8'));
    const nhtsaBadCheck = (x) => String(x.error_code).split(',').map((c) => c.trim()).includes('1'); // NHTSA error 1: check digit wrong
    let agreeCheck = 0, yearSame = 0, yearKnown = 0; const differ = [];
    for (const x of d) { const ours = vinCheck(x.vin) === true; const theirs = !nhtsaBadCheck(x); if (ours === theirs) agreeCheck++; else differ.push({ vin: x.vin, ours, nhtsa_error: x.error_code }); const ny = Number(x.model_year); if (ny) { yearKnown++; if (vinYear(x.vin, 2026) === ny) yearSame++; } }
    vp = { decoded: d.length, check_digit_agree: agreeCheck, check_digit_differ: differ.slice(0, 10), model_year_known: yearKnown, model_year_same: yearSame };
  }
  let fixtures = null;
  if (existsSync(join(RD, VPIC.fixtures))) fixtures = JSON.parse(readFileSync(join(RD, VPIC.fixtures), 'utf8'));
  const res = {
    run: TODAY, downloaded: src.downloaded || null,
    ny: { rows: raw.length, vins_17: v17.length, distinct: uniq.length, check_digit_valid_core: coreOk, check_digit_valid_independent: indOk, check_digit_disagreements: disagree, model_year_compared: yrKnown, model_year_same: yrSame, model_year_differences: yrOff, tails },
    floorplan: { units: inv.length, statement_lines_last8: stmt.length, findings: fp.items.length, by_finding: count(fp.items.map((i) => i.finding)) },
    contracts_in_transit: { contracts: contracts.length, statement_lines_last6: lstmt.length, findings: cit.items.length, by_finding: count(cit.items.map((i) => i.finding)), statement_lines_not_matched: cit.statement_lines_not_matched.length },
    vpic: vp, fixture_vins: fixtures,
  };
  mkdirSync(join(ROOT, 'docs'), { recursive: true });
  writeFileSync(join(ROOT, 'docs', 'realdata.json'), JSON.stringify(res, null, 2) + '\n');
  const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(2)}%` : 'n/a');
  const md = [
    '# Fairdrive on public real data', '',
    `Written by \`node scripts/realdata.mjs\` on ${TODAY} from files downloaded ${src.downloaded ? src.downloaded.slice(0, 10) : '(date not recorded)'} into \`_realdata/\` (git-ignored; \`--download\` fetches them again). Public data only.`, '',
    '## Sources', '',
    `- **${NY.name}**: <${NY.page}>. Licence: ${NY.licence}. Downloaded: \`vin\`, \`model_year\`, \`make\` only, ${res.ny.rows} passenger registrations (record type VEH, class PAS, model year 1981 or later).`,
    `- **${VPIC.name}**: <${VPIC.page}>. Licence: ${VPIC.licence}. ${vp ? vp.decoded : 0} of the same VINs decoded, plus ${fixtures ? fixtures.length : 0} fixture VINs.`, '',
    '## Results', '',
    `- **Check digit** (\`vinCheck\`, used to flag mistyped VINs): ${res.ny.distinct} distinct 17-character VINs; ${res.ny.check_digit_valid_core} pass (${pct(res.ny.check_digit_valid_core, res.ny.distinct)}). An independent implementation in the script gives ${res.ny.check_digit_valid_independent}: **${res.ny.check_digit_disagreements} disagreements**.${vp ? ` Against NHTSA's own decoder on ${vp.decoded} of them: ${vp.check_digit_agree} agree.` : ''}`,
    `- **Model year from the VIN** (\`vinYear\`): same as the DMV's model year for ${res.ny.model_year_same} of ${res.ny.model_year_compared} (${pct(res.ny.model_year_same, res.ny.model_year_compared)}); differences by years (VIN year minus DMV year): ${Object.entries(res.ny.model_year_differences).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, k]) => `${d}: ${k}`).join(', ') || 'none'}.${vp ? ` NHTSA's decoded year matches \`vinYear\` for ${vp.model_year_same} of ${vp.model_year_known}.` : ''} No agent uses \`vinYear\` for a finding today.`,
    ...tails.map((t) => `- **Last ${t.tail} characters shared by different vehicles:** ${t.vins_sharing_a_tail} of ${res.ny.distinct} VINs share their last ${t.tail} with another (${t.pairs} pairs). For a store with 300 units the chance that any two share a last-${t.tail} tail is about ${pct(t.store_300_chance_of_any_shared_tail, 1)}; with 1,000 units about ${pct(t.store_1000, 1)}. The core never matches an ambiguous tail: a tail that fits two units matches neither, and the line is reported for a person to check.`),
    `- **fairdrive-floorplan-audit on ${res.floorplan.units} real VINs**, statement printing only the last 8 characters (balances equal): ${res.floorplan.findings} finding(s)${res.floorplan.findings ? ` (${Object.entries(res.floorplan.by_finding).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}. Expected 0.`,
    `- **fairdrive-contracts-in-transit on ${res.contracts_in_transit.contracts} real VINs**, lender statement printing only the last 6 characters and no deal number: ${res.contracts_in_transit.findings} finding(s)${res.contracts_in_transit.findings ? ` (${Object.entries(res.contracts_in_transit.by_finding).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}, ${res.contracts_in_transit.statement_lines_not_matched} statement line(s) unmatched. Expected 0.`,
    '- **Fixture VINs named a real manufacturer (fixed in this pass):** the fixture VINs began with 7ZZ, which NHTSA decodes as Beall Manufacturing, Inc. They now begin with 0ZZ (scripts/fictional-vins.mjs). No manufacturer identifier starts with 0, the last 14 characters are kept, and the check digit is recomputed.',
    fixtures ? `- **Fixture VINs are not real vehicles:** NHTSA decodes ${fixtures.length} fixture VINs (\`0ZZ...\`) with ${fixtures.filter((f) => /manufacturer is not registered|WMI/i.test(String(f.error_text)) || !f.make).length} reporting no registered manufacturer.` : '',
    '', '## What this does not show', '',
    '- No dealer, DMS, shop-system, estimating, lender or manufacturer export was read: none is published. The deals, contracts, balances and dates in the two agent runs are fictional; only the VINs are real.',
    '- Sales tax, DMV fees, warranty, incentives, parts and the other agents have no public file in their real format to test on.', '',
  ].filter((l) => l !== null);
  writeFileSync(join(ROOT, 'docs', 'realdata.md'), md.join('\n'));
  console.log(md.slice(8, 16).join('\n'));
}
const count = (l) => l.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});

if (process.argv.includes('--download')) await download();
await analyse();
