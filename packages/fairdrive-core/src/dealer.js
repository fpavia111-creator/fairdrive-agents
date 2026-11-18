// Dealer and repair-shop helpers shared by the Fairdrive agents. Pure functions, no I/O.
//
// Nothing here is a lender's, manufacturer's or state's rule. Aging buckets, VIN
// checks and name matching are working defaults; every agent takes its own
// settings (days, rates, limits) as arguments and says which defaults it used.
import { normalizeName } from './text.js';
import { readNumber } from './intl.js';

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const num = (v) => { if (v === null || v === undefined || v === '') return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null; const n = readNumber(v); return Number.isFinite(n) ? n : null; };
export const sum = (xs) => round2(xs.reduce((s, x) => s + (Number(x) || 0), 0));
export const str = (v) => String(v ?? '').trim();
export const pct = (part, whole) => (Number(whole) ? round2((Number(part) / Number(whole)) * 100) : null);

// ------------------------------------------------------------------- dates ----

const DAY = 86400000;
const toMs = (v) => { const s = str(v); if (!s) return NaN; const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`; return Date.parse(iso); };
export const isoDate = (v) => { const t = toMs(v); return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null; };
export function daysBetween(a, b) { const x = toMs(a), y = toMs(b); return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / DAY) : null; }
export function hoursBetween(a, b) { const x = toMs(a), y = toMs(b); return Number.isFinite(x) && Number.isFinite(y) ? Math.round(((y - x) / 3600000) * 100) / 100 : null; }
export function addDays(d, n) { const t = toMs(d); return Number.isFinite(t) ? new Date(t + n * DAY).toISOString().slice(0, 10) : null; }
export const inWindow = (d, from, to) => { const x = isoDate(d); return !!x && (!from || x >= isoDate(from)) && (!to || x <= isoDate(to)); };
/** The date to count ages from: the as_of argument, or today. */
export const asOfDate = (v) => isoDate(v) || new Date().toISOString().slice(0, 10);

/**
 * Aging bucket for a number of days: with edges [30, 60, 90] gives '0-30', '31-60',
 * '61-90' and '90+'. A missing age is 'unknown'.
 */
export function ageBucket(days, edges = [30, 60, 90]) {
  if (days === null || days === undefined || !Number.isFinite(Number(days))) return 'unknown';
  const d = Math.max(0, Number(days)); let lo = 0;
  for (const e of edges) { if (d <= e) return `${lo}-${e}`; lo = e + 1; }
  return `${edges.at(-1)}+`;
}
/** Every bucket label for a set of edges, in order (for tables that show empty buckets too). */
export const bucketLabels = (edges = [30, 60, 90]) => { const out = []; let lo = 0; for (const e of edges) { out.push(`${lo}-${e}`); lo = e + 1; } out.push(`${edges.at(-1)}+`); return out; };

// --------------------------------------------------------- ids and vehicles ----

/** Stock, deal, RO, claim and invoice numbers: upper case, letters and digits only, no leading zeros. */
export const normId = (v) => str(v).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^0+(?=\d)/, '');

const VIN_MAP = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const VIN_W = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
/** A VIN as upper-case letters and digits (spaces, dashes and dots dropped). */
export const normVin = (v) => str(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
/**
 * Does a 17-character VIN pass the North American check digit (position 9)? Returns
 * null for anything that is not 17 characters, since older and non-US VINs have no check digit.
 */
export function vinCheck(v) {
  const s = normVin(v);
  if (s.length !== 17) return null;
  if (/[IOQ]/.test(s)) return false;
  let total = 0;
  for (let i = 0; i < 17; i++) { const c = s[i]; const n = /\d/.test(c) ? Number(c) : VIN_MAP[c]; if (n === undefined) return false; total += n * VIN_W[i]; }
  const r = total % 11; return s[8] === (r === 10 ? 'X' : String(r));
}
/** The last eight characters, which lenders and manufacturers often print instead of the full VIN. */
export const vinTail = (v, n = 8) => { const s = normVin(v); return s.length >= n ? s.slice(-n) : s; };
/** Same vehicle: full VINs equal, or one side gives only the tail (at least 6 characters) and it matches. */
export function sameVin(a, b) {
  const x = normVin(a), y = normVin(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const short = x.length < y.length ? x : y, long = x.length < y.length ? y : x;
  return short.length >= 6 && short.length < 17 && long.endsWith(short);
}
/**
 * Index rows by VIN for matching against another file: get(vin) finds a row by full VIN
 * or by a unique tail of 8 (or of the shorter VIN given). Rows without a VIN are skipped.
 */
export function vinIndex(rows, vinOf = (r) => r.vin) {
  const full = new Map(); const tails = new Map();
  for (const r of rows) {
    const v = normVin(vinOf(r)); if (!v) continue;
    if (!full.has(v)) full.set(v, r);
    for (const n of [6, 7, 8]) { const t = v.slice(-n); if (!tails.has(`${n}:${t}`)) tails.set(`${n}:${t}`, []); tails.get(`${n}:${t}`).push(r); }
  }
  return {
    get(vin) {
      const v = normVin(vin); if (!v) return null;
      if (full.has(v)) return full.get(v);
      if (v.length >= 17) { const l = tails.get(`8:${v.slice(-8)}`) || []; const exact = l.filter((r) => normVin(vinOf(r)).length < 17); return exact.length === 1 ? exact[0] : null; }
      if (v.length < 6) return null;
      const l = tails.get(`${Math.min(8, v.length)}:${v.slice(-Math.min(8, v.length))}`) || [];
      const hit = l.filter((r) => sameVin(vinOf(r), v));
      return hit.length === 1 ? hit[0] : null;
    },
  };
}

/** Model year from the 10th VIN character (1980-2039 cycle, nearest to the given year). */
export function vinYear(v, near = new Date().getUTCFullYear()) {
  const s = normVin(v); if (s.length !== 17) return null;
  const codes = 'ABCDEFGHJKLMNPRSTVWXY123456789';
  const i = codes.indexOf(s[9]); if (i < 0) return null;
  const b = 2010 + i;
  return b <= near + 1 ? b : 1980 + i;
}

// -------------------------------------------------------------- party names ----

/** Canonical key for a lender, vendor, provider or insurer name: legal form dropped, folded. */
export function partyKey(v) {
  const s = str(v);
  if (!s) return '';
  return normalizeName(s) || normalizeName(s, { stripEntity: false }) || s.toLowerCase();
}
/** True when two names name the same party, or one is the other's first word(s) ("Harbor" and "Harbor Auto Finance"). */
export function sameParty(a, b) {
  const x = partyKey(a), y = partyKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [s, l] = x.length < y.length ? [x, y] : [y, x];
  return s.length >= 4 && l.startsWith(`${s} `);
}
/**
 * Group the party names of one data set: returns name -> group key. A shorter name joins a
 * longer one when exactly one longer name starts with it.
 */
export function partyGrouper(names) {
  const keys = [...new Set([...names].map(partyKey).filter(Boolean))].sort();
  const map = new Map(keys.map((k) => [k, k]));
  for (const k of keys) { const up = keys.filter((o) => o !== k && k.length >= 4 && o.startsWith(`${k} `)); if (up.length === 1) map.set(k, up[0]); }
  return (name) => { const k = partyKey(name); return map.get(k) ?? k; };
}
/** Is this the party the person named? partyIs(names, wanted)(name), using partyGrouper. */
export function partyIs(names, wanted) {
  const g = partyGrouper([...names, wanted]); const w = g(wanted);
  return (name) => !!w && g(name) === w;
}

// ------------------------------------------------------------------ tables ----

/** Group rows by a key function into a Map, keeping order. */
export function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
}
/** Sort helper: compare by several keys in order (numbers descending when the key starts with '-'). */
export function by(...keys) {
  return (a, b) => {
    for (const k of keys) {
      const desc = k.startsWith('-'); const f = desc ? k.slice(1) : k;
      const x = a[f], y = b[f];
      if (x === y) continue;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x) < String(y) ? -1 : 1;
      return desc ? -c : c;
    }
    return 0;
  };
}
/** Count rows by a key into [{ [name]: key, count, amount? }] sorted by count, then key. */
export function tally(rows, key, name = 'key', amountOf = null) {
  const m = new Map();
  for (const r of rows) { const k = key(r); if (k === null || k === undefined || k === '') continue; const e = m.get(k) || { [name]: k, count: 0, ...(amountOf ? { amount: 0 } : {}) }; e.count++; if (amountOf) e.amount = round2(e.amount + (Number(amountOf(r)) || 0)); m.set(k, e); }
  return [...m.values()].sort((a, b) => b.count - a.count || (amountOf ? b.amount - a.amount : 0) || (String(a[name]) < String(b[name]) ? -1 : 1));
}
/** yes/no/true/false/1/0/x/y/n read as a boolean; anything else (including empty) is null. */
export function yes(v) {
  const s = str(v).toLowerCase();
  if (!s) return null;
  if (/^(y|yes|true|1|x|ok|done|received|on file|present|ja|oui|sí|si|sim|はい|是|예)$/.test(s)) return true;
  if (/^(n|no|false|0|missing|not received|none|nein|non|não|nao|いいえ|否|아니오)$/.test(s)) return false;
  return null;
}
