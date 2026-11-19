#!/usr/bin/env node
// One-off, kept for the record (final pass, 19 Nov 2026): the fixture VINs began with 7ZZ, which NHTSA's
// decoder assigns to a real manufacturer. They now begin with 0ZZ: no world manufacturer identifier
// starts with 0, so no fixture VIN can name a real maker. The last 14 characters (and so every tail a
// fixture prints) are kept; the check digit (9th character) is recomputed so each VIN that passed the
// check still does. Rewrites the files in place, byte for byte apart from the VINs (legacy encodings
// are safe: a VIN is ASCII and starts with a byte that is never the second byte of a character).
//   node scripts/fictional-vins.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { vinCheck } = await import(pathToFileURL(join(ROOT, 'packages', 'fairdrive-core', 'src', 'index.js')).href);
const files = execFileSync('git', ['grep', '-l', '-I', '-a', '7ZZ'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !f.endsWith('fictional-vins.mjs'));
const CHARS = '0123456789X';
const fixDigit = (v, wantValid) => { for (const c of CHARS) { const t = v.slice(0, 8) + c + v.slice(9); if ((vinCheck(t) === true) === wantValid) return t; } return v; };
const map = new Map(); let n = 0;
for (const f of files) {
  const p = join(ROOT, f); const s = readFileSync(p).toString('latin1');
  const out = s.replace(/7ZZ[A-HJ-NPR-Z0-9]{14}/g, (v) => { if (!map.has(v)) map.set(v, fixDigit('0ZZ' + v.slice(3), vinCheck(v) === true)); n++; return map.get(v); });
  if (out !== s && !process.argv.includes('--check')) writeFileSync(p, Buffer.from(out, 'latin1'));
}
console.log(`${files.length} file(s), ${n} VIN occurrence(s), ${map.size} distinct VIN(s)${process.argv.includes('--check') ? ' still to rewrite' : ' rewritten'}; ${[...map.values()].filter((v) => vinCheck(v) === true).length} pass the check digit`);
